import { describe, it, expect } from 'vitest';
import { clampToRange, quantizeStep } from '../../src/components/primitives/Slider';

describe('clampToRange', () => {
  it('clamps below min', () => expect(clampToRange(-5, 0, 10)).toBe(0));
  it('clamps above max', () => expect(clampToRange(20, 0, 10)).toBe(10));
  it('passes through inside range', () => expect(clampToRange(5, 0, 10)).toBe(5));
});

describe('quantizeStep', () => {
  it('rounds to nearest step from min', () => {
    expect(quantizeStep(0.13, 0, 1, 0.1)).toBeCloseTo(0.1, 6);
    expect(quantizeStep(0.16, 0, 1, 0.1)).toBeCloseTo(0.2, 6);
  });
  it('handles integer steps', () => {
    expect(quantizeStep(7.4, 0, 100, 1)).toBe(7);
    expect(quantizeStep(7.5, 0, 100, 1)).toBe(8);
  });
  it('passes through when step is 0 (no quantize)', () => {
    expect(quantizeStep(3.1415, 0, 10, 0)).toBe(3.1415);
  });
});
