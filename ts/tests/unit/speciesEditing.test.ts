import { sampleKeyAction } from '../../src/lib/gel/sampleKeyboard';
import { describe, expect, it } from 'vitest';
import { gelReducer, initialGelState, selectInspectorView } from '../../src/lib/gel/gelState';

const initial = initialGelState();
const fragment = initial.samples[0]!.fragments[0];

describe('native species editing', () => {
  it('creates an empty TBE sample on tube selection without opening an inspector', () => {
    const state = gelReducer(initial, { type: 'SET_SELECTED_LANE', laneIndex: 2 });
    expect(state.samples[2]?.fragments).toEqual([]);
    expect(state.samples[2]?.buffer).toEqual(initial.samples[0]!.buffer);
    expect(state.lastSampleLane).toBe(2);
    expect(selectInspectorView(state)).toBe('none');
  });
  it('appends a clone without reindexing existing fragments', () => {
    const state = gelReducer(initial, { type: 'CLONE_FRAGMENT', laneIndex: 0, sourceIndex: 0 });
    const n = initial.samples[0]!.fragments.length;
    expect(state.samples[0]!.fragments.slice(0, n)).toEqual(initial.samples[0]!.fragments);
    expect(state.selectedFragmentIndex).toBe(n);
    expect(state.samples[0]!.fragments[n].aggregate).not.toBe(fragment.aggregate);
  });
  it('deletes using the native last-entry replacement and repairs rollover', () => {
    const selected = gelReducer(initial, { type: 'SET_SELECTED', laneIndex: 0, index: 1 });
    const last = initial.samples[0]!.fragments.length - 1;
    const state = gelReducer({ ...selected, rollover: { lane: 0, fragmentIndex: last } },
      { type: 'DELETE_FRAGMENT', laneIndex: 0, index: 1 });
    expect(state.samples[0]!.fragments[1]).toBe(initial.samples[0]!.fragments[last]);
    expect(state.samples[0]!.fragments[2]).toBe(initial.samples[0]!.fragments[2]);
    expect(state.rollover).toEqual({ lane: 0, fragmentIndex: 1 });
    expect(state.selectedFragmentIndex).toBeNull();
    expect(state.lastSampleLane).toBe(0);
  });
  it('cycles through no-species selection and routes dyes to sample settings', () => {
    const samples = [{ buffer: initial.ctx.gelBuffer, fragments: [fragment, { ...fragment, dye: 0 }] }];
    let state = { ...initial, samples, lastSampleLane: 0, selectedFragmentIndex: 0 };
    state = gelReducer(state, { type: 'SELECT_NEXT' });
    expect(selectInspectorView(state)).toBe('sample-settings');
    state = gelReducer(state, { type: 'SELECT_NEXT' });
    expect(state.selectedFragmentIndex).toBeNull();
    state = gelReducer(state, { type: 'SELECT_PREV' });
    expect(state.selectedFragmentIndex).toBe(1);
  });
});

it('generates native default species values from controllable random inputs', async () => {
  const { newFragment } = await import('../../src/lib/gel/newFragment');
  const values = [.999, .5, .5, .5];
  expect(newFragment(() => values.shift()!)).toEqual({
    bases: 3500, mass: 87.5, degrade: 0, aspectRatio: 1, dye: -1,
    color: [.2, .2, .2], aggregate: [1,0,0,0,0,0,0],
  });
});

it('clears shared and legacy selection together when a band is deselected', () => {
  const selected = gelReducer(initial, { type: 'SET_SELECTED', laneIndex: 0, index: 0 });
  const cleared = gelReducer(selected, { type: 'CLEAR_FRAGMENT_SELECTION' });
  expect(cleared.selectedFragmentIndex).toBeNull();
  expect(cleared.selection).toEqual({ lane: 0, fragmentIndex: null });
});

it.each(['MOVE_SAMPLE', 'CLONE_SAMPLE_TO_LANE'] as const)('Delete follows the visible species after unrelated %s', (type) => {
  const loaded = gelReducer(initial, { type: 'CLONE_SAMPLE_TO_LANE', from: 0, to: 1 });
  const selected = gelReducer(loaded, { type: 'SET_SELECTED', laneIndex: 0, index: 0 });
  const moved = gelReducer(selected, { type, from: 1, to: 2 });
  const action = sampleKeyAction('Delete', false, moved);
  expect(action).toEqual({ type: 'DELETE_FRAGMENT', laneIndex: 0, index: 0 });
  const deleted = gelReducer(moved, action!);
  expect(deleted.samples[2]).toBe(moved.samples[2]);
  expect(deleted.samples[0]!.fragments).toHaveLength(selected.samples[0]!.fragments.length - 1);
});
