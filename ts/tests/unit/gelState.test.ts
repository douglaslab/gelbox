import { describe, it, expect } from 'vitest';
import { gelReducer, initialGelState, type GelState } from '../../src/lib/gel/gelState';
import { BUFFER_TBE, BUFFER_TAE, BUFFER_H2O } from '../../src/lib/sim/buffer';

const STARTING: GelState = initialGelState();

describe('gelReducer (multi-lane)', () => {
  it('initial state has 7 lanes with sample at lane 0 only', () => {
    expect(STARTING.numLanes).toBe(7);
    expect(STARTING.samples.length).toBe(7);
    expect(STARTING.samples[0]).not.toBeNull();
    for (let i = 1; i < 7; i++) expect(STARTING.samples[i]).toBeNull();
    expect(STARTING.wellRects.length).toBe(7);
    expect(STARTING.selectedLane).toBe(0);
  });
  it('SET_VOLTAGE updates ctx.voltage', () => {
    expect(gelReducer(STARTING, { type: 'SET_VOLTAGE', value: 140 }).ctx.voltage).toBe(140);
  });
  it('SET_TIME clamps to [0,1]', () => {
    expect(gelReducer(STARTING, { type: 'SET_TIME', value: 2 }).ctx.time).toBe(1);
    expect(gelReducer(STARTING, { type: 'SET_TIME', value: -0.5 }).ctx.time).toBe(0);
  });
  it('SET_WELL_DAMAGE clamps', () => {
    expect(gelReducer(STARTING, { type: 'SET_WELL_DAMAGE', value: 0.5 }).ctx.wellDamage).toBe(0.5);
  });
  it('SET_GEL_BUFFER updates preset', () => {
    expect(gelReducer(STARTING, { type: 'SET_GEL_BUFFER', value: 'TAE' }).ctx.gelBuffer).toEqual(BUFFER_TAE);
    expect(gelReducer(STARTING, { type: 'SET_GEL_BUFFER', value: 'H2O' }).ctx.gelBuffer).toEqual(BUFFER_H2O);
    expect(gelReducer(STARTING, { type: 'SET_GEL_BUFFER', value: 'TBE' }).ctx.gelBuffer).toEqual(BUFFER_TBE);
  });
  it('SET_SELECTED_LANE clears fragment selection', () => {
    const s = { ...STARTING, selectedFragmentIndex: 2 };
    const next = gelReducer(s, { type: 'SET_SELECTED_LANE', laneIndex: 3 });
    expect(next.selectedLane).toBe(3);
    expect(next.selectedFragmentIndex).toBeNull();
  });
  it('SELECT_NEXT cycles within selected lane', () => {
    const sample = STARTING.samples[0]!;
    const n = sample.fragments.length;
    if (n === 0) return;
    const next1 = gelReducer({ ...STARTING, selectedFragmentIndex: 0 }, { type: 'SELECT_NEXT' });
    expect(next1.selectedFragmentIndex).toBe(1 % n);
    // From an empty lane, no-op
    const empty = gelReducer({ ...STARTING, selectedLane: 1 }, { type: 'SELECT_NEXT' });
    expect(empty.selectedFragmentIndex).toBeNull();
  });
  it('SELECT_PREV from null goes to last fragment', () => {
    const sample = STARTING.samples[0]!;
    const n = sample.fragments.length;
    if (n === 0) return;
    const prev = gelReducer({ ...STARTING, selectedFragmentIndex: null }, { type: 'SELECT_PREV' });
    expect(prev.selectedFragmentIndex).toBe(n - 1);
  });
  it('BEGIN_DRAG (band) stores lane + fragment + startBases', () => {
    const sample = STARTING.samples[0]!;
    if (sample.fragments.length === 0) return;
    const next = gelReducer(STARTING, { type: 'BEGIN_DRAG', laneIndex: 0, fragmentIndex: 0, startY: 100 });
    expect(next.drag).not.toBeNull();
    expect(next.drag!.type).toBe('band');
    if (next.drag!.type === 'band') {
      expect(next.drag!.laneIndex).toBe(0);
      expect(next.drag!.fragmentIndex).toBe(0);
      expect(next.drag!.startBases).toBe(sample.fragments[0].bases);
    }
  });
  it('BEGIN_DRAG on empty lane is a no-op', () => {
    const next = gelReducer(STARTING, { type: 'BEGIN_DRAG', laneIndex: 1, fragmentIndex: 0, startY: 100 });
    expect(next.drag).toBeNull();
  });
  it('END_DRAG clears drag', () => {
    const dragging = gelReducer(STARTING, { type: 'BEGIN_DRAG', laneIndex: 0, fragmentIndex: 0, startY: 100 });
    expect(gelReducer(dragging, { type: 'END_DRAG' }).drag).toBeNull();
  });
  it('SET_FRAGMENT_BASES targets the right lane', () => {
    const next = gelReducer(STARTING, { type: 'SET_FRAGMENT_BASES', laneIndex: 0, index: 0, bases: 5000 });
    expect(next.samples[0]!.fragments[0].bases).toBe(5000);
    // Other lanes untouched
    for (let i = 1; i < 7; i++) expect(next.samples[i]).toBeNull();
  });
  it('CLONE_FRAGMENT inserts in the right lane', () => {
    const sample = STARTING.samples[0]!;
    const before = sample.fragments.length;
    const next = gelReducer(STARTING, { type: 'CLONE_FRAGMENT', laneIndex: 0, sourceIndex: 0 });
    expect(next.samples[0]!.fragments.length).toBe(before + 1);
    expect(next.selectedFragmentIndex).toBe(1);
  });
  it('BEGIN_SAMPLE_DRAG / END_SAMPLE_DRAG', () => {
    const begun = gelReducer(STARTING, { type: 'BEGIN_SAMPLE_DRAG', laneIndex: 0 });
    expect(begun.drag).toEqual({ type: 'sample', laneIndex: 0 });
    expect(gelReducer(begun, { type: 'END_SAMPLE_DRAG' }).drag).toBeNull();
  });
  it('MOVE_SAMPLE swaps two lanes', () => {
    const next = gelReducer(STARTING, { type: 'MOVE_SAMPLE', from: 0, to: 3 });
    expect(next.samples[0]).toBeNull();
    expect(next.samples[3]).toEqual(STARTING.samples[0]);
    expect(next.selectedLane).toBe(3);
  });
  it('MOVE_SAMPLE with from === to is a no-op', () => {
    const next = gelReducer(STARTING, { type: 'MOVE_SAMPLE', from: 0, to: 0 });
    expect(next).toEqual(STARTING);
  });
  it('CLONE_SAMPLE_TO_LANE deep-copies', () => {
    const next = gelReducer(STARTING, { type: 'CLONE_SAMPLE_TO_LANE', from: 0, to: 4 });
    expect(next.samples[0]).not.toBeNull();
    expect(next.samples[4]).not.toBeNull();
    expect(next.samples[4]).not.toBe(next.samples[0]);  // different object
    expect(next.samples[4]!.fragments).not.toBe(next.samples[0]!.fragments);  // different array
    expect(next.selectedLane).toBe(4);
  });
  it('CLONE_SAMPLE_TO_LANE is a no-op if source is null', () => {
    const next = gelReducer(STARTING, { type: 'CLONE_SAMPLE_TO_LANE', from: 5, to: 4 });
    expect(next.samples[4]).toBeNull();
  });
  it('LOAD_FIXTURE loads into specified lane', () => {
    const sample = STARTING.samples[0]!;
    const next = gelReducer(STARTING, { type: 'LOAD_FIXTURE', key: 'test', sample, lane: 2 });
    expect(next.samples[2]).toEqual(sample);
    expect(next.selectedLane).toBe(2);
    expect(next.fixtureKey).toBe('test');
  });
  it('SET_MODIFIERS updates state', () => {
    const next = gelReducer(STARTING, { type: 'SET_MODIFIERS', modifiers: { shift: true, alt: false, meta: false } });
    expect(next.modifiers.shift).toBe(true);
  });
});
