import { describe, it, expect } from 'vitest';
import { calcFlames, calcBandGeometry } from '../../src/lib/sim/geometry';
import type { SimContext } from '../../src/lib/sim/mobility';
import { BUFFER_TBE, BUFFER_H2O } from '../../src/lib/sim/buffer';

const CTX_DEFAULT: SimContext = {
  voltage: 70, time: 1, ySpaceScale: 1, wellDamage: 0,
  gelBuffer: BUFFER_TBE, sampleBuffer: BUFFER_TBE,
};

describe('calcFlames', () => {
  it('mass below 140 ng (overload threshold) → 0', () => {
    expect(calcFlames(100)).toBe(0);
    expect(calcFlames(140)).toBe(0);  // exactly at threshold
  });
  it('mass at sampleMassHigh=175 → 2 (max scale)', () => {
    expect(calcFlames(175)).toBeCloseTo(2, 6);
  });
  it('halfway between 140 and 175 = 157.5 → 1', () => {
    expect(calcFlames(157.5)).toBeCloseTo(1, 6);
  });
});

describe('calcBandGeometry', () => {
  it('places band at wellRect + deltaY (pixel space) with no inflate at fatness=1', () => {
    const wellRect = { x1: 50, y1: 10, x2: 60, y2: 20 };
    const out = calcBandGeometry(CTX_DEFAULT, {
      wellRect, deltaY1: 100, deltaY2: 100, fatness: 1,
    });
    expect(out.rect).toEqual({ x1: 50, y1: 110, x2: 60, y2: 120 });
    expect(out.smearBelow).toBe(0);
    expect(out.smearAbove).toBe(0);
  });
  it('inflates rect vertically when fatness > 1 (and time > 0)', () => {
    const wellRect = { x1: 50, y1: 10, x2: 60, y2: 20 };
    const out = calcBandGeometry(CTX_DEFAULT, {
      wellRect, deltaY1: 100, deltaY2: 100, fatness: 1.5,
    });
    expect(out.rect.y1).toBeCloseTo(110 - 2.5, 6);
    expect(out.rect.y2).toBeCloseTo(120 + 2.5, 6);
  });
  it('H2O buffer: smearAbove gets bumped to rect.height × 6 (then clipped to wellRect gap)', () => {
    const wellRect = { x1: 50, y1: 10, x2: 60, y2: 20 };
    const out = calcBandGeometry({ ...CTX_DEFAULT, gelBuffer: BUFFER_H2O }, {
      wellRect, deltaY1: 200, deltaY2: 200, fatness: 1,
    });
    expect(out.smearAbove).toBe(60);
  });
  it('H2O smearAbove gets clipped when band is close to well bottom', () => {
    const wellRect = { x1: 50, y1: 10, x2: 60, y2: 20 };
    const out = calcBandGeometry({ ...CTX_DEFAULT, gelBuffer: BUFFER_H2O }, {
      wellRect, deltaY1: 30, deltaY2: 30, fatness: 1,
    });
    expect(out.smearAbove).toBe(20);
  });
  it('smearBelow extends down by (wellRect.y2 + deltaY2 - rect.y2)', () => {
    const wellRect = { x1: 50, y1: 10, x2: 60, y2: 20 };
    const out = calcBandGeometry(CTX_DEFAULT, {
      wellRect, deltaY1: 100, deltaY2: 130, fatness: 1,
    });
    expect(out.smearBelow).toBe(30);
  });
});
