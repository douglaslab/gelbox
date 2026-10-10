import { describe, expect, it } from 'vitest';
import { gelReducer as reduce, initialGelState, getFocusedFragmentIndex } from '../../src/lib/gel/gelState';
import { sampleFragRefEq } from '../../src/lib/gel/sampleFragRef';
const selected = () => reduce(initialGelState(), {type:'SET_SELECTED',laneIndex:0,index:0});

describe('native sample identity', () => {
 it('refreshes reference data after immutable edits without changing history or identity', () => {
  const before=selected(), ref=before.selection!;
  const after=reduce(before,{type:'SET_FRAGMENT_BASES',laneIndex:0,index:0,bases:4321});
  expect(after.selection!.sample).toBe(after.samples[0]);
  expect(after.selection!.sample.fragments[0].bases).toBe(4321);
  expect(ref.sample.fragments[0].bases).not.toBe(4321);
  expect(sampleFragRefEq(ref,after.selection)).toBe(true);
 });
 it('retains selection off-document and does not target a replacement in the old lane', () => {
  const before=selected();
  const outside=reduce(reduce(before,{type:'BEGIN_SAMPLE_DRAG',laneIndex:0}),{type:'UPDATE_SAMPLE_DRAG',laneIndex:-1});
  expect(outside.selection!.sample).toBe(before.samples[0]);
  expect(outside.lastSampleLane).toBeNull();
  const ended=reduce(outside,{type:'END_SAMPLE_DRAG'});
  const replacement=structuredClone(before.samples[0]!);
  const loaded=reduce(ended,{type:'IMPORT_SAMPLE',sample:replacement,preferredLane:0});
  expect(loaded.selection!.sample).toBe(before.samples[0]);
  expect(reduce(loaded,{type:'SYNC_SELECTION_VIEW'}).lastSampleLane).toBeNull();
 });
 it('keeps the original selection on clone, first opens clone panel, then native tick follows original', () => {
  const before=selected();
  const moved=reduce(reduce(before,{type:'BEGIN_SAMPLE_DRAG',laneIndex:0,clone:true}),{type:'UPDATE_SAMPLE_DRAG',laneIndex:2});
  expect(moved.lastSampleLane).toBe(2);
  expect(moved.selection!.sample).toBe(before.samples[0]);
  expect(getFocusedFragmentIndex(moved)).toBeNull();
  const ticked=reduce(moved,{type:'SYNC_SELECTION_VIEW'});
  expect(ticked.lastSampleLane).toBe(0);
  expect(getFocusedFragmentIndex(ticked)).toBe(0);
  const cloneSelected=reduce(moved,{type:'SET_SELECTED',laneIndex:2,index:0});
  expect(sampleFragRefEq(before.selection,cloneSelected.selection)).toBe(false);
 });
 it('preserves raw rollover indices through swap-delete and reappend', () => {
  const before=selected(), sample=before.samples[0]!, last=sample.fragments.length-1;
  let state=reduce(before,{type:'SET_ROLLOVER',ref:{sample,fragmentIndex:last}});
  state=reduce(state,{type:'DELETE_FRAGMENT',laneIndex:0,index:0});
  expect(state.rollover!.fragmentIndex).toBe(last);
  expect(state.rollover!.sample).toBe(state.samples[0]);
  expect(state.rollover!.sample.fragments[last]).toBeUndefined();
  expect(state.selection!.fragmentIndex).toBeNull();
  state=reduce(state,{type:'ADD_FRAGMENT',laneIndex:0,fragment:{...sample.fragments[0],bases:4321}});
  expect(state.rollover!.sample.fragments[last].bases).toBe(4321);
 });
 it('lets a rollover at the removed slot resolve to the swapped-in species', () => {
  let state=selected(); const sample=state.samples[0]!;
  state=reduce(state,{type:'SET_ROLLOVER',ref:{sample,fragmentIndex:0}});
  state=reduce(state,{type:'DELETE_FRAGMENT',laneIndex:0,index:0});
  expect(state.rollover!.fragmentIndex).toBe(0);
  expect(state.rollover!.sample.fragments[0]).toBe(sample.fragments.at(-1));
 });
 it('stale rollover cleanup matches moved identity, not new lane occupants', () => {
  let state=selected(); const ref={sample:state.samples[0]!,fragmentIndex:0};
  state=reduce(state,{type:'SET_ROLLOVER',ref});
  state=reduce(state,{type:'MOVE_SAMPLE',from:0,to:2});
  expect(state.rollover!.sample).toBe(state.samples[2]);
  expect(reduce(state,{type:'CLEAR_ROLLOVER_IF',ref}).rollover).toBeNull();
  const other={sample:structuredClone(ref.sample),fragmentIndex:0};
  state=reduce(state,{type:'SET_ROLLOVER',ref:other});
  expect(reduce(state,{type:'CLEAR_ROLLOVER_IF',ref}).rollover).toBe(other);
 });
 it('replacement clears references and closing panel alone retains native selection', () => {
  const before=selected(),closed=reduce(before,{type:'CLOSE_SAMPLE'});
  expect(closed.selection).toBe(before.selection);
  expect(reduce(closed,{type:'SYNC_SELECTION_VIEW'}).lastSampleLane).toBe(0);
  const loaded=reduce(before,{type:'LOAD_GEL_STATE',samples:before.samples,numLanes:7,ctx:before.ctx});
  expect(loaded.selection).toBeNull(); expect(loaded.rollover).toBeNull();
 });
});

