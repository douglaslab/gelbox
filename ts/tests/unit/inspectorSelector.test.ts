import { describe, it, expect } from 'vitest';
import { initialGelState, selectInspectorView, gelReducer } from '../../src/lib/gel/gelState';

describe('selectInspectorView', () => {
  it('default state with no selection → none (panel hidden)', () => {
    const s = initialGelState();
    expect(selectInspectorView(s)).toBe('none');
  });
  it('gear pressed → gel-settings', () => {
    const s = gelReducer(initialGelState(), { type: 'SET_INSPECTOR_MODE', mode: 'gel-settings' });
    expect(selectInspectorView(s)).toBe('gel-settings');
  });
  it('gear wins even when a fragment is selected', () => {
    const s0 = gelReducer(initialGelState(), { type: 'SET_SELECTED', laneIndex: 0, index: 2 });
    const s1 = gelReducer(s0, { type: 'SET_INSPECTOR_MODE', mode: 'gel-settings' });
    expect(selectInspectorView(s1)).toBe('gel-settings');
  });
  it('fragment selected (no gear) → fragment', () => {
    const s = gelReducer(initialGelState(), { type: 'SET_SELECTED', laneIndex: 0, index: 2 });
    expect(selectInspectorView(s)).toBe('fragment');
  });
  it('non-empty tube selected, no fragment, mode=sample-settings → sample-settings', () => {
    const s = gelReducer(initialGelState(), { type: 'SET_SELECTED_LANE', laneIndex: 0 });
    // SET_SELECTED_LANE switches mode to sample-settings when the tube has a sample.
    expect(s.inspectorMode).toBe('sample-settings');
    expect(selectInspectorView(s)).toBe('sample-settings');
  });
  it('empty tube selected → none (no panel content)', () => {
    const s = gelReducer(initialGelState(), { type: 'SET_SELECTED_LANE', laneIndex: 3 });
    expect(s.samples[3]).toBeNull();
    expect(selectInspectorView(s)).toBe('none');
  });
  it('clearing fragment selection while sample-settings was active drops to default', () => {
    const s0 = gelReducer(initialGelState(), { type: 'SET_SELECTED', laneIndex: 0, index: 2 });
    expect(selectInspectorView(s0)).toBe('fragment');
    const s1 = gelReducer(s0, { type: 'CLEAR_FRAGMENT_SELECTION' });
    // CLEAR_FRAGMENT_SELECTION drops mode from 'fragment' to 'default'; with no
    // sample-settings mode active, view collapses to 'none'.
    expect(selectInspectorView(s1)).toBe('none');
  });
});
