import { describe, it, expect } from 'vitest';
import { calcDegradeAsFrac, calcDegradeAsBP, calcDeltaY, type SimContext } from '../../src/lib/sim/mobility';
import { BUFFER_TBE, BUFFER_TAE, BUFFER_H2O } from '../../src/lib/sim/buffer';

describe('calcDegradeAsFrac', () => {
  it('degrade 0 → both zero', () => {
    expect(calcDegradeAsFrac(0)).toEqual({ lo: 0, hi: 0 });
  });
  it('degrade 0.5 → lo=0.5, hi=0', () => {
    expect(calcDegradeAsFrac(0.5)).toEqual({ lo: 0.5, hi: 0 });
  });
  it('degrade 1 → lo=1, hi=0', () => {
    expect(calcDegradeAsFrac(1)).toEqual({ lo: 1, hi: 0 });
  });
  it('degrade 1.5 → lo=1, hi=0.5', () => {
    expect(calcDegradeAsFrac(1.5)).toEqual({ lo: 1, hi: 0.5 });
  });
  it('degrade 2 → both one', () => {
    expect(calcDegradeAsFrac(2)).toEqual({ lo: 1, hi: 1 });
  });
});

describe('calcDegradeAsBP', () => {
  it('degrade 0 / 1000 bases → lo=1, hi=1 (floored to 1)', () => {
    expect(calcDegradeAsBP(0, 1000)).toEqual({ lo: 1, hi: 1 });
  });
  it('degrade 0.5 / 1000 bases → lo=500, hi=1', () => {
    expect(calcDegradeAsBP(0.5, 1000)).toEqual({ lo: 500, hi: 1 });
  });
  it('degrade 1.5 / 1000 bases → lo=1000, hi=500', () => {
    expect(calcDegradeAsBP(1.5, 1000)).toEqual({ lo: 1000, hi: 500 });
  });
});

const CTX_DEFAULT: SimContext = {
  voltage: 70, time: 1, ySpaceScale: 1, wellDamage: 0,
  gelBuffer: BUFFER_TBE, sampleBuffer: BUFFER_TBE,
};

describe('calcDeltaY', () => {
  it('at 14000 bases (max) on 1× TBE @ 70V, t=1: returns curveBase = 0.05', () => {
    expect(calcDeltaY(14000, 1, 1, CTX_DEFAULT)).toBeCloseTo(0.05, 6);
  });
  it('at 0 bases on TBE: returns curveBase + 1 = 1.05', () => {
    expect(calcDeltaY(0, 1, 1, CTX_DEFAULT)).toBeCloseTo(1.05, 6);
  });
  it('TAE buffer uses curveBase=0.07 (not 0.05)', () => {
    const ctxTae = { ...CTX_DEFAULT, gelBuffer: BUFFER_TAE };
    expect(calcDeltaY(14000, 1, 1, ctxTae)).toBeCloseTo(0.07, 6);
  });
  it('voltage 0 → deltaY = 0 (no migration)', () => {
    const ctx0 = { ...CTX_DEFAULT, voltage: 0 };
    expect(calcDeltaY(7000, 1, 1, ctx0)).toBe(0);
  });
  it('voltage 140 (2×) doubles deltaY vs 70V baseline', () => {
    const v70 = calcDeltaY(7000, 1, 1, CTX_DEFAULT);
    const v140 = calcDeltaY(7000, 1, 1, { ...CTX_DEFAULT, voltage: 140 });
    expect(v140).toBeCloseTo(v70 * 2, 6);
  });
  it('time 0 → deltaY = 0', () => {
    expect(calcDeltaY(7000, 1, 1, { ...CTX_DEFAULT, time: 0 })).toBe(0);
  });
  it('aggregation 2 (dimer) on 7000 bases ≈ same y-position as 14000-base monomer', () => {
    expect(calcDeltaY(7000, 2, 1, CTX_DEFAULT)).toBeCloseTo(calcDeltaY(14000, 1, 1, CTX_DEFAULT), 6);
  });
  it('higher aspectRatio increases deltaY (behaves like smaller fragment, migrates faster)', () => {
    const aspectLow = calcDeltaY(5000, 1, 1, CTX_DEFAULT);
    const aspectHigh = calcDeltaY(5000, 1, 16, CTX_DEFAULT);
    expect(aspectHigh).toBeGreaterThan(aspectLow);
  });
  it('H2O buffer uses curveBase=0.05 (no special-case in calcDeltaY)', () => {
    expect(calcDeltaY(14000, 1, 1, { ...CTX_DEFAULT, gelBuffer: BUFFER_H2O })).toBeCloseTo(0.05, 6);
  });
});