it('new documents and repeated imports create distinct identities even from the same decoded data', () => {
 const a=initialGelState(), b=initialGelState();
 const ar=reduce(a,{type:'SET_SELECTED',laneIndex:0,index:0}).selection;
 const br=reduce(b,{type:'SET_SELECTED',laneIndex:0,index:0}).selection;
 expect(sampleFragRefEq(ar,br)).toBe(false);
 let state=reduce(a,{type:'IMPORT_SAMPLE',sample:a.samples[0]!,preferredLane:1});
 const imported=reduce(state,{type:'SET_SELECTED',laneIndex:1,index:0}).selection;
 expect(sampleFragRefEq(ar,imported)).toBe(false);
 state=reduce(a,{type:'LOAD_GEL_STATE',samples:a.samples,numLanes:a.numLanes,ctx:a.ctx});
 expect(sampleFragRefEq(ar,reduce(state,{type:'SET_SELECTED',laneIndex:0,index:0}).selection)).toBe(false);
});

it('native frame lookup cannot reopen a hidden lane after its panel closes', () => {
 let state=reduce(initialGelState(),{type:'SET_NUM_LANES',value:12});
 state=reduce(state,{type:'IMPORT_SAMPLE',sample:state.samples[0]!,preferredLane:11});
 state=reduce(state,{type:'SET_SELECTED',laneIndex:11,index:0});
 state=reduce(state,{type:'SET_NUM_LANES',value:7});
 expect(reduce(state,{type:'SYNC_SELECTION_VIEW'}).lastSampleLane).toBe(11);
 state=reduce(state,{type:'CLOSE_SAMPLE'});
 expect(reduce(state,{type:'SYNC_SELECTION_VIEW'}).lastSampleLane).toBeNull();
});

it('old-document cleanup cannot clear a new-document rollover with identical file data', () => {
 let state=selected(); const old={sample:state.samples[0]!,fragmentIndex:0};
 state=reduce(state,{type:'LOAD_GEL_STATE',samples:state.samples,numLanes:7,ctx:state.ctx});
 state=reduce(state,{type:'SET_ROLLOVER',ref:{sample:state.samples[0]!,fragmentIndex:0}});
 expect(reduce(state,{type:'CLEAR_ROLLOVER_IF',ref:old})).toBe(state);
});

it('dye compaction retains an invalid external selection and rollover until later append', () => {
 let state=initialGelState(); const f=state.samples[0]!.fragments[0];
 state=reduce(state,{type:'LOAD_GEL_STATE',numLanes:7,ctx:state.ctx,
  samples:[{...state.samples[0]!,fragments:[{...f,dye:0},{...f,dye:0}]} ,null,null,null,null,null,null]});
 state=reduce(state,{type:'BEGIN_DRAG',laneIndex:0,fragmentIndex:1,startY:0});
 state=reduce(state,{type:'SET_ROLLOVER',ref:{sample:state.samples[0]!,fragmentIndex:1}});
 state=reduce(state,{type:'END_DRAG'});
 expect(state.selection!.fragmentIndex).toBe(1);
 expect(state.rollover!.fragmentIndex).toBe(1);
 expect(getFocusedFragmentIndex(state)).toBeNull();
 state=reduce(state,{type:'ADD_FRAGMENT',laneIndex:0,fragment:f});
 expect(state.rollover!.sample.fragments[1]).toBe(f);
 expect(getFocusedFragmentIndex(state)).toBe(1);
});

it('Tab steps a retained invalid index using native raw-index rules', () => {
 let state=selected();
 state=reduce(state,{type:'SET_SELECTION',ref:{sample:state.samples[0]!,fragmentIndex:99}});
 state=reduce(state,{type:'SELECT_PREV'});
 expect(state.selection!.fragmentIndex).toBe(98);
 expect(getFocusedFragmentIndex(state)).toBeNull();
 state=reduce(state,{type:'SELECT_NEXT'});
 expect(state.selection!.fragmentIndex).toBeNull();
 const empty={...state.samples[0]!,fragments:[]};
 state=reduce(state,{type:'LOAD_GEL_STATE',samples:[empty,null,null,null,null,null,null],numLanes:7,ctx:state.ctx});
 state=reduce(state,{type:'SET_SELECTION',ref:{sample:state.samples[0]!,fragmentIndex:2}});
 state=reduce(state,{type:'SYNC_SELECTION_VIEW'});
 expect(reduce(state,{type:'SELECT_PREV'}).selection!.fragmentIndex).toBe(1);
});
