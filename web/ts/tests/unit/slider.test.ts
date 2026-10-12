import { describe, expect, it } from 'vitest';
import {
  lmap,
  clamp,
  quantize,
  calcNormalizedValue,
  getMappedValue,
  getNearestNotch,
  applyNotchSnap,
} from '../../src/lib/slider/slider';

describe('lmap', () => {
  it('linearly maps from one range to another', () => {
    expect(lmap(0,    0, 100, -1, 1)).toBe(-1);
    expect(lmap(50,   0, 100, -1, 1)).toBe(0);
    expect(lmap(100,  0, 100, -1, 1)).toBe(1);
  });

  it('handles inverse ranges (out-min > out-max)', () => {
    expect(lmap(0.5, 0, 1, 100, 0)).toBe(50);
  });
});

describe('clamp', () => {
  it('clamps to range', () => {
    expect(clamp(-1,  0, 10)).toBe(0);
    expect(clamp(5,   0, 10)).toBe(5);
    expect(clamp(100, 0, 10)).toBe(10);
  });
});

describe('quantize', () => {
  it('returns input unchanged when step <= 0', () => {
    expect(quantize(3.7, 0)).toBe(3.7);
    expect(quantize(3.7, -1)).toBe(3.7);
  });

  it('rounds to nearest multiple of step', () => {
    expect(quantize(3.7, 1)).toBe(4);
    expect(quantize(3.4, 1)).toBe(3);
    expect(quantize(125,  100)).toBe(100);
    expect(quantize(175,  100)).toBe(200);
  });
});

describe('calcNormalizedValue / getMappedValue (round-trip)', () => {
  const cfg = { valueMin: 100, valueMax: 1000, quantize: 0 };

  it('normalized 0 maps to valueMin', () => {
    expect(getMappedValue(0, cfg)).toBe(100);
  });

  it('normalized 1 maps to valueMax', () => {
    expect(getMappedValue(1, cfg)).toBe(1000);
  });

  it('mapped 550 corresponds to normalized 0.5', () => {
    expect(calcNormalizedValue(550, cfg)).toBeCloseTo(0.5, 6);
  });

  it('quantization clamps the mapped value to a step grid', () => {
    const q = { valueMin: 0, valueMax: 1000, quantize: 100 };
    expect(getMappedValue(0.43, q)).toBe(400);
    expect(getMappedValue(0.47, q)).toBe(500);
  });

  it('mapped value never escapes valueMin/valueMax even when normalized > 1', () => {
    expect(getMappedValue(1.2, cfg)).toBe(1000);
    expect(getMappedValue(-0.3, cfg)).toBe(100);
  });
});

describe('getNearestNotch', () => {
  it('returns the closest notch (Slider.cpp:439)', () => {
    const notches = [0, 0.25, 0.5, 0.75, 1];
    expect(getNearestNotch(0.30, notches)).toBe(0.25);
    expect(getNearestNotch(0.40, notches)).toBe(0.5);
    expect(getNearestNotch(0.99, notches)).toBe(1);
  });

  it('returns input when notches is empty', () => {
    expect(getNearestNotch(0.7, [])).toBe(0.7);
  });
});

describe('applyNotchSnap', () => {
  const notches = [0, 0.5, 1];

  it('returns input when action is none/drawOnly', () => {
    expect(applyNotchSnap(0.45, notches, 'none',     0.05)).toBe(0.45);
    expect(applyNotchSnap(0.45, notches, 'drawOnly', 0.05)).toBe(0.45);
  });

  it('always snaps to nearest when action is nearest', () => {
    expect(applyNotchSnap(0.10, notches, 'nearest', 0.05)).toBe(0);
    expect(applyNotchSnap(0.45, notches, 'nearest', 0.05)).toBe(0.5);
    expect(applyNotchSnap(0.90, notches, 'nearest', 0.05)).toBe(1);
  });

  it('snaps only within snapDist for action=snap', () => {
    expect(applyNotchSnap(0.48, notches, 'snap', 0.05)).toBe(0.5);
    expect(applyNotchSnap(0.30, notches, 'snap', 0.05)).toBe(0.30);
  });
});
