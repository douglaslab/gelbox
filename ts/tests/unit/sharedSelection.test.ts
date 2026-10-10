import {expect,it} from 'vitest';
import {initialGelState,gelReducer,selectInspectorView} from '../../src/lib/gel/gelState';
it('loupe selection updates focus in the visible sample without switching panel context',()=>{
 let s=gelReducer(initialGelState(),{type:'SET_SELECTED_LANE',laneIndex:0});
 s=gelReducer(s,{type:'SET_SELECTION',ref:{lane:0,fragmentIndex:3}});
 expect(selectInspectorView(s)).toBe('fragment');
 expect(s.lastSampleLane).toBe(0);
 s=gelReducer(s,{type:'SELECT_NEXT'});
 expect(s.selection).toEqual({lane:0,fragmentIndex:4});
});
it('shared selection in another sample does not retain stale species focus or switch panels',()=>{
 let s=gelReducer(initialGelState(),{type:'SET_SELECTED',laneIndex:0,index:0});
 s=gelReducer(s,{type:'CLONE_SAMPLE_TO_LANE',from:0,to:1});
 s=gelReducer(s,{type:'SET_SELECTED',laneIndex:0,index:0});
 s=gelReducer(s,{type:'SET_SELECTION',ref:{lane:1,fragmentIndex:2}});
 expect(s.lastSampleLane).toBe(0);
 expect(selectInspectorView(s)).toBe('none');
});
it('shared selection alone does not open a sample panel',()=>{
 const s=gelReducer(initialGelState(),{type:'SET_SELECTION',ref:{lane:0,fragmentIndex:3}});
 expect(s.lastSampleLane).toBeNull();expect(selectInspectorView(s)).toBe('none');
});
it('clearing a loupe-only selection does not open the source panel',()=>{
 const s=gelReducer(initialGelState(),{type:'SET_SELECTION',ref:{lane:0,fragmentIndex:3}});
 const cleared=gelReducer(s,{type:'CLEAR_FRAGMENT_SELECTION'});
 expect(cleared.lastSampleLane).toBeNull();expect(cleared.selection).toBeNull();
});
it('closing one view only clears rollover still owned by that source',()=>{
 const first={lane:0,fragmentIndex:0},second={lane:0,fragmentIndex:1};
 const s=gelReducer(initialGelState(),{type:'SET_ROLLOVER',ref:second});
 expect(gelReducer(s,{type:'CLEAR_ROLLOVER_IF',ref:first})).toBe(s);
 expect(gelReducer(s,{type:'CLEAR_ROLLOVER_IF',ref:second}).rollover).toBeNull();
});

it.each(['SELECT_NEXT','SELECT_PREV'] as const)('deleting the selected species retains sample context for %s',type=>{
 let s=gelReducer(initialGelState(),{type:'SET_SELECTED',laneIndex:0,index:0});
 s=gelReducer(s,{type:'DELETE_FRAGMENT',laneIndex:0,index:0});
 expect(s.selection).toEqual({lane:0,fragmentIndex:null});
 const n=s.samples[0]!.fragments.length;
 s=gelReducer(s,{type});
 expect(s.selection).toEqual({lane:0,fragmentIndex:type==='SELECT_NEXT'?0:n-1});
});
