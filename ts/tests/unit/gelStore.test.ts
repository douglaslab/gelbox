import {readFileSync} from 'node:fs';
import {describe,expect,it,vi} from 'vitest';
import {GelStore} from '../../src/lib/gel/gelStore';
import {deriveGelScene} from '../../src/lib/gel/gelScene';
import {initialGelState} from '../../src/lib/gel/gelState';
import {CinderRand} from '../../src/lib/sim/rng';
import {BUFFER_TBE} from '../../src/lib/sim/buffer';
import type {MolecularView} from '../../src/lib/gel/molecularRuntime';

const native=JSON.parse(readFileSync('../reference/native/runtime/outputs.json','utf8'));
function empty() {
  const state=initialGelState();state.samples=Array.from({length:state.numLanes},()=>null);return state;
}
function populated(mass=0) {
  const state=empty();state.samples[0]={buffer:BUFFER_TBE,fragments:[{bases:1000,mass,aspectRatio:1,degrade:0,dye:-1,color:[.2,.4,.6],aggregate:[1]}]};return state;
}
function nextGlobal(store:GelStore) {
  return (store.molecular as unknown as {globalRand:CinderRand}).globalRand.clone().nextInt();
}
function engineSeed(view:MolecularView) { return (view.sim as unknown as {seed:number}).seed|0; }

