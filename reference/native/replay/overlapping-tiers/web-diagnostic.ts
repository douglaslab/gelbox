import {readFileSync,writeFileSync} from 'node:fs';
import {deserializeFile} from '/Users/shawn/.codex/worktrees/3f9f/gel/ts/src/lib/gel/serialize';
import {initialGelState,gelReducer} from '/Users/shawn/.codex/worktrees/3f9f/gel/ts/src/lib/gel/gelState';
import {fragToBands} from '/Users/shawn/.codex/worktrees/3f9f/gel/ts/src/lib/sim/gelSim';
import {bandUIRect,pickBand} from '/Users/shawn/.codex/worktrees/3f9f/gel/ts/src/lib/sim/sampleFromGel';
import {solveBasesForY} from '/Users/shawn/.codex/worktrees/3f9f/gel/ts/src/lib/sim/solver';
const doc=deserializeFile(readFileSync('/Users/shawn/.codex/worktrees/3f9f/gel/reference/native/replay/overlapping-tiers/input.json','utf8'));
if(doc.kind!=='state')throw Error('state');
const state=gelReducer(initialGelState(),{type:'LOAD_GEL_STATE',...doc});
const sample=state.samples[0]!;
for(const time of [.1,Math.fround(.1)]){
const ctx={...state.ctx,time,sampleBuffer:sample.buffer};
const bands=fragToBands(sample,0,state.wellRects[0],0,ctx);
console.log(JSON.stringify({time,ctx,bands:bands.map(b=>({aggregate:b.aggregate,rect:b.rect,ui:bandUIRect(b)})),picked:pickBand({x:28,y:25},bands)?.band.aggregate,solves:bands.map(b=>({aggregate:b.aggregate,values:[18,19,20,21,22].map(delta=>[delta,solveBasesForY({targetY:b.rect.y1+delta,frag:sample.fragments[0],aggregate:b.aggregate,lane:0,ctx,wellRect:state.wellRects[0]})])}))},null,2));
}

writeFileSync('/tmp/gel-overlap-native-case.json',JSON.stringify([{id:'overlap-drag',sample,ctx:{...state.ctx,sampleBuffer:sample.buffer},wellRect:state.wellRects[0],fragment:0,lane:0,solverTargets:[{targetY:40,aggregate:3},{targetY:45,aggregate:2}]}]));
