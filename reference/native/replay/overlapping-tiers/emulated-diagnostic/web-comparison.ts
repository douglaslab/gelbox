import {readFileSync} from 'node:fs';
import {fragToBands} from '../../../../../ts/src/lib/sim/gelSim';
const root=process.env.GEL_REPO ?? process.cwd();
const cases=JSON.parse(readFileSync(root+'/reference/native/numerical/cases.json','utf8'));
const reference=JSON.parse(readFileSync(root+'/reference/native/replay/overlapping-tiers/emulated-diagnostic/result.json','utf8'));
const f=Math.fround;
console.log(JSON.stringify(reference.controls.map((control:any)=>{
 const c=cases.find((c:any)=>c.id===control.id);const frag={...c.sample.fragments[c.fragment],bases:control.bases};
 const band=fragToBands({...c.sample,fragments:[frag]},0,c.wellRect,c.lane,c.ctx)[0];
 const direct=f(f((control.bases-1)*control.aggregate)/f(14000));
 const reciprocal=f(f((control.bases-1)*control.aggregate)*f(1/f(14000)));
 const powBase=f(1-reciprocal);
 const curve=f(f(.05)+f(Math.pow(powBase,f(3.7))));
 const delta=f(f(f(f(c.ctx.time)*f(1+f(f(f(c.ctx.voltage)-f(70))/f(70))))*f(c.ctx.ySpaceScale))*curve);
 const inflate=f(f(f(f(c.wellRect.y2)-f(c.wellRect.y1))*f(c.ctx.time))*f(f(f(1.5)-1)*.5));
 const modeledRect=[f(c.wellRect.x1),f(f(f(c.wellRect.y1)+delta)-inflate),f(c.wellRect.x2),f(f(f(c.wellRect.y2)+delta)+inflate)];
 return {modeledRect,...control,webRect:band.rect,normalization:{direct,reciprocal},webPowBase:f(1-direct),webPowResult:f(Math.pow(f(1-direct),f(3.7))),matchedInputWebPowResult:f(Math.pow(control.powCalls[0].base,control.powCalls[0].exponent))};
}),null,2));
