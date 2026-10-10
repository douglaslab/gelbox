import {describe,it,expect} from 'vitest';
import {deserializeFile} from '../../src/lib/gel/serialize';
const buffer={tris:44.5,borate:44.5,acetate:0,edta:1};
const sample=()=>({name:'Old sample',id:4,icon:'tube.png',iconScale:.5,buffer:{...buffer},fragments:[{bases:1000,mass:50,degrade:0,dye:-1,aggregate:[1],aspectRatio:1,color:[.2,.4,.6]}]});
const state=()=>({schema:'gel-state-v0',numLanes:1,samples:[sample(),null,sample()],ctx:{time:.25,voltage:-20,wellDamage:.3,gelBuffer:{...buffer},sampleBuffer:{tris:0,borate:0,acetate:0,edta:0},ySpaceScale:12}});
const decode=(v:unknown)=>deserializeFile(JSON.stringify(v));
describe('legacy web import boundary',()=>{
 it('normalizes visible native lanes and geometry without losing hidden samples or scientific fields',()=>{
  const input=state(),out=decode(input);expect(out.kind).toBe('state');if(out.kind!=='state')return;
  expect(out.numLanes).toBe(7);expect(out.samples).toEqual([...input.samples,null,null,null,null]);
  expect(out.ctx).toEqual({...input.ctx,sampleBuffer:buffer,ySpaceScale:480-78/7});
 });
 it('caps visible lanes while retaining extra sample storage',()=>{
  const input=state();input.numLanes=22;input.samples=Array.from({length:22},sample);const out=decode(input);
  expect(out.kind==='state'&&out.numLanes).toBe(20);expect(out.kind==='state'&&out.samples).toHaveLength(22);
 });
 it('preserves optional sample metadata without importing runtime ancestry',()=>{
  const input={schema:'gel-sample-v0',...sample(),originSample:{bad:true}};
  expect(decode(input)).toEqual({kind:'sample',sample:sample()});
 });
 for(const [name,mutate] of [
  ['samples',(v:any)=>v.samples={}],['sample',(v:any)=>v.samples[0]=7],
  ['fragments',(v:any)=>v.samples[0].fragments={}],['fragment',(v:any)=>v.samples[0].fragments[0]=null],
  ['buffer',(v:any)=>v.samples[0].buffer.tris='44.5'],['mass',(v:any)=>v.samples[0].fragments[0].mass=null],
  ['bases',(v:any)=>v.samples[0].fragments[0].bases=1.5],['dye',(v:any)=>v.samples[0].fragments[0].dye=4],
  ['color',(v:any)=>v.samples[0].fragments[0].color=[1,1]],['aggregate',(v:any)=>v.samples[0].fragments[0].aggregate=['1']],
  ['metadata',(v:any)=>v.samples[0].id=1.5],['lane count',(v:any)=>v.numLanes=0],
  ['context',(v:any)=>v.ctx=null],['time',(v:any)=>v.ctx.time='1'],['gel buffer',(v:any)=>delete v.ctx.gelBuffer.edta],
 ] as const)it(`rejects malformed ${name} before dispatch`,()=>{const v=state();mutate(v);expect(()=>decode(v)).toThrow(/Invalid legacy Gelbox field:/);});
 it('rejects malformed legacy sample files too',()=>expect(()=>decode({schema:'gel-sample-v0',buffer,fragments:null})).toThrow(/Invalid legacy/));
});
