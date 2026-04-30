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
  const lo = Math.min(1, degrade);
  const hi = degrade > 1 ? Math.min(1, degrade - 1) : 0;
  return { lo, hi };
}

/** Scale degradation fractions to BP counts; floor at 1 to avoid degenerate zero-bases. */
export function calcDegradeAsBP(degrade: number, bases: number): DegradeBP {
  const f = calcDegradeAsFrac(degrade);
  return {
    lo: Math.max(1, Math.round(f.lo * bases)),
    hi: Math.max(1, Math.round(f.hi * bases)),
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function calcDeltaY(
  bases: number,
  aggregation: number,
  aspectRatio: number,
  ctx: SimContext,
): number {
  const T = GEL_SIM_TUNING;
  const curveBase = bufferEquals(ctx.gelBuffer, BUFFER_TAE) ? T.deltaY.curveBaseTAE : T.deltaY.curveBase;
  const curveExp = T.deltaY.curveExp;
  const aspectRatioMax = T.aspectRatioMax;
  const aspectRatioScale = T.deltaY.aspectRatioScale;
  const baseCountHigh = T.baseCountHigh;
  const notch = T.voltageNotch;

  // 1. size, normalized
  let y = (bases * aggregation) / baseCountHigh;
  y = clamp(y, 0, 1);

  // 2. aspect ratio (subtractive, time-dependent)
  const aspectDelta = ((aspectRatio - 1) / aspectRatioMax) * aspectRatioScale;
  y -= aspectDelta * ctx.time;

  // (TEST buffers branch in C++ is disabled — `if ((0))` — skip)

  // 3. curve
  y = curveBase + Math.pow(1 - y, curveExp);

  // 4. voltage
  const vn = (ctx.voltage - notch) / notch;
  y *= (1 + vn);

  // 5. time
  y *= ctx.time;

  return y;
}
