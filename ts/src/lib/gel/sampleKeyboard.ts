import type { Action, GelState } from './gelState';

/** Keys owned by native SampleView; callers scope these to the sample/gel surface. */
export function sampleKeyAction(key: string, shift: boolean, state: GelState): Action | null {
  if (state.lastSampleLane === null) return null;
  if (key === 'Escape') return { type: 'CLOSE_SAMPLE' };
  if (key === 'Tab') return { type: shift ? 'SELECT_PREV' : 'SELECT_NEXT' };
  const selected = state.selection;
  if ((key === 'Delete' || key === 'Backspace') && selected &&
      selected.lane === state.lastSampleLane && selected.fragmentIndex !== null &&
      state.samples[selected.lane]?.fragments[selected.fragmentIndex]) {
    return { type: 'DELETE_FRAGMENT', laneIndex: selected.lane, index: selected.fragmentIndex };
  }
  return null;
}
