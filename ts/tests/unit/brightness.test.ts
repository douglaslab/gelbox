import { describe, it, expect } from 'vitest';
import { calcBandAlpha } from '../../src/lib/sim/brightness';

describe('calcBandAlpha', () => {
  it('mass=0 → 0', () => {
    expect(calcBandAlpha(0, 0)).toBe(0);
  });
  it('mass=massHigh, no degrade → 1', () => {
    expect(calcBandAlpha(175, 0)).toBeCloseTo(1, 6);
  });
  it('clamps mass above massHigh → 1 (no degrade)', () => {
    expect(calcBandAlpha(500, 0)).toBeCloseTo(1, 6);
  });
  it('mass=massHigh, full degrade=2 → 0', () => {
    expect(calcBandAlpha(175, 2)).toBe(0);
  });
  it('half mass, no degrade: pow(0.5, 0.75) ≈ 0.5946', () => {
    expect(calcBandAlpha(87.5, 0)).toBeCloseTo(Math.pow(0.5, 0.75), 6);
  });
  it('full mass, degrade=1 → pow(0.2929, 0.75) ≈ 0.398', () => {
    const expected = Math.pow(1 - Math.sqrt(0.5), 0.75);
    expect(calcBandAlpha(175, 1)).toBeCloseTo(expected, 6);
  });
});
