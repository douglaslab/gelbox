import { describe, expect, it } from 'vitest';
import { sampleFragRefEq, type SampleFragRef } from '../../src/lib/gel/sampleFragRef';

describe('sampleFragRefEq', () => {
  it('returns true for two nulls', () => {
    expect(sampleFragRefEq(null, null)).toBe(true);
  });

  it('returns false when one is null', () => {
    expect(sampleFragRefEq({ lane: 0, fragmentIndex: 0 }, null)).toBe(false);
    expect(sampleFragRefEq(null, { lane: 0, fragmentIndex: 0 })).toBe(false);
  });

  it('returns true for matching lane + fragmentIndex', () => {
    const a: SampleFragRef = { lane: 2, fragmentIndex: 5 };
    const b: SampleFragRef = { lane: 2, fragmentIndex: 5 };
    expect(sampleFragRefEq(a, b)).toBe(true);
  });

  it('returns true when both fragmentIndex are null and lanes match', () => {
    const a: SampleFragRef = { lane: 3, fragmentIndex: null };
    const b: SampleFragRef = { lane: 3, fragmentIndex: null };
    expect(sampleFragRefEq(a, b)).toBe(true);
  });

  it('returns false when lanes differ', () => {
    expect(sampleFragRefEq(
      { lane: 1, fragmentIndex: 0 },
      { lane: 2, fragmentIndex: 0 },
    )).toBe(false);
  });

  it('returns false when fragmentIndex differ', () => {
    expect(sampleFragRefEq(
      { lane: 1, fragmentIndex: 0 },
      { lane: 1, fragmentIndex: 1 },
    )).toBe(false);
    expect(sampleFragRefEq(
      { lane: 1, fragmentIndex: null },
      { lane: 1, fragmentIndex: 0 },
    )).toBe(false);
  });
});
