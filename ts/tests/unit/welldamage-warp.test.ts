import { describe, it, expect } from 'vitest';
import { buildWellDamageWarp } from '../../src/lib/gel/welldamage';

describe('buildWellDamageWarp', () => {
  it('returns null when damage is 0', () => {
    const out = buildWellDamageWarp({
      rect: { x1: 0, y1: 0, x2: 100, y2: 10 },
      wellDamage: 0,
      wellDamageRandSeed: 1,
    }, { width: 100, height: 100 });
    expect(out).toBeNull();
  });

  it('is deterministic for the same seed', () => {
    const a = buildWellDamageWarp({
      rect: { x1: 0, y1: 0, x2: 100, y2: 10 },
      wellDamage: 0.7,
      wellDamageRandSeed: 42,
    }, { width: 100, height: 100 })!;
    const b = buildWellDamageWarp({
      rect: { x1: 0, y1: 0, x2: 100, y2: 10 },
      wellDamage: 0.7,
      wellDamageRandSeed: 42,
    }, { width: 100, height: 100 })!;
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });

  it('produces a 1×width RGBA8 buffer', () => {
    const out = buildWellDamageWarp({
      rect: { x1: 0, y1: 0, x2: 100, y2: 10 },
      wellDamage: 0.5,
      wellDamageRandSeed: 1,
    }, { width: 100, height: 100 })!;
    expect(out.width).toBe(100);
    expect(out.data.byteLength).toBe(100 * 4);
  });
});
