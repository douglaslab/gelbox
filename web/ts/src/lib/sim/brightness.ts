// Port of ~/code/gelbox/src/GelSim.cpp:192-225 (the live branch; the commented-out
// "diffuseScale via area ratio" tail at lines 206-224 stays disabled in the port).

import { GEL_SIM_TUNING } from '../../data/tuning';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Returns the band's overall brightness multiplier as a function of mass and
 * degradation. The output is clamped to [0,1]. Used as `Band.brightness` for
 * dye bands and as the `a` term in the fragment-band brightness assembly.
 */
export function calcBandAlpha(mass: number, degrade: number): number {
  let a = clamp(mass / GEL_SIM_TUNING.sampleMassHigh, 0, 1);
  const d = Math.sqrt(degrade / 2);
  a *= 1 - d;
  a = Math.pow(a, 0.75);
  return a;
}
