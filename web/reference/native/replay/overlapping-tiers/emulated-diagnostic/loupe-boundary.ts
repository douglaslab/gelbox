import {readFileSync} from 'node:fs';
import {fragToBands} from '../../../../../ts/src/lib/sim/gelSim';
import {makeSampleFromGel,pickSmearAbove,pickSmearBelow} from '../../../../../ts/src/lib/sim/sampleFromGel';
const root=process.cwd()+'/reference/native/numerical/';
const id='loupe-degraded-multimer';
const c=JSON.parse(readFileSync(root+'cases.json','utf8')).find((c:any)=>c.id===id);
const ref=JSON.parse(readFileSync(root+'outputs.json','utf8')).find((c:any)=>c.id===id);
const bands=fragToBands(c.sample,c.fragment,c.wellRect,c.lane,c.ctx);
const results=[];
for(const probe of ref.loupeProbes){
 const derived=makeSampleFromGel(probe.point,bands,bands.map(()=>({lane:0,fragment:0})),[c.sample],[c.wellRect],c.ctx);
 if(derived.sample.fragments.some((frag,i)=>Math.abs(frag.mass-probe.fragments[i]?.mass)>0.001))results.push({point:probe.point,expectedMass:probe.fragments.map((f:any)=>f.mass),actualMass:derived.sample.fragments.map(f=>f.mass),bands:bands.map((b,i)=>({aggregate:b.aggregate,rect:b.rect,sourceModelRect:ref.bands[i].rect,above:pickSmearAbove(b,probe.point),below:pickSmearBelow(b,probe.point),brightness:b.brightness}))});
}
console.log(JSON.stringify(results,null,2));
