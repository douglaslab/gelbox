import { describe, expect, it } from 'vitest';
import { gelReducer, initialGelState } from '../../src/lib/gel/gelState';
const initial = initialGelState();
const selected = gelReducer(initial, { type: 'SET_SELECTED', laneIndex: 0, index: 0 });

describe('native tube drag', () => {
  it('selects source at pointer down and preserves its species through movement', () => {
    const begun = gelReducer(selected, { type: 'BEGIN_SAMPLE_DRAG', laneIndex: 0 });
    const moved = gelReducer(begun, { type: 'UPDATE_SAMPLE_DRAG', laneIndex: 3 });
    expect(moved.samples[0]).toBeNull();
    expect(moved.samples[3]).toBe(initial.samples[0]);
    expect(moved.selection).toEqual({ sample: moved.samples[3], fragmentIndex: 0 });
    expect(moved.lastSampleLane).toBe(3);
    expect(moved.selectedLane).toBe(3);
    expect(moved.ctx.sampleBuffer).toEqual(initial.samples[0]!.buffer);
  });
  it('holds the sample off-row for re-entry, leaving occupied destinations untouched', () => {
    const loaded = gelReducer(selected, { type: 'CLONE_SAMPLE_TO_LANE', from: 0, to: 1 });
    const begun = gelReducer(loaded, { type: 'BEGIN_SAMPLE_DRAG', laneIndex: 0 });
    const overFull = gelReducer(begun, { type: 'UPDATE_SAMPLE_DRAG', laneIndex: 1 });
    expect(overFull.samples[0]).toBeNull();
    expect(overFull.samples[1]).toBe(loaded.samples[1]);
    expect(overFull.lastSampleLane).toBeNull();
    const outside = gelReducer(overFull, { type: 'UPDATE_SAMPLE_DRAG', laneIndex: -1 });
    const reentered = gelReducer(outside, { type: 'UPDATE_SAMPLE_DRAG', laneIndex: 2 });
    expect(reentered.samples[2]).toBe(initial.samples[0]);
    expect(gelReducer(reentered, { type: 'END_SAMPLE_DRAG' }).drag).toBeNull();
  });
  it('clones once at mouse-down with deep independent fragment data', () => {
    const begun = gelReducer(initial, { type: 'BEGIN_SAMPLE_DRAG', laneIndex: 0, clone: true });
    const moved = gelReducer(begun, { type: 'UPDATE_SAMPLE_DRAG', laneIndex: 2 });
    expect(moved.samples[0]).toBe(initial.samples[0]);
    expect(moved.samples[2]).toEqual(initial.samples[0]);
    expect(moved.samples[2]).not.toBe(initial.samples[0]);
    expect(moved.samples[2]!.fragments[0].aggregate).not.toBe(initial.samples[0]!.fragments[0].aggregate);
    expect(moved.samples[2]!.fragments[0].color).not.toBe(initial.samples[0]!.fragments[0].color);
  });
  it('does not swap or overwrite when an atomic move reaches an occupied lane', () => {
    const loaded = gelReducer(initial, { type: 'CLONE_SAMPLE_TO_LANE', from: 0, to: 1 });
    const moved = gelReducer(loaded, { type: 'MOVE_SAMPLE', from: 0, to: 1 });
    expect(moved.samples[1]).toBe(loaded.samples[1]);
    expect(moved.samples[0]).toBeNull();
    expect(moved.lastSampleLane).toBeNull();
  });
});

it('keeps native shared species selection on the original during Alt clone', () => {
  const begun = gelReducer(selected, { type: 'BEGIN_SAMPLE_DRAG', laneIndex: 0, clone: true });
  const moved = gelReducer(begun, { type: 'UPDATE_SAMPLE_DRAG', laneIndex: 2 });
  expect(moved.selection).toEqual({ sample: moved.samples[0], fragmentIndex: 0 });
  expect(moved.selectedLane).toBe(2);
  expect(moved.lastSampleLane).toBe(2);
  expect(moved.samples[2]).not.toBe(moved.samples[0]);
});
it('releasing outside removes the dragged sample from the document', () => {
  const begun = gelReducer(selected, { type: 'BEGIN_SAMPLE_DRAG', laneIndex: 0 });
  const outside = gelReducer(begun, { type: 'UPDATE_SAMPLE_DRAG', laneIndex: -1 });
  const ended = gelReducer(outside, { type: 'END_SAMPLE_DRAG' });
  expect(ended.samples.every(s => s === null)).toBe(true);
  expect(ended.drag).toBeNull();
  expect(ended.selection!.sample).toBe(selected.samples[0]);
  expect(ended.selectedFragmentIndex).toBeNull();
});
it('keeps edits made during an active drag when the sample moves again', () => {
  const begun = gelReducer(selected, { type: 'BEGIN_SAMPLE_DRAG', laneIndex: 0 });
  const edited = gelReducer(begun, { type: 'DELETE_FRAGMENT', laneIndex: 0, index: 0 });
  const moved = gelReducer(edited, { type: 'UPDATE_SAMPLE_DRAG', laneIndex: 2 });
  expect(moved.samples[2]).toBe(edited.samples[0]);
  expect(moved.samples[2]!.fragments).toHaveLength(initial.samples[0]!.fragments.length - 1);
  expect(moved.selectedFragmentIndex).toBeNull();
});
it.each([false, true])('keeps live keyboard selection across further dragging (clone=%s)', clone => {
  const begun = gelReducer(selected, { type: 'BEGIN_SAMPLE_DRAG', laneIndex: 0, clone });
  const tabbed = gelReducer(begun, { type: 'SELECT_NEXT' });
  expect(tabbed.selectedFragmentIndex).toBe(1);
  const moved = gelReducer(tabbed, { type: 'UPDATE_SAMPLE_DRAG', laneIndex: 3 });
  expect(moved.selection).toEqual({ sample: moved.samples[clone ? 0 : 3], fragmentIndex: 1 });
});
