import { describe, it, expect } from 'vitest';
import { calcBandDiffusion } from '../../src/lib/sim/diffusion';
import type { SimContext } from '../../src/lib/sim/mobility';
import { BUFFER_TBE } from '../../src/lib/sim/buffer';

const CTX_DEFAULT: SimContext = {
  voltage: 70, time: 1, ySpaceScale: 1, wellDamage: 0,
  gelBuffer: BUFFER_TBE, sampleBuffer: BUFFER_TBE,
};

describe('calcBandDiffusion', () => {
  it('at 1500 bases (kThresh) → bases is NOT > thresh, enters else branch with v=0; result = baseline + threshAmount + 0 = 3', () => {
    expect(calcBandDiffusion(1500, 1, 1, CTX_DEFAULT)).toBeCloseTo(3, 6);
  });
  it('at 10000 bases (kUpperThresh) → max(1, 0+1) = 1', () => {
    expect(calcBandDiffusion(10000, 1, 1, CTX_DEFAULT)).toBeCloseTo(1, 6);
  });
  it('at 1bp (full tiny scale) → 1 + 2 + ((1500-1)/1500 * 16) ≈ 18.99', () => {
    expect(calcBandDiffusion(1, 1, 1, CTX_DEFAULT)).toBeCloseTo(1 + 2 + ((1500 - 1) / 1500) * 16, 4);
  });
  it('voltage 0 → blur = max(1, 0) = 1 (clamped to baseline)', () => {
    const v = calcBandDiffusion(1, 1, 1, { ...CTX_DEFAULT, voltage: 0 });
    expect(v).toBe(1);
  });
  it('time 0 → blur = max(1, 0) = 1', () => {
    expect(calcBandDiffusion(5000, 1, 1, { ...CTX_DEFAULT, time: 0 })).toBe(1);
  });
  it('voltage 140 (2x) doubles uncapped blur', () => {
    const base = calcBandDiffusion(5000, 1, 1, CTX_DEFAULT);
    const dbl = calcBandDiffusion(5000, 1, 1, { ...CTX_DEFAULT, voltage: 140 });
    expect(dbl).toBeCloseTo(base * 2, 4);
  });
});
