// Port of ~/code/gelbox/src/GelView.cpp pickBands (1273) + makeSampleFromGelPos
// (984). Pure functions — no React. Builds a synthetic Sample from the gel
// pixel under a loupe. (makeSampleFromGel lands in the next task.)

import type { Band, Rect } from './band';

export interface Vec2 { x: number; y: number }

/** fragmentIndex → base-pair-equivalent size after degradation at the pick point. */
export type DegradeFilter = Map<number, number>;

export interface PickedBand { band: Band; index: number }

/**
 * The hit-test rect: body expanded by blur (all sides), max(smearAbove,
 * flameHeight) above, smearBelow below. Including the flame extent keeps the
 * visible flame clickable; a pick that lands in the flame zone (above the
 * smear) falls through to makeSampleFromGel's blur-distance branch and yields
 * ~zero mass, which is the intended falloff.
 */
export function bandUIRect(b: Band): Rect {
  const upExt = Math.max(b.smearAbove, b.flameHeight);
  return {
    x1: b.rect.x1 - b.blur,
    x2: b.rect.x2 + b.blur,
    y1: b.rect.y1 - upExt - b.blur,
    y2: b.rect.y2 + b.smearBelow + b.blur,
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
