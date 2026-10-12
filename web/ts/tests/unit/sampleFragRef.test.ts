import { BUFFER_TBE } from '../../src/lib/sim/buffer';
import { describe, expect, it } from 'vitest';
import { sampleFragRefEq, type SampleFragRef } from '../../src/lib/gel/sampleFragRef';

const samples = Array.from({length: 5}, () => ({fragments: [], buffer: BUFFER_TBE}));

describe('sampleFragRefEq', () => {
  it('returns true for two nulls', () => {
    expect(sampleFragRefEq(null, null)).toBe(true);
  });

  it('returns false when one is null', () => {
    expect(sampleFragRefEq({ sample: samples[0], fragmentIndex: 0 }, null)).toBe(false);
    expect(sampleFragRefEq(null, { sample: samples[0], fragmentIndex: 0 })).toBe(false);
  });

  it('returns true for matching sample + fragmentIndex', () => {
    const a: SampleFragRef = { sample: samples[2], fragmentIndex: 5 };
    const b: SampleFragRef = { sample: samples[2], fragmentIndex: 5 };
    expect(sampleFragRefEq(a, b)).toBe(true);
  });

  it('returns true when both fragmentIndex are null and samples match', () => {
    const a: SampleFragRef = { sample: samples[3], fragmentIndex: null };
    const b: SampleFragRef = { sample: samples[3], fragmentIndex: null };
    expect(sampleFragRefEq(a, b)).toBe(true);
  });

  it('returns false when samples differ', () => {
    expect(sampleFragRefEq(
      { sample: samples[1], fragmentIndex: 0 },
      { sample: samples[2], fragmentIndex: 0 },
    )).toBe(false);
  });

  it('returns false when fragmentIndex differ', () => {
    expect(sampleFragRefEq(
      { sample: samples[1], fragmentIndex: 0 },
      { sample: samples[1], fragmentIndex: 1 },
    )).toBe(false);
    expect(sampleFragRefEq(
      { sample: samples[1], fragmentIndex: null },
      { sample: samples[1], fragmentIndex: 0 },
    )).toBe(false);
  });
});
