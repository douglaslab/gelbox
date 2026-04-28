import { describe, it, expect } from 'vitest';
import { mulberry32, rangeFloat, rangeInt } from '../../src/lib/sim/rng';

describe('mulberry32', () => {
  it('produces a deterministic sequence for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toEqual(b());
  });

  it('range floats stay within [lo, hi)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rangeFloat(r, -3, 5);
      expect(v).toBeGreaterThanOrEqual(-3);
      expect(v).toBeLessThan(5);
    }
  });

  it('range ints are integers within [lo, hi)', () => {
    const r = mulberry32(99);
    for (let i = 0; i < 200; i++) {
      const v = rangeInt(r, 0, 10);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });
});
