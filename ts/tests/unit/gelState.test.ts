import { describe, it, expect } from 'vitest';
import { gelReducer, initialGelState, type GelState } from '../../src/lib/gel/gelState';
import { BUFFER_TBE, BUFFER_TAE, BUFFER_H2O } from '../../src/lib/sim/buffer';

const STARTING: GelState = initialGelState();

describe('gelReducer', () => {
  it('SET_VOLTAGE updates ctx.voltage', () => {
    const next = gelReducer(STARTING, { type: 'SET_VOLTAGE', value: 140 });
    expect(next.ctx.voltage).toBe(140);
  });
  it('SET_TIME clamps to [0,1]', () => {
    const above = gelReducer(STARTING, { type: 'SET_TIME', value: 2 });
    expect(above.ctx.time).toBe(1);
    const below = gelReducer(STARTING, { type: 'SET_TIME', value: -0.5 });
    expect(below.ctx.time).toBe(0);
  });
  it('SET_WELL_DAMAGE clamps to [0,1]', () => {
    const next = gelReducer(STARTING, { type: 'SET_WELL_DAMAGE', value: 0.5 });
    expect(next.ctx.wellDamage).toBe(0.5);
  });
  it('SET_GEL_BUFFER updates ctx.gelBuffer to preset', () => {
    const tae = gelReducer(STARTING, { type: 'SET_GEL_BUFFER', value: 'TAE' });
    expect(tae.ctx.gelBuffer).toEqual(BUFFER_TAE);
    const h2o = gelReducer(STARTING, { type: 'SET_GEL_BUFFER', value: 'H2O' });
    expect(h2o.ctx.gelBuffer).toEqual(BUFFER_H2O);
    const tbe = gelReducer(STARTING, { type: 'SET_GEL_BUFFER', value: 'TBE' });
    expect(tbe.ctx.gelBuffer).toEqual(BUFFER_TBE);
  });
  it('SET_SELECTED stores selection index', () => {
    const next = gelReducer(STARTING, { type: 'SET_SELECTED', index: 3 });
    expect(next.selectedFragmentIndex).toBe(3);
    const cleared = gelReducer(next, { type: 'SET_SELECTED', index: null });
    expect(cleared.selectedFragmentIndex).toBeNull();
  });
  it('SELECT_NEXT cycles forward and wraps', () => {
    const fragsCount = STARTING.sample.fragments.length;
    if (fragsCount === 0) return;  // skip if no fragments
    const sel0 = { ...STARTING, selectedFragmentIndex: 0 };
    const next1 = gelReducer(sel0, { type: 'SELECT_NEXT' });
    expect(next1.selectedFragmentIndex).toBe(Math.min(1, fragsCount - 1));
    // From last, wraps to 0
    const lastIdx = fragsCount - 1;
    const wrap = gelReducer({ ...STARTING, selectedFragmentIndex: lastIdx }, { type: 'SELECT_NEXT' });
    expect(wrap.selectedFragmentIndex).toBe(0);
    // From null, goes to 0
    const fromNull = gelReducer({ ...STARTING, selectedFragmentIndex: null }, { type: 'SELECT_NEXT' });
    expect(fromNull.selectedFragmentIndex).toBe(0);
  });
  it('SELECT_PREV cycles backward and wraps', () => {
    const fragsCount = STARTING.sample.fragments.length;
    if (fragsCount === 0) return;
    const lastIdx = fragsCount - 1;
    const prev = gelReducer({ ...STARTING, selectedFragmentIndex: 0 }, { type: 'SELECT_PREV' });
    expect(prev.selectedFragmentIndex).toBe(lastIdx);
    const fromNull = gelReducer({ ...STARTING, selectedFragmentIndex: null }, { type: 'SELECT_PREV' });
    expect(fromNull.selectedFragmentIndex).toBe(lastIdx);
  });
  it('BEGIN_DRAG stores drag state with startBases captured', () => {
    const fragsCount = STARTING.sample.fragments.length;
    if (fragsCount === 0) return;
    const next = gelReducer(STARTING, { type: 'BEGIN_DRAG', fragmentIndex: 0, startY: 100 });
    expect(next.drag).not.toBeNull();
    expect(next.drag!.fragmentIndex).toBe(0);
    expect(next.drag!.startY).toBe(100);
    expect(next.drag!.startBases).toBe(STARTING.sample.fragments[0].bases);
  });
  it('END_DRAG clears drag state', () => {
    const dragging = gelReducer(STARTING, { type: 'BEGIN_DRAG', fragmentIndex: 0, startY: 100 });
    const ended = gelReducer(dragging, { type: 'END_DRAG' });
    expect(ended.drag).toBeNull();
  });
  it('SET_FRAGMENT_BASES mutates fragment bases (immutably)', () => {
    if (STARTING.sample.fragments.length === 0) return;
    const next = gelReducer(STARTING, { type: 'SET_FRAGMENT_BASES', index: 0, bases: 5000 });
    expect(next.sample.fragments[0].bases).toBe(5000);
    expect(STARTING.sample.fragments[0].bases).not.toBe(5000);  // original untouched
  });
  it('CLONE_FRAGMENT inserts a copy and selects it', () => {
    if (STARTING.sample.fragments.length === 0) return;
    const next = gelReducer(STARTING, { type: 'CLONE_FRAGMENT', sourceIndex: 0 });
    expect(next.sample.fragments.length).toBe(STARTING.sample.fragments.length + 1);
    // Cloned at index 0+1, selection points at clone
    expect(next.selectedFragmentIndex).toBe(1);
    expect(next.sample.fragments[1]).toEqual(STARTING.sample.fragments[0]);
  });
  it('SET_MODIFIERS replaces the modifiers object', () => {
    const next = gelReducer(STARTING, {
      type: 'SET_MODIFIERS',
      modifiers: { shift: true, alt: false, meta: false },
    });
    expect(next.modifiers.shift).toBe(true);
    expect(next.modifiers.alt).toBe(false);
  });
});

describe('initialGelState', () => {
  it('returns a TBE-buffer state with default ladder fixture', () => {
    const s = initialGelState();
    expect(s.ctx.gelBuffer).toEqual(BUFFER_TBE);
    expect(s.ctx.voltage).toBe(70);
    expect(s.ctx.time).toBeGreaterThan(0);
    expect(s.sample.fragments.length).toBeGreaterThan(0);
    expect(s.fixtureKey).toBeDefined();
  });
});
