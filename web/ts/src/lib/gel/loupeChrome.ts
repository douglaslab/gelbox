import {sampleFrame} from './sampleFrame';
import {loupeHull,type Point} from './loupeGeometry';
import type {PresentationLayer} from './presentationTypes';
const f=Math.fround;
function layer(points:number[][],color:number[],topology:PresentationLayer['topology']='triangle-list'):PresentationLayer {
 return {mesh:{data:new Float32Array(points.flatMap(p=>[...p,...color])),vertexCount:points.length},topology};
}
function strip(points:number[][]):number[][] {
 return points.slice(2).flatMap((p,i)=>i%2?[points[i+1],points[i],p]:[points[i],points[i+1],p]);
}
/** Legacy Cinder Ring: float arithmetic and its intentionally approximate pi. */
export function loupeRing(center:Point,width:number):number[][] {
 const radius=f(16*f(.65)),n=Math.floor(radius*Math.PI*2),delta=f(f(f(1/n)*2)*f(3.14159));
 const inner=f(radius-f(.5*f(width))),outer=f(radius+f(.5*f(width)));
 const points:number[][]=[];let angle=0;
 for(let i=0;i<=n;i++){
  const x=f(Math.cos(angle)),y=f(Math.sin(angle));
  for(const r of [inner,outer])points.push([f(f(center.x)+f(x*r)),f(f(center.y)+f(y*r))]);
  angle=f(angle+delta);
 }
 return points;
}
/** Commands on either side of SampleSimCanvas's shadow/background/particles. */
export function loupeChrome(frame:Point,anchor:Point,focused:boolean,hover:boolean,anchorHover:boolean,transient:boolean,size=171){
 const before:PresentationLayer[]=[],after:PresentationLayer[]=[];
 const local={x:f(f(anchor.x)-f(frame.x)),y:f(f(anchor.y)-f(frame.y))};
 if(!transient){
  const active=focused||anchorHover,width=active?1.5:1.1;
  before.push(layer(strip(loupeRing({...local,y:f(local.y+2)},width)),[0,0,0,active ? .35 : .1]));
  before.push(layer(strip(loupeRing(local,width)),[1,1,1,active?1:.6]));
 }
 const hull=loupeHull(frame,anchor,size).map(p=>[f(f(p.x)-f(frame.x)),f(f(p.y)-f(frame.y))]);
 before.push(layer(hull.slice(2).flatMap((p,i)=>[hull[0],hull[i+1],p]),[1,1,1,.25]));
 before.push(layer([...hull,hull[0]],[1,1,1,.15],'line-strip'));
 after.push(...sampleFrame(size,size,focused,hover));
 return {before,after};
}
