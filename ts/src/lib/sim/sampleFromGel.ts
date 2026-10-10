// Port of ~/code/gelbox/src/GelView.cpp pickBands (1273) + makeSampleFromGelPos
// (984). Pure functions — no React. Builds a synthetic Sample from the gel
// pixel under a loupe.

import type { Band, Rect } from './band';
import type { Sample, Fragment } from './sample';
import type { SimContext } from './mobility';
import { BUFFER_TBE } from './buffer';
import { solveBasesForY } from './solver';

export interface Vec2 { x: number; y: number }

/** Native source fragment index → base-pair-equivalent size at the pick point. */
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

/** Native Band::pickSmearAbove: 1 at the body, 0 at the far edge. */
export function pickSmearAbove(b: Band, p: Vec2): number {
  const f = Math.fround;
  const start = f(b.rect.y1 - b.smearAbove);
  if (b.smearAbove <= 0 || p.x < b.rect.x1 || p.x > b.rect.x2 || p.y < start || p.y > b.rect.y1) return 0;
  return f(f(p.y - start) / f(b.rect.y1 - start));
}

/** Native Band::pickSmearBelow, including horizontal bounds and body edge. */
export function pickSmearBelow(b: Band, p: Vec2): number {
  const f = Math.fround;
  const end = f(b.rect.y2 + b.smearBelow);
  if (b.smearBelow <= 0 || p.x < b.rect.x1 || p.x > b.rect.x2 || p.y < b.rect.y2 || p.y > end) return 0;
  return f(1 + f(-f(p.y - b.rect.y2) / f(end - b.rect.y2)));
}

export interface BandLaneFragment { lane: number; fragment: number }

function lerp(a: number, b: number, t: number): number {
  const f = Math.fround;
  return f(f(a) + f(f(f(b) - f(a)) * f(t)));
}

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
): { sample: Sample; degradeFilter: DegradeFilter; origins: BandLaneFragment[] } {
  p = { x: Math.fround(p.x), y: Math.fround(p.y) };
  const fragments: Fragment[] = [];
  const origins: BandLaneFragment[] = [];
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
      massScale = lerp(b.smearBrightnessAbove[1], b.smearBrightnessAbove[0], above);
    } else if (below > 0) {
      massScale = lerp(b.smearBrightnessBelow[1], b.smearBrightnessBelow[0], below);
    } else {
      // Blur halo: cubic falloff with distance. Math.max(1, blur) guards the
      // blur=0 case (dist/1 ≥ 1 → massScale 0), a benign zero-contribution edge.
      const d = 1 - Math.min(1, bandRectDistance(b.rect, p) / Math.max(1, b.blur));
      massScale = d * d * d;
    }

    const frag: Fragment = { ...src, color: [...src.color], mass: Math.fround(Math.fround(b.mass) * Math.fround(massScale)) };

    if (below > 0 || Math.fround(src.degrade) > 0.5) {
      const bpe = solveBasesForY({ targetY: p.y, aggregate: b.aggregate, frag: src, lane: lf.lane,
        ctx: { ...ctx, sampleBuffer: samples[lf.lane]!.buffer }, wellRect: wellRects[lf.lane] });
      // Native keys by source index, even when synthetic output indices differ.
      degradeFilter.set(lf.fragment, bpe);
    } else {
      frag.degrade = 0;
    }

    frag.aggregate = Array.from({ length: Math.max(src.aggregate.length, b.aggregate) },
      (_, i) => i === b.aggregate - 1 ? 1 : 0);

    fragments.push(frag);
    origins.push({lane:lf.lane,fragment:lf.fragment});
  }

  return { sample: { buffer: { ...BUFFER_TBE }, fragments }, degradeFilter, origins };
}
