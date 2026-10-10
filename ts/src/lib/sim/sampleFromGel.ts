// Port of ~/code/gelbox/src/GelView.cpp pickBands (1273) + makeSampleFromGelPos
// (984). Pure functions — no React. Builds a synthetic Sample from the gel
// pixel under a loupe.

import type { Band, Rect } from './band';
import type { Sample, Fragment } from './sample';
import type { SimContext } from './mobility';
import { solveBasesForY } from './solver';

export interface Vec2 { x: number; y: number }

/** fragmentIndex → base-pair-equivalent size after degradation at the pick point. */
export type DegradeFilter = Map<number, number>;

export interface PickedBand { band: Band; index: number }

/** Native GelSim constructs mUIRect from smear and blur, then adds flames. */
export function bandUIRect(b: Band): Rect {
  const f = Math.fround;
  return {
    x1: f(b.rect.x1 - b.blur),
    x2: f(b.rect.x2 + b.blur),
    y1: f(f(f(b.rect.y1 - Math.max(b.smearAbove, 0)) - b.blur) - f(b.flameHeight)),
    y2: f(f(b.rect.y2 + b.smearBelow) + b.blur),
  };
}

function rectContains(r: Rect, p: Vec2): boolean {
  return p.x >= r.x1 && p.x <= r.x2 && p.y >= r.y1 && p.y <= r.y2;
}

export function pickBands(p: Vec2, bands: readonly Band[]): PickedBand[] {
  const out: PickedBand[] = [];
  for (let i = 0; i < bands.length; i++) {
    if (rectContains(bandUIRect(bands[i]), p)) out.push({ band: bands[i], index: i });
  }
  return out;
}

/** GelView::pickBand: minimum hit height; preserve the first equal minimum. */
export function pickBand(p: Vec2, bands: readonly Band[]): PickedBand | null {
  let picked: PickedBand | null = null;
  let smallest = Infinity;
  for (const candidate of pickBands(p, bands)) {
    const rect = bandUIRect(candidate.band);
    const height = Math.fround(rect.y2 - rect.y1);
    if (height < smallest) { picked = candidate; smallest = height; }
  }
  return picked;
}

/** 0 at body top edge → 1 at far smear edge; 0 if not above the body within the smear. */
export function pickSmearAbove(b: Band, p: Vec2): number {
  if (b.smearAbove <= 0) return 0;
  const d = b.rect.y1 - p.y;
  if (d <= 0 || d > b.smearAbove) return 0;
  return d / b.smearAbove;
}

/** 0 at body bottom edge → 1 at far smear edge; 0 if not below the body within the smear. */
export function pickSmearBelow(b: Band, p: Vec2): number {
  if (b.smearBelow <= 0) return 0;
  const d = p.y - b.rect.y2;
  if (d <= 0 || d > b.smearBelow) return 0;
  return d / b.smearBelow;
}

export interface BandLaneFragment { lane: number; fragment: number }

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

function bandRectDistance(r: Rect, p: Vec2): number {
  const dx = Math.max(r.x1 - p.x, 0, p.x - r.x2);
  const dy = Math.max(r.y1 - p.y, 0, p.y - r.y2);
  return Math.hypot(dx, dy);
}

/**
 * Build a synthetic Sample (and degrade filter) from the bands under a gel
 * pixel. Mirrors C++ GelView::makeSampleFromGelPos. `bandToLaneFragment` maps
 * each band index to its source (lane, fragment); `samples`/`wellRects` are the
 * gel's per-lane data; `ctx` feeds the reverse solver.
 */
export function makeSampleFromGel(
  p: Vec2,
  bands: readonly Band[],
  bandToLaneFragment: readonly BandLaneFragment[],
  samples: readonly (Sample | null)[],
  wellRects: readonly Rect[],
  ctx: SimContext,
): { sample: Sample; degradeFilter: DegradeFilter } {
  const fragments: Fragment[] = [];
  const degradeFilter: DegradeFilter = new Map();

  for (const { band: b, index } of pickBands(p, bands)) {
    const lf = bandToLaneFragment[index];
    const src = samples[lf.lane]?.fragments[lf.fragment];
    if (!src) continue;

    const above = pickSmearAbove(b, p);
    const below = pickSmearBelow(b, p);
    let massScale: number;
    if (p.x >= b.rect.x1 && p.x <= b.rect.x2 && p.y >= b.rect.y1 && p.y <= b.rect.y2) {
      massScale = b.brightness;
    } else if (above > 0) {
      massScale = lerp(b.smearBrightnessAbove[0], b.smearBrightnessAbove[1], above);
    } else if (below > 0) {
      massScale = lerp(b.smearBrightnessBelow[0], b.smearBrightnessBelow[1], below);
    } else {
      // Blur halo: cubic falloff with distance. Math.max(1, blur) guards the
      // blur=0 case (dist/1 ≥ 1 → massScale 0), a benign zero-contribution edge.
      const d = 1 - Math.min(1, bandRectDistance(b.rect, p) / Math.max(1, b.blur));
      massScale = d * d * d;
    }

    const frag: Fragment = { ...src, mass: b.mass * massScale };

    if (below > 0 || src.degrade > 0.5) {
      const bpe = solveBasesForY({ targetY: p.y, frag: src, lane: lf.lane, ctx, wellRect: wellRects[lf.lane] });
      degradeFilter.set(fragments.length, bpe);
    } else {
      frag.degrade = 0;
    }

    frag.aggregate = b.aggregate > 1
      ? Array.from({ length: b.aggregate }, (_, i) => (i === b.aggregate - 1 ? 1 : 0))
      : [];

    fragments.push(frag);
  }

  return { sample: { buffer: ctx.sampleBuffer, fragments }, degradeFilter };
}
