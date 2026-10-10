import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { fragToBands } from '../../src/lib/sim/gelSim';
import { makeSampleFromGel } from '../../src/lib/sim/sampleFromGel';
const cases=JSON.parse(readFileSync('../reference/native/numerical/cases.json','utf8'));
const outputs=JSON.parse(readFileSync('../reference/native/numerical/outputs.json','utf8'));
it.each(cases.filter((c:any)=>c.loupeProbes).map((c:any)=>[c.id,c]))('native synthetic loupe sample: %s',(_id,c)=>{
  const probes=outputs.find((r:any)=>r.id===c.id).loupeProbes;
  expect(probes.length).toBeGreaterThan(0);
  const bands=fragToBands(c.sample,c.fragment,c.wellRect,c.lane,c.ctx);
  const samples=Array(c.lane+1).fill(null);samples[c.lane]=c.sample;
  const wells=Array(c.lane+1).fill(c.wellRect);
  for(const probe of probes){
    const actual=makeSampleFromGel(probe.point,bands,bands.map(()=>({lane:c.lane,fragment:c.fragment})),samples,wells,c.ctx);
    expect(actual.sample.buffer).toEqual(probe.buffer);
    expect([...actual.degradeFilter]).toEqual(probe.filter);
    expect(actual.sample.fragments).toHaveLength(probe.fragments.length);
    actual.sample.fragments.forEach((f,i)=>{
      const native=probe.fragments[i];
      expect((actual as any).origins[i]).toEqual({lane:c.lane,fragment:native.originFragment});
      for(const key of ['bases','dye','aggregate'] as const)expect(f[key]).toEqual(native[key]);
      for(const key of ['mass','degrade','aspectRatio'] as const)expect(Math.abs(f[key]-native[key])).toBeLessThanOrEqual(Math.max(.00001,Math.abs(native[key])*2e-6));
      f.color.forEach((v,j)=>expect(Math.abs(v-native.color[j])).toBeLessThanOrEqual(2e-6));
    });
  }
});
