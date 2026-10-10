// Port of ~/code/gelbox/src/GelSim.cpp:227-264.
//
// Curve:
//   bases > 1500:   v = lmap(f32(bases), 1500, 10000, 2, 0); clamped >= 0; + baseline=1
//   bases <= 1500:  v = (1500 - bases) / 1500;  v = 1 + 2 + v*16
// Then × time × |voltage|/notch; max(1, ...).
//
// Note: aggregation and aspectRatio are unused in the C++ implementation but kept
// in the signature to mirror the upstream API (called with concrete values from
// fragAggregateToBand / dyeToBand later).

import { GEL_SIM_TUNING } from '../../data/tuning';
import type { SimContext } from './mobility';

const f32 = Math.fround;
// Match native float32 evaluation before the caller converts blur to int.
function lmap(v: number, inLo: number, inHi: number, outLo: number, outHi: number): number {
  return f32(outLo + f32(f32(f32(outHi - outLo) * f32(v - inLo)) / f32(inHi - inLo)));
}

export function calcBandDiffusion(
  bases: number,
  aggregation: number,
  aspectRatio: number,
  ctx: SimContext,
): number {
  void aggregation; void aspectRatio;  // unused — present in API for parity with C++
  const D = GEL_SIM_TUNING.diffusion;
  let v: number;
  if (bases > D.thresh) {
    v = lmap(f32(bases), D.thresh, D.upperThresh, D.threshAmount, 0);
    v = Math.max(0, v);
    v = f32(v + D.baseline);
  } else {
    const t = f32(f32(D.thresh - bases) / D.thresh);
    v = f32(D.baseline + D.threshAmount + f32(t * D.tinyScale));
  }
  v = f32(v * f32(ctx.time));
  v = f32(v * f32(Math.abs(f32(ctx.voltage)) / GEL_SIM_TUNING.voltageNotch));
  return Math.max(1, v);
}
