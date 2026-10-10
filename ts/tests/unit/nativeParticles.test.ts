import {readFileSync} from 'node:fs';
import {expect, it} from 'vitest';
import {CinderRand} from '../../src/lib/sim/rng';
import {loupeSeed} from '../../src/lib/sim/loupeSeed';
import {MolecularSim} from '../../src/lib/sim/molecularSimEngine';
const cases=JSON.parse(readFileSync('../reference/native/numerical/particle-cases.json','utf8'));
const refs=JSON.parse(readFileSync('../reference/native/numerical/particle-outputs.json','utf8'));
function check(actual:any,expected:any,path:string) {
  if(typeof expected==='number') {
    expect(Number.isFinite(actual),path).toBe(true);
    if(path.endsWith('.fragment')) expect(actual,path).toBe(expected);
    else expect(Math.abs(actual-expected),`${path}: web ${actual}, native ${expected}`).toBeLessThanOrEqual(Math.max(.0001,Math.abs(expected)*2e-6));
  } else if(Array.isArray(expected)) {
    expect(actual.length,path).toBe(expected.length);
    expected.forEach((x,i)=>check(actual[i],x,`${path}[${i}]`));
  } else if(typeof expected==='object') {
    for(const [k,v] of Object.entries(expected))check(actual[k],v,`${path}.${k}`);
  } else expect(actual,path).toBe(expected);
}
it.each(cases.map((c:any,i:number)=>[c.id,c,refs[i]]))('native particle lifecycle: %s',(_id,c,ref)=>{
  expect(c.id).toBe(ref.id);
  if(c.seedProbes)expect(c.seedProbes.map((p:any)=>loupeSeed(p,p.time))).toEqual(ref.seedProbes);
  const sim = new MolecularSim({bounds:c.bounds,seed:c.seed,globalSeed:c.globalSeed});
  sim.setSample(c.sample);
  c.steps.forEach((step:any,i:number)=>{
    if(step.loupe) {
      const l=step.loupe;
      const seed=loupeSeed(l,l.time);
      expect(seed,`native detail seed ${c.id}/${i}`).toBe(ref.seeds[i]);
      sim.setRand(seed);
      sim.parts=[];
    }
    if(step.sample)sim.setSample(step.sample);
    if(step.bounds)sim.setBounds(step.bounds);
    if(step.popDensityScale!==undefined)sim.popDensityScale=step.popDensityScale;
    if(step.timeScale!==undefined)sim.timeScale=step.timeScale;
    for(const f of step.spawn??[])sim.parts.push((sim as any).spawnPart(f));
    for(let tick=0;tick<(step.ticks??0);tick++)sim.tick(step.bulletTime??false);
    if(step.preroll)sim.preroll();
    if(step.parts)sim.parts=structuredClone(step.parts);
    check(sim.parts,ref.frames[i],`frame${i}`);
    if(step.picks) expect(step.picks.map(([x,y]:number[])=>({part:sim.pickPart(x,y),fragment:sim.pickFragment(x,y)}))).toEqual(ref.picks[i]);
  });
});

it.each(cases.map((c:any,i:number)=>[c.id,c,refs[i]]))('native Cinder RNG across twist boundary: %s',(_id,c,ref)=>{
  const ints=new CinderRand(c.seed), floats=new CinderRand(c.seed);
  expect(Array.from({length:700},()=>ints.nextUint())).toEqual(ref.uints);
  expect(Array.from({length:700},()=>floats.nextFloat())).toEqual(ref.floats);
});
