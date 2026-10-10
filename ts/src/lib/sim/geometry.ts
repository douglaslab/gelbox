// Port of ~/code/gelbox/src/GelSim.cpp:153-190 (flames + seeds) and 266-315 (geometry).
//
// calcBandGeometry takes pre-scaled deltaY values (caller multiplies by ySpaceScale).
// It returns the geometry-related fields a Band would have post-mobility, BEFORE the
// flames/smile/randSeed assembly which depends on rect.height — those happen in gelSim.ts.
//
// The wellDamage smear-up branch (C++ lines 300-303) is commented out in the C++; we keep
// it disabled here. The UI rect (b.mUIRect) is for hit-testing and not rendered, so we
// don't compute it in the TS port — the renderer only reads `rect`, `smearAbove`, `smearBelow`,
// `flameHeight`.

import { GEL_SIM_TUNING } from '../../data/tuning';
import type { Rect } from './band';
import type { SimContext } from './mobility';
import { bufferEquals, BUFFER_H2O } from './buffer';

export interface GeometryInput {
  wellRect: Rect;
  deltaY1:  number;  // pre-scaled by ctx.ySpaceScale
  deltaY2:  number;  // pre-scaled by ctx.ySpaceScale
  fatness:  number;  // wellToHeightScale (1.5) or wellToDyeHeightScale (3)
}

export interface GeometryOutput {
  rect:        Rect;
  smearAbove:  number;
  smearBelow:  number;
}

export function calcBandGeometry(ctx: SimContext, input: GeometryInput): GeometryOutput {
  const { wellRect, deltaY1, deltaY2, fatness } = input;

  // Move
  let y1 = wellRect.y1 + deltaY1;
  let y2 = wellRect.y2 + deltaY1;

  // Inflate (vertical only)
  const fatscale = ctx.time;
  const height = y2 - y1;
  const inflateAmt = (fatness - 1) * fatscale * 0.5 * height;
  y1 -= inflateAmt;
  y2 += inflateAmt;

  const rect: Rect = { x1: wellRect.x1, y1, x2: wellRect.x2, y2 };

  // Smear below: distance from rect.y2 down to wellRect.y2 + deltaY2.
  const smearBelow = (wellRect.y2 + deltaY2) - rect.y2;

  // Smear above: H2O bumps it to rect.height × 6 (clipped to fit between band and well bottom).
  let smearAbove = 0;  // C++ default Band has smearAbove=0 unless something sets it
  if (bufferEquals(ctx.gelBuffer, BUFFER_H2O)) {
    smearAbove = Math.max(smearAbove, (rect.y2 - rect.y1) * GEL_SIM_TUNING.smearUpWithH2O);
  }
  // (wellDamage smear-up disabled in C++ — skip)

  // Clip smear above with well bottom
  smearAbove = Math.min(smearAbove, rect.y1 - wellRect.y2);

  return { rect, smearAbove, smearBelow };
}

/**
 * Flame height scale, applied as: flameHeight = rect.height × calcFlames(mass).
 * Returns 0 below the overload threshold (140 ng), ramping linearly to 2× at 175 ng.
 */
export function calcFlames(mass: number): number {
  const overloadThresh = GEL_SIM_TUNING.flames.overloadThreshFrac * GEL_SIM_TUNING.sampleMassHigh;
  if (mass <= overloadThresh) return 0;
  const t = (mass - overloadThresh) / (GEL_SIM_TUNING.sampleMassHigh - overloadThresh);
  return t * GEL_SIM_TUNING.flames.maxScale;
}

/**
 * Deterministic seed derived from band metadata (lane, voltage, mass, rect.y1).
 * Mirrors the C++ formula at GelSim.cpp:171-183.
 */
export function calcRandSeed(lane: number, mass: number, voltage: number, rectY1: number): number {
  return (
    lane * 17 +
    Math.trunc(rectY1) +
    Math.trunc(voltage * 200) +
    Math.trunc(mass * 10)
  ) >>> 0;  // force to uint32
}

export function calcWellDamageRandSeed(lane: number): number {
  return (lane * 23) >>> 0;
}
