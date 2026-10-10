import { describe, it, expect } from 'vitest';
import { gelReducer, initialGelState, type GelState } from '../../src/lib/gel/gelState';
import { BUFFER_H2O, BUFFER_TBE } from '../../src/lib/sim/buffer';
import { newFragment } from '../../src/lib/gel/newFragment';

function setup(dye = -1): GelState {
  const state = initialGelState();
  state.samples = [
    { buffer: BUFFER_H2O, fragments: [{ ...newFragment(), dye, mass: 70 }, { ...newFragment(), bases: 8000 }] },
    { buffer: BUFFER_H2O, fragments: [{ ...newFragment(), dye, mass: 80 }] },
    ...Array(5).fill(null),
  ];
  return gelReducer(state, { type: 'BEGIN_DRAG', laneIndex: 0, fragmentIndex: 0, startY: 200, referenceY: 195 });
}
const move = (s: GelState, lane: number, shift = true, y = 250) => gelReducer(s,
  { type: 'UPDATE_BAND_DRAG', x: s.gelSize.width / s.numLanes * (lane + .5), y, shift });

describe('native cross-lane band drag', () => {
  it('appends into an occupied sample, swap-deletes source and follows selection/buffer', () => {
    const s = setup(), next = move(s, 1);
    expect(next.samples[0]!.fragments.map(f => f.bases)).toEqual([8000]);
    expect(next.samples[1]!.fragments).toHaveLength(2);
    expect(next.samples[1]!.fragments[1]).toEqual(s.samples[0]!.fragments[0]);
    expect(next.selection).toEqual({ sample: next.samples[1], fragmentIndex: 1 });
    expect(next.lastSampleLane).toBe(1);
    expect(next.ctx.sampleBuffer).toEqual(BUFFER_H2O);
  });
  it('clears only transient destinations when moving on, and keeps final destination on release', () => {
    let s = move(setup(), 2);
    expect(s.samples[2]!.buffer).toEqual(BUFFER_TBE);
    s = move(s, 3);
    expect(s.samples[2]).toBeNull();
    expect(s.samples[0]!.fragments).toHaveLength(1);
    s = gelReducer(s, { type: 'END_DRAG' });
    expect(s.samples[3]!.fragments).toHaveLength(1);
    expect(s.drag).toBeNull();
  });
  it('keeps preexisting empty samples and appends back into the source', () => {
    let s = setup();
    s.samples[0]!.fragments.pop();
    s = move(s, 2);
    expect(s.samples[0]!.fragments).toEqual([]);
    s = move(s, 0);
    expect(s.samples[2]).toBeNull();
    expect(s.samples[0]!.buffer).toEqual(BUFFER_H2O);
    expect(s.samples[0]!.fragments).toHaveLength(1);
  });
  it('does not switch lanes in gutters or outside gel bounds; Shift still permits lane transfer', () => {
    const s = setup();
    for (const [x,y] of [[56,250],[-20,250],[390,530],[85,-1]]) {
      const next = gelReducer(s, { type:'UPDATE_BAND_DRAG', x,y,shift:true });
      expect(next.drag?.laneIndex).toBe(0);
    }
    expect(move(s,1).drag?.laneIndex).toBe(1);
  });
  it('dyes move without changing bases and merge only on release, keeping first metadata', () => {
    const s = setup(0), first = s.samples[1]!.fragments[0];
    let next = move(s,1,false,450);
    expect(next.samples[1]!.fragments[1].bases).toBe(s.samples[0]!.fragments[0].bases);
    expect(next.samples[1]!.fragments).toHaveLength(2);
    next = gelReducer(next,{type:'END_DRAG'});
    expect(next.samples[1]!.fragments).toEqual([{...first,mass:125}]);
    expect(next.selectedFragmentIndex).toBeNull();
    expect(next.inspectorMode).toBe('sample-settings');
  });
  it('Alt clone leaves the original independent while the copied dye moves', () => {
    let s = setup(0);
    s = gelReducer(s,{type:'CLONE_FRAGMENT',laneIndex:0,sourceIndex:0});
    s = gelReducer(s,{type:'BEGIN_DRAG',laneIndex:0,fragmentIndex:2,startY:200});
    const next = move(s,2,false);
    expect(next.samples[0]!.fragments).toHaveLength(2);
    expect(next.samples[2]!.fragments[0]).toEqual(s.samples[0]!.fragments[0]);
    expect(next.samples[2]!.fragments[0]).not.toBe(s.samples[0]!.fragments[0]);
  });
});

it('Shift on a dye restores native Band bases, which differ from fragment metadata', () => {
  const s = setup(0);
  expect(move(s,2,true).samples[2]!.fragments[0].bases).toBe(6000);
});
it('vertical movement preserves keyboard selection until crossing into another lane', () => {
  let s = setup();
  s = gelReducer(s,{type:'SELECT_NEXT'});
  expect(s.selectedFragmentIndex).toBe(1);
  s = move(s,0);
  expect(s.selection).toEqual({ sample: s.samples[0],fragmentIndex:1});
  s = move(s,1);
  expect(s.selection).toEqual({ sample: s.samples[1],fragmentIndex:1});
});
it('unshifted multimer transfer solves the native offset/tier and switches to destination buffer', () => {
  let s = setup();
  s.samples[0]!.fragments[0] = {...s.samples[0]!.fragments[0],bases:3001,aggregate:[1,2,3]};
  s.samples[1]!.buffer = BUFFER_TBE;
  s = gelReducer(s,{type:'BEGIN_DRAG',laneIndex:0,fragmentIndex:0,startY:200,referenceY:195,aggregate:3});
  s = move(s,1,false,255);
  // Pinned C++ oracle aggregate-3, target250, aggregate3.
  expect(s.samples[1]!.fragments[1].bases).toBe(907);
  expect(s.ctx.sampleBuffer).toEqual(BUFFER_TBE);
});
it('removing the first of three species swaps in the last without shifting the middle', () => {
  let s = setup();
  s.samples[0]!.fragments.push({...newFragment(),bases:9000});
  s = move(s,1);
  expect(s.samples[0]!.fragments.map(f=>f.bases)).toEqual([9000,8000]);
});
it('dye merge accumulates fractional masses at native float32 precision before capping', () => {
  let s = setup(0);
  s.samples[0]!.fragments[0].mass = .1;
  s.samples[1]!.fragments[0].mass = .2;
  s = gelReducer(move(s,1,false),{type:'END_DRAG'});
  expect(s.samples[1]!.fragments[0].mass).toBe(0.30000001192092896);
});
