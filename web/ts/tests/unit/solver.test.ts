import { describe, it, expect } from 'vitest';
import { solveBasesForY } from '../../src/lib/sim/solver';
import type { SimContext } from '../../src/lib/sim/mobility';
import type { Fragment } from '../../src/lib/sim/sample';
import { BUFFER_TBE } from '../../src/lib/sim/buffer';
import { fragToBands } from '../../src/lib/sim/gelSim';
import type { Sample } from '../../src/lib/sim/sample';

const CTX: SimContext = {
  voltage: 70, time: 0.5, ySpaceScale: 200, wellDamage: 0,
  gelBuffer: BUFFER_TBE, sampleBuffer: BUFFER_TBE,
};
const WELL = { x1: 140, y1: 8, x2: 180, y2: 18 };

const FRAG: Fragment = {
  bases: 1000, mass: 50, degrade: 0, dye: -1, aggregate: [],
  aspectRatio: 1, color: [1, 1, 1],
};

function bandY1ForBases(bases: number): number {
  const sample: Sample = { buffer: BUFFER_TBE, fragments: [{ ...FRAG, bases }] };
  const bands = fragToBands(sample, 0, WELL, 0, CTX);
  return bands[0].rect.y1;
}

describe('solveBasesForY', () => {
  it('round-trip: result bp produces band y1 within 1px of target', () => {
    // Pick a known bp, find its y1, then solve for that y1; expect bp ≈ original
    const knownBp = 5000;
    const targetY = bandY1ForBases(knownBp);
    const solvedBp = solveBasesForY({ targetY, frag: FRAG, lane: 0, ctx: CTX, wellRect: WELL });
    // Solver works in integer-bp; tolerance ±10 bp
    expect(Math.abs(solvedBp - knownBp)).toBeLessThanOrEqual(10);
  });

  it('larger target Y (band lower on canvas) → smaller bp', () => {
    const yHigh = bandY1ForBases(10000);  // big bp → near top of canvas (small y)
    const yLow  = bandY1ForBases(500);    // small bp → far down (large y)
    expect(yHigh).toBeLessThan(yLow);

    const bpForHigh = solveBasesForY({ targetY: yHigh, frag: FRAG, lane: 0, ctx: CTX, wellRect: WELL });
    const bpForLow  = solveBasesForY({ targetY: yLow,  frag: FRAG, lane: 0, ctx: CTX, wellRect: WELL });
    expect(bpForHigh).toBeGreaterThan(bpForLow);
  });

  it('clamps to [1, baseCountHigh]: too-high target → bp=1; too-low target → bp=baseCountHigh', () => {
    // Target way past anything achievable: y=10000 → bp pinned to 1
    const big = solveBasesForY({ targetY: 10000, frag: FRAG, lane: 0, ctx: CTX, wellRect: WELL });
    expect(big).toBe(1);

    // Target at the well (y near 0) → bp pinned to baseCountHigh
    const tiny = solveBasesForY({ targetY: 0, frag: FRAG, lane: 0, ctx: CTX, wellRect: WELL });
    expect(tiny).toBe(14000);
  });

  it('respects ctx.voltage (different voltage → different solution for same target Y)', () => {
    const targetY = 100;
    const at70 = solveBasesForY({ targetY, frag: FRAG, lane: 0, ctx: CTX, wellRect: WELL });
    const at140 = solveBasesForY({ targetY, frag: FRAG, lane: 0, ctx: { ...CTX, voltage: 140 }, wellRect: WELL });
    // At 2× voltage, same target y is reached by molecule that traveled half as far
    // → larger bp
    expect(at140).toBeGreaterThan(at70);
  });
});