describe('native application command ordering',()=>{
  it('resolves frame highlights from current references for ordinary and loupe views',()=>{
    const store=new GelStore(populated(175));
    store.dispatch({type:'SET_SELECTED_LANE',laneIndex:0});
    const ordinary=store.getMolecularView('sample')!;
    const band=deriveGelScene(store.getSnapshot().gel).bands[0];
    store.dispatch({type:'ADD_LOUPE',anchor:{x:(band.rect.x1+band.rect.x2)/2,y:(band.rect.y1+band.rect.y2)/2}});
    const loupe=store.getMolecularView('loupe-1')!;
    const ref=store.getLoupeContent('loupe-1')!.sourceRefs[0];
    expect(ref).toBeDefined();
    store.dispatch({type:'SET_SELECTION',ref});store.dispatch({type:'SET_ROLLOVER',ref});
    expect(store.getMolecularHighlights(ordinary)).toEqual({selected:0,rollover:0});
    const highlights=store.getMolecularHighlights(loupe);
    expect(highlights.selected).toEqual(new Set([0]));
    expect(highlights.rollover).toEqual(new Set([0]));
    store.dispatch({type:'SET_ROLLOVER',ref:null});
    expect(store.getMolecularHighlights(loupe).rollover).toEqual(new Set());
  });
  it('suspends molecular rollover during a held gesture and restores it on release',()=>{
    const store=new GelStore(populated());
    store.dispatch({type:'SET_SELECTED_LANE',laneIndex:0});
    const view=store.getMolecularView('sample')!;
    const pick=vi.spyOn(view.sim,'pickFragment').mockReturnValue(0);
    store.setViewPointer('sample',{x:20,y:20},true);
    store.tick();expect(store.getSnapshot().gel.rollover?.fragmentIndex).toBe(0);
    store.beginPointerDown(null,false);
    store.setViewPointer('sample',{x:20,y:20},true,true);
    store.endPointerDown();pick.mockClear();
    store.tick();
    expect(pick).not.toHaveBeenCalled();
    expect(store.getSnapshot().gel.rollover).toBeNull();
    store.setViewPointer('sample',{x:30,y:30},true);
    store.tick();expect(pick).not.toHaveBeenCalled();
    store.releasePointer(null);
    store.setViewPointer('sample',{x:30,y:30},true);
    store.tick();expect(pick).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().gel.rollover?.fragmentIndex).toBe(0);
  });
  it('opens views synchronously and publishes a stable snapshot once per command',()=>{
    const store=new GelStore(empty());let calls=0;
    const cleanup=store.subscribe(()=>calls++);
    expect(store.getSnapshot()).toBe(store.getSnapshot());
    store.dispatch({type:'SET_SELECTED_LANE',laneIndex:0});
    const first=store.getMolecularView('sample')!;
    expect(engineSeed(first)).toBe(-779453450);expect(first.viewSeed).toBe(-1593094532);
    expect(store.getSnapshot().gel.samples[0]!.fragments).toEqual([]);
    store.dispatch({type:'SET_SELECTED_LANE',laneIndex:1});
    expect(first.alive).toBe(false);
    expect(store.getMolecularView('sample')!.viewSeed).toBe(217451357);
    expect(calls).toBe(2);cleanup();
  });
  it('generates species from the persistent local stream and leaves metadata out of files',()=>{
    const store=new GelStore(empty());
    store.createSpecies(0);store.createSpecies(0);
    const expected=native.find((r:any)=>r.id==='species').frames[2].views.a.fragments;
    expect(store.getSnapshot().gel.samples[0]!.fragments).toEqual(expected);
    expect(store.getMolecularView('sample')!.inspectorOpen).toBe(true);
    expect(store.getSnapshot().gel.selectedFragmentIndex).toBe(1);
  });
  it('opens explicit-selection inspectors immediately but rollover inspectors after molecular ticks',()=>{
    const a=new GelStore(populated()),b=new GelStore(populated());
    for(const store of [a,b])store.dispatch({type:'SET_SELECTED_LANE',laneIndex:0});
    a.dispatch({type:'SET_SELECTED',laneIndex:0,index:0});
    b.dispatch({type:'SET_ROLLOVER',ref:{sample:b.getSnapshot().gel.samples[0]!,fragmentIndex:0}});
    expect(a.getMolecularView('sample')!.inspectorOpen).toBe(true);
    expect(b.getMolecularView('sample')!.inspectorOpen).toBe(false);
    expect(nextGlobal(a)).not.toBe(nextGlobal(b));
    b.tick();
    expect(nextGlobal(a)).toBe(nextGlobal(b));
    expect(b.getMolecularView('sample')!.inspectorOpen).toBe(true);
  });
  it('does not eagerly synchronize an existing engine before Alt-clone selection',()=>{
    const store=new GelStore(populated());
    store.dispatch({type:'SET_SELECTED',laneIndex:0,index:0});
    const view=store.getMolecularView('sample')!;
    store.dispatch({type:'CLONE_FRAGMENT',laneIndex:0,sourceIndex:0});
    expect(view.sample!.fragments).toHaveLength(2);
    expect(view.sim.fragments).toHaveLength(1);
    expect(view.inspectorOpen).toBe(false);
    const before=nextGlobal(store);store.tick();
    expect(view.sim.fragments).toHaveLength(2);
    expect(view.inspectorOpen).toBe(true);
    expect(nextGlobal(store)).not.toBe(before);
  });
  it('waits a frame before ticking an ordinary view opened by selection following',()=>{
    const state=populated();state.samples[1]={...state.samples[0]!,fragments:[...state.samples[0]!.fragments]};
    const store=new GelStore(state);
    store.dispatch({type:'SET_SELECTED_LANE',laneIndex:0});
    const old=store.getMolecularView('sample')!;
    store.dispatch({type:'SET_SELECTION',ref:{sample:store.getSnapshot().gel.samples[1]!,fragmentIndex:0}});
    store.tick();
    const view=store.getMolecularView('sample')!;
    expect(view).not.toBe(old);expect(old.alive).toBe(false);expect(view.ticks).toBe(0);
    store.tick();expect(view.ticks).toBe(1);expect(view.inspectorOpen).toBe(true);
  });
  it('refreshes a destination loupe before and after constructing the moved sample view',()=>{
    const store=new GelStore(populated(175));
    store.dispatch({type:'BEGIN_SAMPLE_DRAG',laneIndex:0});
    const state=store.getSnapshot().gel,band=deriveGelScene(state).bands[0],well=state.wellRects[1];
    store.dispatch({type:'ADD_LOUPE',anchor:{x:(well.x1+well.x2)/2,y:(band.rect.y1+band.rect.y2)/2}});
    expect(store.getMolecularView('loupe-1')!.sim.parts).toHaveLength(0);
    store.dispatch({type:'UPDATE_SAMPLE_DRAG',laneIndex:1});
    const count=store.getMolecularView('loupe-1')!.sim.parts.length;
    expect(count).toBeGreaterThan(0);
    const global=new CinderRand(310);
    for(let i=0;i<4+count;i++)global.nextInt();
    expect(engineSeed(store.getMolecularView('sample')!)).toBe(global.nextInt());
    expect(store.getMolecularView('sample')!.viewSeed).toBe(global.nextInt());
    for(let i=0;i<count;i++)global.nextInt();
    expect(nextGlobal(store)).toBe(global.nextInt());
  });
  it('keeps a closing loupe for one final tick while an identical logical key is recreated',()=>{
    const store=new GelStore(populated());
    store.hoverEvent({type:'move',point:{x:20,y:100}});
    store.dispatch({type:'SET_HOVER_LOUPE_ENABLED',value:true});
    const first=store.getMolecularView('hover')!;
    store.hoverEvent({type:'move',point:null});
    expect(first.alive).toBe(true);expect(store.getMolecularView('hover')).toBeUndefined();
    store.hoverEvent({type:'move',point:{x:20,y:100}});
    const second=store.getMolecularView('hover')!;
    expect(second).not.toBe(first);store.tick();
    expect(first.ticks).toBe(1);expect(first.alive).toBe(false);
    expect(second.ticks).toBe(1);expect(second.alive).toBe(true);
  });
  it('keeps persistent refresh order separate from stacking order',()=>{
    const store=new GelStore(populated(175));const band=deriveGelScene(store.getSnapshot().gel).bands[0];
    const anchor={x:(band.rect.x1+band.rect.x2)/2,y:(band.rect.y1+band.rect.y2)/2};
    store.dispatch({type:'ADD_LOUPE',anchor});store.dispatch({type:'ADD_LOUPE',anchor});
    store.dispatch({type:'RAISE_LOUPE',id:1});
    const a=store.getMolecularView('loupe-1')!,b=store.getMolecularView('loupe-2')!;
    expect(store.molecular.views.indexOf(a)).toBeGreaterThan(store.molecular.views.indexOf(b));
    const global=(store.molecular as unknown as {globalRand:CinderRand}).globalRand.clone();
    store.dispatch({type:'SET_TIME',value:store.getSnapshot().gel.ctx.time});
    const f=Math.fround;
    const expected=f(global.nextFloat(-1,1)*Math.PI*f(.002));
    expect(a.sim.parts[0].angleVel).toBe(expected);
  });
  it('refreshes loupes when the native lane-count callback repeats its value',()=>{
    const store=new GelStore(populated(175));
    const band=deriveGelScene(store.getSnapshot().gel).bands[0];
    store.dispatch({type:'ADD_LOUPE',anchor:{x:(band.rect.x1+band.rect.x2)/2,y:(band.rect.y1+band.rect.y2)/2}});
    const content=store.getLoupeContent('loupe-1'),checkpoint=nextGlobal(store);
    store.dispatch({type:'SET_NUM_LANES',value:store.getSnapshot().gel.numLanes});
    expect(store.getLoupeContent('loupe-1')).not.toBe(content);
    expect(nextGlobal(store)).not.toBe(checkpoint);
  });
  it('preserves the pre-clear hover refresh window through mouse-down edits',()=>{
    const store=new GelStore(populated(175));const p={x:20,y:100};
    store.hoverEvent({type:'move',point:p});store.dispatch({type:'SET_HOVER_LOUPE_ENABLED',value:true});
    const view=store.getMolecularView('hover')!;
    store.beginPointerDown(p,false);
    store.dispatch({type:'SET_FRAGMENT_MASS',laneIndex:0,index:0,mass:80});
    expect(store.getMolecularView('hover')).toBe(view);
    store.endPointerDown();
    store.dispatch({type:'SET_FRAGMENT_MASS',laneIndex:0,index:0,mass:90});
    expect(store.getMolecularView('hover')).toBeUndefined();
    store.releasePointer(p);
    expect(store.getSnapshot().hover.preview).toBeNull();
    store.hoverEvent({type:'move',point:p});expect(store.getMolecularView('hover')).toBeDefined();
  });
  it('does not reroll content when moving a loupe frame or raising it',()=>{
    const store=new GelStore(populated());store.dispatch({type:'ADD_LOUPE',anchor:{x:20,y:100}});
    const view=store.getMolecularView('loupe-1')!,content=store.getLoupeContent('loupe-1'),next=nextGlobal(store);
    store.dispatch({type:'MOVE_LOUPE',id:1,mode:'frame',delta:{x:10,y:20}});
    store.dispatch({type:'RAISE_LOUPE',id:1});
    expect(store.getMolecularView('loupe-1')).toBe(view);expect(store.getLoupeContent('loupe-1')).toBe(content);
    expect(nextGlobal(store)).toBe(next);
  });
});
