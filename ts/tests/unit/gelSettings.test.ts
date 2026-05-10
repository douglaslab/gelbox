import { describe, it, expect } from 'vitest';
import { gelReducer, initialGelState } from '../../src/lib/gel/gelState';

describe('SET_NUM_LANES', () => {
  it('grows the lane count and pads the samples array with nulls', () => {
    const s0 = initialGelState();
    expect(s0.numLanes).toBe(7);
    const s1 = gelReducer(s0, { type: 'SET_NUM_LANES', value: 12 });
    expect(s1.numLanes).toBe(12);
    expect(s1.samples.length).toBe(12);
    expect(s1.samples[0]).toEqual(s0.samples[0]);
    for (let i = 7; i < 12; i++) expect(s1.samples[i]).toBeNull();
    expect(s1.wellRects.length).toBe(12);
  });
  it('shrinks the lane count and truncates the samples array', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_NUM_LANES', value: 3 });
    expect(s1.numLanes).toBe(3);
    expect(s1.samples.length).toBe(3);
    expect(s1.wellRects.length).toBe(3);
  });
  it('clamps selectedLane to numLanes - 1 when shrinking past it', () => {
    const s0 = { ...initialGelState(), selectedLane: 5 };
    const s1 = gelReducer(s0, { type: 'SET_NUM_LANES', value: 3 });
    expect(s1.selectedLane).toBe(2);
  });
  it('rounds non-integer values', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_NUM_LANES', value: 8.7 });
    expect(s1.numLanes).toBe(9);
  });
  it('is a no-op when value === current numLanes', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_NUM_LANES', value: 7 });
    expect(s1).toBe(s0);
  });
  it('updates ctx.ySpaceScale because lane width changed', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_NUM_LANES', value: 14 });
    expect(s1.ctx.ySpaceScale).not.toBe(s0.ctx.ySpaceScale);
  });
});

describe('SET_GEL_ROTATE', () => {
  it('writes the value to state.gelRotate', () => {
    const s0 = initialGelState();
    expect(s0.gelRotate).toBe(0);
    const s1 = gelReducer(s0, { type: 'SET_GEL_ROTATE', value: 12.5 });
    expect(s1.gelRotate).toBe(12.5);
  });
  it('accepts negative values', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_GEL_ROTATE', value: -8 });
    expect(s1.gelRotate).toBe(-8);
  });
});
