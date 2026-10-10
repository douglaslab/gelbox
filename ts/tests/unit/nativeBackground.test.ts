import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
import {computeBackgroundColor} from '../../src/lib/sim/molecularSimBackground';
const cases=JSON.parse(readFileSync('../reference/native/numerical/background/cases.json','utf8'));
const native=JSON.parse(readFileSync('../reference/native/numerical/background/outputs.json','utf8'));
it.each(cases.map((c:any,i:number)=>[c.id,c,native[i]]))('native background arithmetic: %s',(_id,c,ref)=>{
 expect(c.id).toBe(ref.id);
 expect(computeBackgroundColor(ref.dyes,c.highlight)).toEqual(ref.color);
});
