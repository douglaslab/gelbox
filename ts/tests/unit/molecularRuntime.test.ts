import {releasePalette} from '../helpers/releasePalette';
import {describe,expect,it} from 'vitest';
import {MolecularRuntime} from '../../src/lib/gel/molecularRuntime';
import {nativeFragmentColor,nativeSpecies} from '../../src/lib/gel/nativeSpecies';
import {MolecularSim} from '../../src/lib/sim/molecularSimEngine';
import {CinderRand} from '../../src/lib/sim/rng';
import {BUFFER_TBE} from '../../src/lib/sim/buffer';
const bounds={x1:0,y1:0,x2:400,y2:400};
const sample={buffer:BUFFER_TBE,fragments:[{bases:1000,mass:40,aspectRatio:1,degrade:0,dye:-1,aggregate:[1],color:[.2,.4,.6] as [number,number,number]}]};

describe('native runtime ownership',()=>{
  it('injects one shared RNG into the existing molecular constructor',()=>{
    const globalRand=new CinderRand(310);
    new MolecularSim({bounds,globalRand});
    expect(globalRand.nextInt()).toBe(-1593094532);
    expect(()=>new MolecularSim({bounds,globalRand,globalSeed:1})).toThrow(/global/i);
  });
  it('copies RNG state and cursor across a twist without consuming the source',()=>{
    const source=new CinderRand(310);
    for(let i=0;i<623;i++)source.nextInt();
    const copy=source.clone(), expected=source.clone();
    const fromCopy=Array.from({length:700},()=>copy.nextInt());
    expect(Array.from({length:700},()=>source.nextInt())).toEqual(fromCopy);
    expect(Array.from({length:700},()=>expected.nextInt())).toEqual(fromCopy);
  });
  it('isolates application instances and rejects duplicate views without RNG draws',()=>{
    const a=new MolecularRuntime(),b=new MolecularRuntime();
    const av=a.createView('sample',{bounds,sample});
    a.tick();a.randomFragmentColor();av.setInspectorOpen(true);
    expect(()=>a.createView('sample',{bounds})).toThrow(/duplicate/i);
    const bv=b.createView('sample',{bounds,sample});
    expect(av.viewSeed).toBe(bv.viewSeed);
    expect(av.createFragment()).toEqual(bv.createFragment());
    const control=new MolecularRuntime();control.createView('sample',{bounds});
    expect(()=>control.createView('sample',{bounds})).toThrow();
    expect(control.createView('next',{bounds}).viewSeed).toBe(217451357);
  });
  it('does not tick a replacement that reuses a destroyed snapshot entry id',()=>{
    const runtime=new MolecularRuntime();
    const old=runtime.createView('sample',{bounds,sample});
    runtime.tick(()=>{runtime.removeView('sample');runtime.createView('sample',{bounds,sample});});
    expect(old.alive).toBe(false);
    expect(old.ticks).toBe(0);
    expect(runtime.getView('sample')!.ticks).toBe(0);
    runtime.tick();
    expect(runtime.getView('sample')!.ticks).toBe(1);
  });
  it('retains detached snapshots only until explicit disposal',()=>{
    const runtime=new MolecularRuntime();
    const old=runtime.createView('sample',{bounds,sample});
    runtime.tick(()=>{runtime.removeView('sample',true);});
    expect(old.ticks).toBe(1);
    expect(old.alive).toBe(true);
    runtime.tick();expect(old.ticks).toBe(1);
    old.dispose();expect(old.alive).toBe(false);
    const next=runtime.createView('next',{bounds,sample});
    runtime.tick(()=>{runtime.removeView('next',true);next.dispose();});
    expect(next.ticks).toBe(0);
  });
  it('advances without rendering and freezes only simulation, resetting on sample changes',()=>{
    const runtime=new MolecularRuntime();runtime.freezeAfter=2;
    const view=runtime.createView('sample',{bounds,sample});
    let callbacks=0;view.afterTick=()=>callbacks++;
    runtime.tick();runtime.tick();runtime.tick();
    expect(view.ticks).toBe(2);expect(view.frozen).toBe(true);expect(callbacks).toBe(3);
    expect(view.sim.parts.length).toBeGreaterThan(0);
    const local=view.localRand.clone().nextInt();
    view.setSample({...sample,fragments:[...sample.fragments]});
    expect(view.ticks).toBe(0);expect(view.frozen).toBe(false);
    expect(view.localRand.clone().nextInt()).toBe(local);
    runtime.tick();expect(view.ticks).toBe(1);
  });
  it('assigns the correct palette slot to negative global integers',()=>{
    expect(nativeFragmentColor(new CinderRand(310))).toEqual(releasePalette[2]);
    const stream=new CinderRand(2701872764),reference=stream.clone();
    nativeSpecies(stream);
    for(let i=0;i<6;i++)reference.nextInt();
    expect(stream.nextInt()).toBe(reference.nextInt());
  });
});
