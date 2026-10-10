import { serializeGelState } from '../../src/lib/gel/serialize';
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
  it('retains hidden samples through repeated lane changes, exporting only visible lanes', () => {
    const expanded = gelReducer(initialGelState(), { type: 'SET_NUM_LANES', value: 12 });
    const sample = { ...expanded.samples[0]!, name: 'last lane' };
    const loaded = gelReducer(expanded, { type: 'IMPORT_SAMPLE', sample, preferredLane: 11 });
    const reduced = gelReducer(loaded, { type: 'SET_NUM_LANES', value: 7 });
    expect(reduced.samples[11]).toBe(loaded.samples[11]);
    expect(reduced.wellRects).toHaveLength(7);
    expect(JSON.parse(serializeGelState(reduced)).Gel.Samples).toHaveLength(7);
    const imported = gelReducer(reduced, { type: 'IMPORT_SAMPLE', sample, preferredLane: 11 });
    expect(imported.samples[1]).toEqual(sample);
    expect(imported.samples[1]).not.toBe(loaded.samples[11]);
    const restored = gelReducer(imported, { type: 'SET_NUM_LANES', value: 20 });
    expect(restored.samples[11]).toBe(loaded.samples[11]);
    expect(restored.samples[19]).toBeNull();
    expect(JSON.parse(serializeGelState(restored)).Gel.Samples[11].name).toBe('last lane');
  });
  it('layout changes do not transfer selection to a different sample', () => {
    const expanded = gelReducer(initialGelState(), { type: 'SET_NUM_LANES', value: 12 });
    const s = { ...expanded, selectedLane: 11 };
    expect(gelReducer(s, { type: 'SET_NUM_LANES', value: 7 }).selectedLane).toBe(11);
  });
  it('entering gel settings clears sample and species selection permanently', () => {
    const selected = gelReducer(initialGelState(), { type: 'SET_SELECTED', laneIndex: 0, index: 0 });
    const opened = gelReducer({ ...selected, selection: { sample: selected.samples[0]!, fragmentIndex: 0 },
      rollover: { sample: selected.samples[0]!, fragmentIndex: 1 }, drag: { type: 'sample', laneIndex: 0 } }, { type: 'SET_INSPECTOR_MODE', mode: 'gel-settings' });
    expect(opened.lastSampleLane).toBeNull();
    expect(opened.selectedFragmentIndex).toBeNull();
    expect(opened.selection).toBeNull();
    expect(opened.rollover).toBeNull();
    expect(opened.drag).toBeNull();
    const closed = gelReducer(opened, { type: 'SET_INSPECTOR_MODE', mode: 'default' });
    expect(closed.lastSampleLane).toBeNull();
    expect(closed.selectedFragmentIndex).toBeNull();
    expect(gelReducer(closed, { type: 'SELECT_NEXT' })).toBe(closed);
    expect(gelReducer(closed, { type: 'SELECT_PREV' })).toBe(closed);
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
