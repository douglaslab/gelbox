import {readFileSync} from 'node:fs';
import {fragToBands} from '../../../../../ts/src/lib/sim/gelSim';
const root=process.cwd();
const cases=JSON.parse(readFileSync(root+'/reference/native/numerical/cases.json','utf8'));
const refs=JSON.parse(readFileSync('/tmp/gel-expanded-geometry.json','utf8'));
const mismatches=[],powDifferences=[];let checked=0;
for(const c of cases){
 const bands=fragToBands(c.sample,c.fragment,c.wellRect,c.lane,c.ctx);
 for(const band of bands){
  checked++;const ref=refs.find((r:any)=>r.id===c.id&&r.aggregate===band.aggregate)!;
  const rect=[band.rect.x1,band.rect.y1,band.rect.x2,band.rect.y2];
  if(rect.some((v,i)=>v!==ref.rect[i]))mismatches.push({id:c.id,aggregate:band.aggregate,aspect:c.sample.fragments[c.fragment].aspectRatio,dye:c.sample.fragments[c.fragment].dye,actual:rect,emulated:ref.rect});
  for(const call of ref.powCalls){const js=Math.fround(Math.pow(call.base,call.exponent));if(js!==call.result)powDifferences.push({id:c.id,...call,js});}
 }
}
console.log(JSON.stringify({checked,matched:checked-mismatches.length,mismatches,powDifferences},null,2));
