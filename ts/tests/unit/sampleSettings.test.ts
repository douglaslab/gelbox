import { describe, it, expect } from 'vitest';
import { gelReducer, initialGelState } from '../../src/lib/gel/gelState';
import { BUFFER_TBE, BUFFER_TAE, BUFFER_H2O } from '../../src/lib/sim/buffer';

describe('SET_SAMPLE_BUFFER', () => {
  it('writes the new buffer onto samples[lane].buffer', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_SAMPLE_BUFFER', laneIndex: 0, buffer: BUFFER_TAE });
    expect(s1.samples[0]?.buffer).toEqual(BUFFER_TAE);
  });
  it('updates ctx.sampleBuffer when lane is the selected lane', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_SAMPLE_BUFFER', laneIndex: 0, buffer: BUFFER_H2O });
    expect(s1.ctx.sampleBuffer).toEqual(BUFFER_H2O);
  });
  it('leaves ctx.sampleBuffer alone for non-selected lanes', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_SAMPLE_BUFFER', laneIndex: 3, buffer: BUFFER_TAE });
    expect(s1.ctx.sampleBuffer).toEqual(s0.ctx.sampleBuffer);
  });
  it('is a no-op when the lane has no sample', () => {
    const s0 = initialGelState();
    expect(s0.samples[3]).toBeNull();
    const s1 = gelReducer(s0, { type: 'SET_SAMPLE_BUFFER', laneIndex: 3, buffer: BUFFER_TBE });
    expect(s1).toBe(s0);
  });
});

describe('SET_DYE_MASS', () => {
  it('lazy-creates a dye fragment on first non-zero write', () => {
    const s0 = initialGelState();
    const initialFragCount = s0.samples[0]!.fragments.length;
    expect(s0.samples[0]!.fragments.find((f) => f.dye === 0)).toBeUndefined();

    const s1 = gelReducer(s0, { type: 'SET_DYE_MASS', laneIndex: 0, dye: 0, mass: 50 });
    expect(s1.samples[0]!.fragments.length).toBe(initialFragCount + 1);
    const dyeFrag = s1.samples[0]!.fragments.find((f) => f.dye === 0);
    expect(dyeFrag).toBeDefined();
    expect(dyeFrag?.mass).toBe(50);
  });
  it('updates an existing dye fragment in place', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_DYE_MASS', laneIndex: 0, dye: 1, mass: 30 });
    const s2 = gelReducer(s1, { type: 'SET_DYE_MASS', laneIndex: 0, dye: 1, mass: 80 });
    expect(s2.samples[0]!.fragments.filter((f) => f.dye === 1).length).toBe(1);
    expect(s2.samples[0]!.fragments.find((f) => f.dye === 1)?.mass).toBe(80);
  });
  it('is a no-op when the lane has no sample', () => {
    const s0 = initialGelState();
    expect(s0.samples[3]).toBeNull();
    const s1 = gelReducer(s0, { type: 'SET_DYE_MASS', laneIndex: 3, dye: 0, mass: 50 });
    expect(s1).toBe(s0);
  });
  it('zero-mass write when fragment does not exist is a no-op', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_DYE_MASS', laneIndex: 0, dye: 2, mass: 0 });
    expect(s1).toBe(s0);
  });
  it('zero-mass write when fragment exists keeps fragment but sets mass=0', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_DYE_MASS', laneIndex: 0, dye: 0, mass: 50 });
    const s2 = gelReducer(s1, { type: 'SET_DYE_MASS', laneIndex: 0, dye: 0, mass: 0 });
    const dyeFrag = s2.samples[0]!.fragments.find((f) => f.dye === 0);
    expect(dyeFrag).toBeDefined();
    expect(dyeFrag?.mass).toBe(0);
  });
  it('different dyes do not collide', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_DYE_MASS', laneIndex: 0, dye: 0, mass: 50 });
    const s2 = gelReducer(s1, { type: 'SET_DYE_MASS', laneIndex: 0, dye: 2, mass: 75 });
    const f0 = s2.samples[0]!.fragments.find((f) => f.dye === 0);
    const f2 = s2.samples[0]!.fragments.find((f) => f.dye === 2);
    expect(f0?.mass).toBe(50);
    expect(f2?.mass).toBe(75);
  });
});
