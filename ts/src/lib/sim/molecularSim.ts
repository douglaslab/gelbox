// Phase-2 placeholder helpers for the middle Sample panel — wiring only,
// not visual parity with the C++ MolecularSim. Phase 3 will replace these
// with a faithful port of `MolecularSim.cpp`.
//
// Two responsibilities:
//   1. `calcTargetPop(mass)` — port of MolecularSim::calcTargetPop (line 128
//      of MolecularSim.cpp). Determines how many particles a fragment shows.
//   2. `layoutDots(...)` — deterministic per-fragment scatter inside the
//      sample panel rect. Used both by the canvas renderer and by tests.

import { mulberry32 } from './rng';
import { GEL_SIM_TUNING } from '../../data/tuning';
import type { Fragment, Sample } from './sample';
import { isDyeFragment } from './sample';

// MolecularSim::kTuning defaults from include/MolecularSim.h:25-26.
const NUM_PARTS_PER_MASS_HIGH = 50;
const NUM_PARTS_EXP           = 0.5;

/**
 * Port of `MolecularSim::calcTargetPop(mass)`:
 *
 *     massNorm = constrain(mass / sampleMassHigh, 0..1)
 *     pop      = massNorm^numPartsExp * numPartsPerMassHigh
 *
 * Returned value is rounded — the C++ uses it as a continuous target the
 * sim drifts toward, but for a static placeholder we just realize floor(pop).
 */
export function calcTargetPop(mass: number): number {
  const massNorm = Math.max(0, Math.min(1, mass / GEL_SIM_TUNING.sampleMassHigh));
  const pop = Math.pow(massNorm, NUM_PARTS_EXP) * NUM_PARTS_PER_MASS_HIGH;
  return Math.round(pop);
}

export interface DotLayout {
  fragmentIndex: number;
  cx: number;        // CSS px relative to the canvas
  cy: number;
  r:  number;
  color: readonly [number, number, number];  // linear RGB 0..1
}

export interface LayoutDotsOpts {
  /** Width and height of the canvas in CSS pixels. */
  width:  number;
  height: number;
  /** Lane index — used as part of the seed so each lane gets its own pattern. */
  laneIndex: number;
  /** Fragments to lay out. Dye fragments are skipped (matches C++ MolecularSim). */
  fragments: Fragment[];
  /** Inset on all sides where dots can spawn. Defaults to 24px. */
  padding?: number;
  /** Dot radius in CSS pixels. Defaults to 4. */
  radius?: number;
}

/**
 * Lay out dots for every (non-dye) fragment in `fragments`. Deterministic:
 * `mulberry32` seeded by `(laneIndex * 31 + fragmentIndex + 1)` so every
 * (lane, fragment) gets a stable scatter pattern. Tests rely on this.
 */
export function layoutDots(opts: LayoutDotsOpts): DotLayout[] {
  const padding = opts.padding ?? 24;
  const radius  = opts.radius  ?? 4;
  const x0 = padding;
  const y0 = padding;
  const x1 = opts.width  - padding;
  const y1 = opts.height - padding;
  const rangeX = Math.max(0, x1 - x0);
  const rangeY = Math.max(0, y1 - y0);

  const out: DotLayout[] = [];
  for (let fi = 0; fi < opts.fragments.length; fi++) {
    const f = opts.fragments[fi];
    if (isDyeFragment(f)) continue;
    const n = calcTargetPop(f.mass);
    if (n <= 0) continue;
    const rng = mulberry32(opts.laneIndex * 31 + fi + 1);
    for (let i = 0; i < n; i++) {
      out.push({
        fragmentIndex: fi,
        cx: x0 + rng() * rangeX,
        cy: y0 + rng() * rangeY,
        r:  radius,
        color: f.color,
      });
    }
  }
  return out;
}

/** Linear-RGB → sRGB hex, matching GelOverlay. */
export function linearRgbToSrgbHex(rgb: readonly [number, number, number]): string {
  const toByte = (c: number) => {
    const srgb = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(srgb * 255)));
  };
  const [r, g, b] = rgb.map(toByte);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export interface PickResult {
  dotIndex:      number;
  fragmentIndex: number;
}

/**
 * Hit-test against laid-out dots. Iterates in reverse (top-most first) and
 * returns the first whose centre is within `pickRadius` of (x, y).
 * `pickRadius` defaults to `dot.r + 2` — slightly inflated so small dots
 * remain clickable, mirroring `MolecularSim::pickPart` which inflates by
 * `kTuning.mPartMinPickRadius`.
 */
export function pickDot(
  dots: DotLayout[],
  x: number,
  y: number,
  pickRadius?: number,
): PickResult | null {
  for (let i = dots.length - 1; i >= 0; i--) {
    const d = dots[i];
    const r = pickRadius ?? (d.r + 2);
    const dx = x - d.cx;
    const dy = y - d.cy;
    if (dx * dx + dy * dy <= r * r) {
      return { dotIndex: i, fragmentIndex: d.fragmentIndex };
    }
  }
  return null;
}

/** Convenience: total fragment-particle count for a sample. */
export function totalDotCount(sample: Sample): number {
  let n = 0;
  for (const f of sample.fragments) {
    if (!isDyeFragment(f)) n += calcTargetPop(f.mass);
  }
  return n;
}
