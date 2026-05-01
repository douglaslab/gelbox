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
  it('LOAD_GEL_STATE replaces samples + ctx and resets selection/drag', () => {
    const newSamples = [STARTING.samples[0], null, null];
    const newCtx = { ...STARTING.ctx, voltage: 200 };
    const next = gelReducer(
      { ...STARTING, selectedLane: 5, selectedFragmentIndex: 2, drag: { type: 'sample' as const, laneIndex: 0 } },
      { type: 'LOAD_GEL_STATE', samples: newSamples, numLanes: 3, ctx: newCtx }
    );
    expect(next.numLanes).toBe(3);
    expect(next.samples.length).toBe(3);
    expect(next.ctx.voltage).toBe(200);
    expect(next.selectedLane).toBe(0);
    expect(next.selectedFragmentIndex).toBeNull();
    expect(next.drag).toBeNull();
    // wellRects recomputed for the new lane count
    expect(next.wellRects.length).toBe(3);
  });
  it('ADD_LOUPE appends a loupe with auto-incrementing id', () => {
    const next1 = gelReducer(STARTING, { type: 'ADD_LOUPE', lane: 0, fragmentIndex: 0, x: 100, y: 200 });
    expect(next1.loupes.length).toBe(1);
    expect(next1.loupes[0].id).toBe(1);
    expect(next1.loupes[0].lane).toBe(0);
    expect(next1.loupes[0].fragmentIndex).toBe(0);
    expect(next1.loupes[0].x).toBe(100);
    expect(next1.loupes[0].y).toBe(200);
    expect(next1.loupeNextId).toBe(2);
    const next2 = gelReducer(next1, { type: 'ADD_LOUPE', lane: 0, fragmentIndex: 1, x: 50, y: 60 });
    expect(next2.loupes.length).toBe(2);
    expect(next2.loupes[1].id).toBe(2);
  });
  it('ADD_LOUPE on empty lane is a no-op', () => {
    const next = gelReducer(STARTING, { type: 'ADD_LOUPE', lane: 1, fragmentIndex: 0, x: 100, y: 200 });
    expect(next.loupes.length).toBe(0);
  });
  it('ADD_LOUPE on out-of-range fragment is a no-op', () => {
    const next = gelReducer(STARTING, { type: 'ADD_LOUPE', lane: 0, fragmentIndex: 999, x: 100, y: 200 });
    expect(next.loupes.length).toBe(0);
  });
  it('REMOVE_LOUPE removes by id', () => {
    const a = gelReducer(STARTING,    { type: 'ADD_LOUPE', lane: 0, fragmentIndex: 0, x: 1, y: 1 });
    const b = gelReducer(a,           { type: 'ADD_LOUPE', lane: 0, fragmentIndex: 1, x: 2, y: 2 });
    expect(b.loupes.length).toBe(2);
    const removed = gelReducer(b, { type: 'REMOVE_LOUPE', id: 1 });
    expect(removed.loupes.length).toBe(1);
    expect(removed.loupes[0].id).toBe(2);
  });
  it('CLEAR_LOUPES empties the array and resets id counter', () => {
    const a = gelReducer(STARTING, { type: 'ADD_LOUPE', lane: 0, fragmentIndex: 0, x: 1, y: 1 });
    const cleared = gelReducer(a, { type: 'CLEAR_LOUPES' });
    expect(cleared.loupes.length).toBe(0);
    expect(cleared.loupeNextId).toBe(1);
  });
});

describe('gelReducer SET_SELECTION', () => {
  it('updates selection to a new ref', () => {
    const s0 = initialGelState();
    expect(s0.selection).toBeNull();
    const s1 = gelReducer(s0, { type: 'SET_SELECTION', ref: { lane: 2, fragmentIndex: 3 } });
    expect(s1.selection).toEqual({ lane: 2, fragmentIndex: 3 });
  });

  it('preserves state identity when selection is unchanged', () => {
    const s0 = initialGelState();
    const ref = { lane: 1, fragmentIndex: null };
    const s1 = gelReducer(s0, { type: 'SET_SELECTION', ref });
    const s2 = gelReducer(s1, { type: 'SET_SELECTION', ref: { lane: 1, fragmentIndex: null } });
    expect(s2).toBe(s1);
  });

  it('clears selection to null', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_SELECTION', ref: { lane: 0, fragmentIndex: 0 } });
    const s2 = gelReducer(s1, { type: 'SET_SELECTION', ref: null });
    expect(s2.selection).toBeNull();
  });
});

describe('gelReducer SET_ROLLOVER', () => {
  it('updates rollover to a new ref', () => {
    const s0 = initialGelState();
    expect(s0.rollover).toBeNull();
    const s1 = gelReducer(s0, { type: 'SET_ROLLOVER', ref: { lane: 4, fragmentIndex: 0 } });
    expect(s1.rollover).toEqual({ lane: 4, fragmentIndex: 0 });
  });

  it('preserves state identity when rollover is unchanged', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_ROLLOVER', ref: { lane: 0, fragmentIndex: 0 } });
    const s2 = gelReducer(s1, { type: 'SET_ROLLOVER', ref: { lane: 0, fragmentIndex: 0 } });
    expect(s2).toBe(s1);
  });

  it('selection and rollover are independent', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_SELECTION', ref: { lane: 1, fragmentIndex: 0 } });
    const s2 = gelReducer(s1, { type: 'SET_ROLLOVER',  ref: { lane: 2, fragmentIndex: 5 } });
    expect(s2.selection).toEqual({ lane: 1, fragmentIndex: 0 });
    expect(s2.rollover).toEqual({ lane: 2, fragmentIndex: 5 });
  });
});

describe('gelReducer SET_INSPECTOR_MODE', () => {
  it('updates inspectorMode', () => {
    const s0 = initialGelState();
    expect(s0.inspectorMode).toBe('default');
    const s1 = gelReducer(s0, { type: 'SET_INSPECTOR_MODE', mode: 'gel-settings' });
    expect(s1.inspectorMode).toBe('gel-settings');
  });

  it('preserves identity when mode is unchanged', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_INSPECTOR_MODE', mode: 'default' });
    expect(s1).toBe(s0);
  });
});
