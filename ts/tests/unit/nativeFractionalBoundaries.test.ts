import {test,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {deserializeFile} from '../../src/lib/gel/serialize';
import {initialGelState,gelReducer} from '../../src/lib/gel/gelState';
import {solveBasesForY} from '../../src/lib/sim/solver';
const root='../reference/native/replay/overlapping-tiers/fractional-boundaries';
for(const target of [61,63,69])test(`original GUI fractional boundary y${target}`,()=>{
 const input=deserializeFile(readFileSync(`${root}/shape-boundary-y${target}-input.json`,'utf8'));
 const saved=deserializeFile(readFileSync(`${root}/shape-boundary-y${target}-native.json`,'utf8'));
 if(input.kind!=='state'||saved.kind!=='sample')throw Error('Unexpected fixture type');
 const state=gelReducer(initialGelState(),{type:'LOAD_GEL_STATE',...input});
 const sample=state.samples[0]!;
 expect(saved.sample.fragments).toHaveLength(1);
 expect(saved.sample.fragments[0].aspectRatio).toBe(Math.fround(1.2));
 expect(saved.sample.fragments[0].bases).toBe(3001);
 expect(solveBasesForY({targetY:target,frag:sample.fragments[0],aggregate:1,lane:0,
  ctx:{...state.ctx,sampleBuffer:sample.buffer},wellRect:state.wellRects[0]})).toBe(saved.sample.fragments[0].bases);
});
