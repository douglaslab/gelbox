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

export function calcDeltaY(
  bases: number,
  aggregation: number,
  aspectRatio: number,
  ctx: SimContext,
): number {
  // Native inputs, tuning and every arithmetic intermediate are float32.
  // Rounding only the returned Y changes inverse-search decisions at integer pixels.
  const f = Math.fround;
  const T = GEL_SIM_TUNING;
  const curveBase = f(bufferEquals(ctx.gelBuffer, BUFFER_TAE) ? T.deltaY.curveBaseTAE : T.deltaY.curveBase);
  const time = f(ctx.time);
  let y = clamp(f(f(bases * aggregation) / f(T.baseCountHigh)), 0, 1);
  const aspectDelta = f(f(f(f(aspectRatio) - 1) / f(T.aspectRatioMax)) * f(T.deltaY.aspectRatioScale));
  y = f(y - f(aspectDelta * time));
  y = f(curveBase + f(Math.pow(f(1 - y), f(T.deltaY.curveExp))));
  const notch = f(T.voltageNotch);
  const vn = f(f(f(ctx.voltage) - notch) / notch);
  y = f(y * f(1 + vn));
  return f(y * time);
}
