import {test,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {deserializeFile} from '../../src/lib/gel/serialize';
import {initialGelState,gelReducer} from '../../src/lib/gel/gelState';
import {fragToBands} from '../../src/lib/sim/gelSim';
import {pickBand} from '../../src/lib/sim/sampleFromGel';
import {solveBasesForY} from '../../src/lib/sim/solver';

test('original release overlapping aggregate drag selects the narrower trimer and saves922bp',()=>{
 const input=deserializeFile(readFileSync('../reference/native/replay/overlapping-tiers/input.json','utf8'));
 if(input.kind!=='state')throw Error('Expected gel fixture');
 const state=gelReducer(initialGelState(),{type:'LOAD_GEL_STATE',...input});
 const sample=state.samples[0]!;const well=state.wellRects[0];
 const ctx={...state.ctx,sampleBuffer:sample.buffer};
 const bands=fragToBands(sample,0,well,0,ctx);
 for(const y of [25,26,27]){
  const picked=pickBand({x:28,y},bands)!;
  expect(picked.band.aggregate).toBe(3);
  expect(solveBasesForY({targetY:picked.band.rect.y1+20,aggregate:picked.band.aggregate,frag:sample.fragments[0],lane:0,ctx,wellRect:well})).toBe(922);
 }
});
