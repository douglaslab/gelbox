import { describe, it, expect } from 'vitest';
import { pickBands, pickSmearAbove, pickSmearBelow, bandUIRect } from '../../src/lib/sim/sampleFromGel';
import type { Band } from '../../src/lib/sim/band';

function band(partial: Partial<Band> = {}): Band {
  return {
    rect: { x1: 10, y1: 100, x2: 50, y2: 120 },
    smearAbove: 10, smearBelow: 20,
    smearBrightnessAbove: [1, 0], smearBrightnessBelow: [0.8, 0],
    flameHeight: 0, smileHeight: 0, smileExp: 0,
    blur: 4, brightness: 0.9, color: [1, 1, 1],
    randSeed: 0, wellDamage: 0, wellDamageRandSeed: 0,
    mass: 100, aggregate: 1, degrade: 0,
    ...partial,
  };
}

describe('bandUIRect', () => {
  it('expands by blur all sides, smearAbove/flame above, smearBelow below', () => {
    const r = bandUIRect(band());
    expect(r.x1).toBe(10 - 4);
    expect(r.x2).toBe(50 + 4);
    expect(r.y1).toBe(100 - 10 - 4);
    expect(r.y2).toBe(120 + 20 + 4);
  });
});

describe('pickBands', () => {
  it('returns bands whose UI rect contains the point, with their original index', () => {
    const bands = [band(), band({ rect: { x1: 200, y1: 100, x2: 240, y2: 120 } })];
    const hit = pickBands({ x: 30, y: 110 }, bands);
    expect(hit.map((h) => h.index)).toEqual([0]);
  });
});

describe('pickSmearAbove / pickSmearBelow', () => {
  it('pickSmearAbove is 0 at the body top edge and approaches 1 at the far smear edge', () => {
    const b = band();
    expect(pickSmearAbove(b, { x: 30, y: 100 })).toBeCloseTo(0, 5);
    expect(pickSmearAbove(b, { x: 30, y: 95 })).toBeCloseTo(0.5, 5);
    expect(pickSmearAbove(b, { x: 30, y: 110 })).toBe(0);
  });

  it('pickSmearBelow is 0 at the body bottom edge and approaches 1 at the far smear edge', () => {
    const b = band();
    expect(pickSmearBelow(b, { x: 30, y: 120 })).toBeCloseTo(0, 5);
    expect(pickSmearBelow(b, { x: 30, y: 130 })).toBeCloseTo(0.5, 5);
    expect(pickSmearBelow(b, { x: 30, y: 110 })).toBe(0);
  });
});
