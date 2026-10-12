import {releasePaletteColor} from '../helpers/releasePalette';
import {readFileSync} from 'node:fs';
import {expect, it} from 'vitest';
import {MolecularRuntime, type MolecularView} from '../../src/lib/gel/molecularRuntime';
import {CinderRand} from '../../src/lib/sim/rng';
import {BUFFER_TBE} from '../../src/lib/sim/buffer';
import type {Sample} from '../../src/lib/sim/sample';

const cases=JSON.parse(readFileSync('../reference/native/runtime/cases.json','utf8'));
const references=JSON.parse(readFileSync('../reference/native/runtime/outputs.json','utf8'));
const bounds={x1:0,y1:0,x2:400,y2:400};
function sample(fragments:any[]):Sample {
  return {buffer:BUFFER_TBE,fragments:fragments.map(f=>({
    bases:f.bases,mass:f.mass,aspectRatio:f.aspectRatio??1,degrade:f.degrade??0,
    dye:f.dye??-1,color:(f.color??[.2,.4,.6]).map(Math.fround),aggregate:f.aggregate??[1],
  }))};
}
function particles(actual:any,expected:any,path:string) {
  if(typeof expected==='number') {
    expect(Number.isFinite(actual),path).toBe(true);
    if(path.endsWith('.fragment')||path.endsWith('.age')) expect(actual,path).toBe(expected);
    else expect(Math.abs(actual-expected),`${path}: web ${actual}, native ${expected}`)
      .toBeLessThanOrEqual(Math.max(.0001,Math.abs(expected)*2e-6));
  } else if(Array.isArray(expected)) {
    expect(actual.length,path).toBe(expected.length);
    expected.forEach((x,i)=>particles(actual[i],x,`${path}[${i}]`));
  } else if(expected&&typeof expected==='object') {
    for(const [k,v] of Object.entries(expected)) particles(actual[k],v,`${path}.${k}`);
  } else expect(actual,path).toBe(expected);
}

it.each(cases.map((c:any,i:number)=>[c.id,c,references[i]]))('composed native runtime: %s',(_id,c,ref)=>{
  const runtime=new MolecularRuntime(c.globalSeed??310);
  const notifications:string[]=[],trace:string[]=[];
  const colors:number[][]=[];
  // Explicit retention models native ownership; GC timing must not affect ticks.
  const retained:MolecularView[]=[];
  function action(step:any) {
    if(step.op==='create') {
      const view=runtime.createView(step.id,{bounds,sample:sample(step.sample??[]),timeScale:step.loupe?0:1});
      view.afterTick=()=>trace.push(view.id);
      return;
    }
    if(step.op==='tick') { for(let i=0;i<(step.count??1);i++) runtime.tick(); return; }
    if(step.op==='global-color') { colors.push(runtime.randomFragmentColor()); return; }
    const view=runtime.getView(step.id)!;
    expect(view,`view ${step.id}`).toBeDefined();
    switch(step.op) {
      case 'species': {
        const fragment=view.createFragment();
        const previous=view.sample!;
        // The command owns document mutation/notifications, as in the native adapter.
        notifications.push(`${view.id}:${previous.fragments.length}`);
        view.setSample({...previous,fragments:[...previous.fragments,fragment]});
        break;
      }
      case 'inspector': view.setInspectorOpen(true); break;
      case 'close-inspector': view.setInspectorOpen(false); break;
      case 'raise': runtime.raiseView(step.id); break;
      case 'remove': {
        const removed=runtime.removeView(step.id,step.retain??false)!;
        if(step.retain) retained.push(removed);
        break;
      }
      case 'during-tick': view.afterTick=()=>{
        trace.push(view.id);
        view.afterTick=()=>trace.push(view.id);
        action(step.action);
      };break;
      case 'refresh': view.refreshDetail({x:step.anchor[0],y:step.anchor[1]},step.time,
        step.from?structuredClone(runtime.getView(step.from)!.sample!):sample(step.sample)); break;
      default: throw new Error(`Unhandled reference operation ${step.op}`);
    }
  }
  c.steps.forEach((step:any,i:number)=>{
    action(step);
    const frame=ref.frames[i];
    expect(runtime.views.map(v=>v.id),`order after ${i}`).toEqual(frame.order);
    for(const view of runtime.views) {
      const native=frame.views[view.id];
      // Existing reference tests inspect private engine state; no product debug API.
      const internal=view.sim as unknown as {seed:number;rand:CinderRand};
      expect(internal.seed|0,`${i}/${view.id} engine seed`).toBe(native.engineSeed);
      expect(view.viewSeed).toBe(native.viewSeed);
      expect(view.localRand.clone().nextInt()).toBe(native.nextLocalInt);
      expect(internal.rand.clone().nextInt()).toBe(native.nextDynamicInt);
      expect(view.inspectorOpen).toBe(native.inspector);
      expect(view.sample!.fragments).toEqual(native.fragments.map((f:any)=>({...f,color:releasePaletteColor(f.color)})));
      const expected=native.parts.map((p:any)=>({...p,
        loc:{x:p.loc[0],y:p.loc[1]},vel:{x:p.vel[0],y:p.vel[1]},radius:{x:p.radius[0],y:p.radius[1]},
        multi:p.multi.map((m:any)=>({...m,loc:{x:m.loc[0],y:m.loc[1]}})),
      }));
      particles(view.sim.parts,expected,`${c.id}/${i}/${view.id}`);
    }
  });
  expect(colors).toEqual(ref.colors.map(releasePaletteColor));
  expect(notifications).toEqual(ref.notifications);
  expect(trace).toEqual(ref.tickTrace);
  const global=(runtime as unknown as {globalRand:CinderRand}).globalRand;
  expect(global.clone().nextInt()).toBe(ref.nextGlobalInt);
});
