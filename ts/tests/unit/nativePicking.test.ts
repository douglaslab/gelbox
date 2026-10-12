import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { fragToBands } from '../../src/lib/sim/gelSim';
import { bandUIRect, pickBand } from '../../src/lib/sim/sampleFromGel';
const cases=JSON.parse(readFileSync('../reference/native/numerical/cases.json','utf8'));
const outputs=JSON.parse(readFileSync('../reference/native/numerical/release-x86_64/outputs.json','utf8'));
it.each(cases.map((c:any,i:number)=>[c.id,c,outputs[i]]))('native UI rectangle: %s',(_id,c,ref)=>{
  const bands=fragToBands(c.sample,c.fragment,c.wellRect,c.lane,c.ctx);
  expect(bands).toHaveLength(ref.nativeMetadata.length);
  bands.forEach((b:any,i:number)=>{
    const actual=bandUIRect(b),native=ref.nativeMetadata[i].uiRect;
    const tolerance=Math.max(.0003,12*2**-23*Math.max(1,...Object.values(native).map(v=>Math.abs(v as number))));
    for(const key of ['x1','x2','y1','y2'] as const) expect(Math.abs(actual[key]-native[key])).toBeLessThanOrEqual(tolerance);
  });
});
const base=outputs.find((r:any)=>r.id==='aggregate-3').bands[0];
it('adds flames after smear and blur rather than taking their maximum',()=>{
  const b={...base,rect:{x1:10,x2:50,y1:100,y2:120},smearAbove:10,smearBelow:20,flameHeight:30,blur:2};
  expect(bandUIRect(b)).toEqual({x1:8,x2:52,y1:58,y2:142});
});
it('picks the smallest hit height regardless of stacking, then the first equal-height band',()=>{
  const small={...base,rect:{x1:10,x2:50,y1:100,y2:110},smearAbove:0,smearBelow:0,flameHeight:0,blur:1};
  const large={...small,blur:10};
  expect(pickBand({x:30,y:105},[small,large])?.index).toBe(0);
  expect(pickBand({x:30,y:105},[large,small])?.index).toBe(1);
  expect(pickBand({x:30,y:105},[small,{...small}])?.index).toBe(0);
  expect(pickBand({x:500,y:105},[small,large])).toBeNull();
});
