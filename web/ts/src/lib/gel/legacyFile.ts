import type {DeserializedFile} from './serialize';
import type {Sample,Fragment} from '../sim/sample';
import {BUFFER_TBE,type Buffer} from '../sim/buffer';

type Fields=Record<string,unknown>;
function invalid(path:string):never {throw new Error(`Invalid legacy Gelbox field: ${path}`);}
function object(v:unknown,path:string):Fields {
 if(!v||typeof v!=='object'||Array.isArray(v))return invalid(path);
 return v as Fields;
}
function number(v:unknown,path:string):number {
 if(typeof v!=='number'||!Number.isFinite(v))return invalid(path);
 return v;
}
function integer(v:unknown,path:string):number {
 const n=number(v,path);
 if(!Number.isInteger(n)||n< -2147483648||n>2147483647)return invalid(path);
 return n;
}
function array(v:unknown,path:string):unknown[] {
 if(!Array.isArray(v))return invalid(path);
 return v;
}
function buffer(v:unknown,path:string):Buffer {
 const b=object(v,path);
 return {tris:number(b.tris,`${path}.tris`),borate:number(b.borate,`${path}.borate`),acetate:number(b.acetate,`${path}.acetate`),edta:number(b.edta,`${path}.edta`)};
}
function fragment(v:unknown,path:string):Fragment {
 const f=object(v,path),color=array(f.color,`${path}.color`),dye=integer(f.dye,`${path}.dye`);
 if(color.length!==3)return invalid(`${path}.color`);
 if(dye< -1||dye>3)return invalid(`${path}.dye`);
 return {bases:integer(f.bases,`${path}.bases`),mass:number(f.mass,`${path}.mass`),degrade:number(f.degrade,`${path}.degrade`),
  aspectRatio:number(f.aspectRatio,`${path}.aspectRatio`),dye,
  color:color.map((v,i)=>number(v,`${path}.color[${i}]`)) as Fragment['color'],
  aggregate:array(f.aggregate,`${path}.aggregate`).map((v,i)=>number(v,`${path}.aggregate[${i}]`))};
}
function sample(v:unknown,path:string):Sample {
 const s=object(v,path),result:Sample={buffer:buffer(s.buffer,`${path}.buffer`),fragments:array(s.fragments,`${path}.fragments`).map((v,i)=>fragment(v,`${path}.fragments[${i}]`))};
 for(const key of ['name','icon'] as const)if(s[key]!==undefined){if(typeof s[key]!=='string')return invalid(`${path}.${key}`);result[key]=s[key];}
 if(s.iconScale!==undefined)result.iconScale=number(s.iconScale,`${path}.iconScale`);
 if(s.id!==undefined)result.id=integer(s.id,`${path}.id`);
 return result;
}
/** Legacy documents contain scientific inputs plus obsolete layout/selection context.
 * Preserve inputs and hidden slots; normalize visible lanes to native7..20 and
 * rebuild layout scale for390×520. Per-sample buffers replace old selected-buffer
 * context, just as native import does. Unknown fields never enter live state. */
export function deserializeLegacyFile(value:unknown):DeserializedFile {
 const root=object(value,'root');
 if(root.schema==='gel-sample-v0')return {kind:'sample',sample:sample(root,'Sample')};
 if(root.schema!=='gel-state-v0')return invalid('schema');
 const lanes=integer(root.numLanes,'numLanes');if(lanes<1)return invalid('numLanes');
 const numLanes=Math.min(20,Math.max(7,lanes));
 const samples=array(root.samples,'samples').map((v,i)=>v===null?null:sample(v,`samples[${i}]`));
 while(samples.length<numLanes)samples.push(null);
 const ctx=object(root.ctx,'ctx');
 return {kind:'state',samples,numLanes,ctx:{time:number(ctx.time,'ctx.time'),voltage:number(ctx.voltage,'ctx.voltage'),wellDamage:number(ctx.wellDamage,'ctx.wellDamage'),gelBuffer:buffer(ctx.gelBuffer,'ctx.gelBuffer'),sampleBuffer:{...BUFFER_TBE},ySpaceScale:520-20*2-(390/numLanes)*.2}};
}
