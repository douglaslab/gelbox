// Port of ~/code/gelbox/src/GelSim.cpp lines 76-151.
//
// Five-phase mobility curve:
//   1. y = bases × aggregation, normalized by baseCountHigh, clamped to [0,1].
//   2. Aspect-ratio shift: (aspectRatio - 1)/aspectRatioMax × aspectRatioScale × time, subtracted.
//   3. Curve: y = curveBase + (1 - y)^curveExp.
//   4. Voltage scale: × (1 + (V - notch) / notch).
//   5. Time scale: × time.
// Buffer detection: if gelBuffer == TAE, use curveBaseTAE (0.07); else curveBase (0.05).
// The C++ "TEST buffers" branch (GelSim.cpp:130-136) is wrapped in `if ((0))` and stays disabled here.

import { GEL_SIM_TUNING } from '../../data/tuning';
import { bufferEquals, BUFFER_TAE, type Buffer } from './buffer';

export interface SimContext {
  voltage:      number;   // V; default notch = 70
  time:         number;   // 0..1 normalized
  ySpaceScale:  number;   // pixel height of usable lane area
  wellDamage:   number;   // 0..1
  gelBuffer:    Buffer;
  sampleBuffer: Buffer;
}

export interface DegradeFrac { lo: number; hi: number; }
export interface DegradeBP   { lo: number; hi: number; }

/**
 * As degrade goes 0..1, lo (band's y2 / lower end) grows toward 1 (band shrinks at the lo end).
 * As degrade goes 1..2, hi (band's y1 / upper end) grows toward 1.
 */
export function calcDegradeAsFrac(degrade: number): DegradeFrac {
  degrade = Math.fround(degrade);
  const lo = Math.min(1, degrade);
  const hi = degrade > 1 ? Math.min(1, Math.fround(degrade - 1)) : 0;
  return { lo, hi };
}

/** Scale degradation fractions to BP counts; floor at 1 to avoid degenerate zero-bases. */
export function calcDegradeAsBP(degrade: number, bases: number): DegradeBP {
  const f = calcDegradeAsFrac(degrade);
  return {
    lo: Math.max(1, Math.trunc(Math.fround(f.lo * Math.fround(bases)))),
    hi: Math.max(1, Math.trunc(Math.fround(f.hi * Math.fround(bases)))),
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function mobilityFactors(
  bases: number,
  aggregation: number,
  aspectRatio: number,
  ctx: SimContext,
  releaseGeometry = false,
): { curve: number; voltage: number; time: number } {
  // Native inputs, tuning and every arithmetic intermediate are float32.
  // Rounding only the returned Y changes inverse-search decisions at integer pixels.
  const f = Math.fround;
  const T = GEL_SIM_TUNING;
  const curveBase = f(bufferEquals(ctx.gelBuffer, BUFFER_TAE) ? T.deltaY.curveBaseTAE : T.deltaY.curveBase);
  const time = f(ctx.time);
  // Release calcBandGeometry shares a rounded reciprocal between endpoints
  // (original x86 0x1000573ba/3c2), unlike the standalone source-model helper.
  const effectiveBases = f(bases * aggregation);
  const normalized = releaseGeometry
    ? f(effectiveBases * f(1 / f(T.baseCountHigh)))
    : f(effectiveBases / f(T.baseCountHigh));
  let y = clamp(normalized, 0, 1);
  const aspectUnit = f(f(f(aspectRatio) - 1) / f(T.aspectRatioMax));
  let powerBase: number;
  if (releaseGeometry) {
    // Release x86 0x1000573da/3e2/3e6 scales shape by time first, then
    // 0x1000573f9/40e adds it to (1-normalized). Reassociation changes
    // float32 rounding for fractional shape/time controls.
    const aspectShift = f(f(aspectUnit * time) * f(T.deltaY.aspectRatioScale));
    powerBase = f(f(1 - y) + aspectShift);
  } else {
    const aspectDelta = f(aspectUnit * f(T.deltaY.aspectRatioScale));
    y = f(y - f(aspectDelta * time));
    powerBase = f(1 - y);
  }
  y = f(curveBase + f(Math.pow(powerBase, f(T.deltaY.curveExp))));
  const notch = f(T.voltageNotch);
  const vn = f(f(f(ctx.voltage) - notch) / notch);
  return { curve: y, voltage: f(1 + vn), time };
}

/** Unscaled source-model mobility, used by callers outside band geometry. */
export function calcDeltaY(bases: number, aggregation: number, aspectRatio: number, ctx: SimContext): number {
  const { curve, voltage, time } = mobilityFactors(bases, aggregation, aspectRatio, ctx);
  return Math.fround(Math.fround(curve * voltage) * time);
}

/** Original Release calcBandGeometry groups the spatial scale before the curve.
 * Its fast-math x86 instructions at 0x10005744c/4ab/4af and 4bc/4c0/4c5
 * use these respective upper/lower groupings. Preserve each float32 result:
 * subpixel changes can decide which overlapping aggregate is selected.
 */
export function calcBandDeltaY(bases: number, aggregation: number, aspectRatio: number, ctx: SimContext, lower: boolean): number {
  const f = Math.fround;
  const { curve, voltage, time } = mobilityFactors(bases, aggregation, aspectRatio, ctx, true);
  const space = f(ctx.ySpaceScale);
  const scale = lower ? f(f(space * time) * voltage) : f(f(time * voltage) * space);
  return f(scale * curve);
}
