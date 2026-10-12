import {test,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {deserializeFile} from '../../src/lib/gel/serialize';
import {initialGelState,gelReducer} from '../../src/lib/gel/gelState';
import {solveBasesForY} from '../../src/lib/sim/solver';
const root='../reference/native/replay/overlapping-tiers/boundaries';
const requests:Array<{id:string;target:number}>=JSON.parse(readFileSync(`${root}/requests.json`,'utf8'));
for(const {id,target} of requests)test(`original GUI boundary ${id}`,()=>{
 const input=deserializeFile(readFileSync(`${root}/${id}-input.json`,'utf8'));
 const saved=deserializeFile(readFileSync(`${root}/${id}-native.json`,'utf8'));
 if(input.kind!=='state'||saved.kind!=='sample')throw Error('Unexpected fixture type');
 const state=gelReducer(initialGelState(),{type:'LOAD_GEL_STATE',...input});
 expect(saved.sample.fragments).toHaveLength(2);
 expect(saved.sample.fragments[0]).toEqual(state.samples[0]!.fragments[0]);
 const created=saved.sample.fragments[1];
 expect(created.aspectRatio).toBe(1);expect(created.degrade).toBe(0);
 expect(created.aggregate).toEqual([1,0,0,0,0,0,0]);
 expect(solveBasesForY({targetY:target,frag:created,aggregate:1,lane:0,
  ctx:{...state.ctx,sampleBuffer:saved.sample.buffer},wellRect:state.wellRects[0]})).toBe(created.bases);
});
