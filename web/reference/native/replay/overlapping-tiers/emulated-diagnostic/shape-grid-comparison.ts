import {readFileSync} from 'node:fs';
import {fragToBands} from '../../../../../ts/src/lib/sim/gelSim';
const cases=JSON.parse(readFileSync('reference/native/replay/overlapping-tiers/emulated-diagnostic/shape-grid.json','utf8'));
const results=cases.map((c:any)=>{const band=fragToBands({buffer:c.ctx.sampleBuffer,fragments:[{bases:c.bases,mass:125,degrade:0,dye:-1,aspectRatio:c.aspect,aggregate:[1],color:[.2,.4,.8]}]},0,c.wellRect,0,c.ctx)[0];const actual=[band.rect.x1,band.rect.y1,band.rect.x2,band.rect.y2];return {id:c.id,actual,emulated:c.rect,matches:actual.every((v,i)=>v===c.rect[i])};});
console.log(JSON.stringify({checked:results.length,matched:results.filter((r:any)=>r.matches).length,results},null,2));
