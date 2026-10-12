import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { MolecularSim } from '../../src/lib/sim/molecularSimEngine';
import { fragToBands } from '../../src/lib/sim/gelSim';
import { makeSampleFromGel } from '../../src/lib/sim/sampleFromGel';
const cases=JSON.parse(readFileSync('../reference/native/numerical/cases.json','utf8'));
const outputs=JSON.parse(readFileSync('../reference/native/numerical/release-x86_64/outputs.json','utf8'));
function check(actual:any,expected:any,path='fragment') {
  if(typeof expected==='number') {
    expect.soft(Number.isFinite(actual),path).toBe(true);
    expect.soft(Math.abs(actual-expected),`${path}: web${actual}, native${expected}`).toBeLessThanOrEqual(Math.max(.00001,Math.abs(expected)*3e-6));
  } else if(Array.isArray(expected)) {
    expect(actual).toHaveLength(expected.length);
    expected.forEach((e,i)=>check(actual[i],e,`${path}[${i}]`));
  } else if(typeof expected==='object') {
    for(const [key,value] of Object.entries(expected))check(actual[key],value,`${path}.${key}`);
  } else expect(actual).toBe(expected);
}
it.each(cases.map((c:any,i:number)=>[c.id,c,outputs[i]]))('native molecular fragment setup: %s',(_id,c,ref)=>{
  const sim=new MolecularSim({bounds:{x1:0,y1:0,x2:400,y2:400},seed:1});
  sim.setSample(c.sample);check(sim.fragments,ref.molecular);
  for(const request of ref.molecularFiltered){
    sim.setSample(c.sample,new Map([[request.index,request.bases]]));check(sim.fragments,request.fragments,`filter${request.bases}`);
  }
  const bands=fragToBands(c.sample,c.fragment,c.wellRect,c.lane,c.ctx);
  const samples=Array(c.lane+1).fill(null);samples[c.lane]=c.sample;
  for(const probe of ref.loupeProbes){
    const derived=makeSampleFromGel(probe.point,bands,bands.map(()=>({lane:c.lane,fragment:c.fragment})),samples,Array(c.lane+1).fill(c.wellRect),c.ctx);
    sim.setSample(derived.sample,derived.degradeFilter);check(sim.fragments,probe.molecular,'loupe');
  }
});
