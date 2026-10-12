import { describe, it, expect } from 'vitest';
import { aggregateSum, type Aggregate } from '../../src/lib/sim/aggregate';

describe('aggregateSum', () => {
  it('returns 0 for empty aggregate', () => {
    expect(aggregateSum([])).toBe(0);
  });
  it('returns 0 for all-zero aggregate', () => {
    expect(aggregateSum([0, 0, 0])).toBe(0);
  });
  it('sums weights', () => {
    const agg: Aggregate = [1, 0, 0.5, 0, 2];  // monomer + trimer + 5-mer
    expect(aggregateSum(agg)).toBe(3.5);
  });
});
