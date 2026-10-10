import type {PresentationLayer,PresentationScene,PresentationScissor} from './presentationTypes';
export interface SceneFrame {width:number;height:number;scale:number}
type Contribution=(frame:SceneFrame)=>readonly PresentationLayer[];
/** Paint ownership only. The application owns view order, state, engines and ticks. */
export class ScenePresentationRegistry {
 private entries=new Map<symbol,{key:string;read:Contribution;order:number}>();
 private listeners=new Map<(scene:ReturnType<ScenePresentationRegistry['collect']>,keys:readonly string[])=>void,(error:unknown)=>void>();
 register(key:string,read:Contribution,order=0){
  const token=Symbol(key);this.entries.set(token,{key,read,order});
  return()=>{this.entries.delete(token);};
 }
 collect(order:readonly string[],frame:SceneFrame):PresentationScene<never>&{commands:PresentationLayer[]}{
  const entries=[...this.entries.values()].sort((a,b)=>a.order-b.order);
  return {background:[1,1,1],commands:order.flatMap(key=>entries.filter(e=>e.key===key).flatMap(e=>e.read(frame)))};
 }
 subscribe(listener:(scene:ReturnType<ScenePresentationRegistry['collect']>,keys:readonly string[])=>void,onError:(error:unknown)=>void=error=>{throw error}){
  this.listeners.set(listener,onError);return()=>{this.listeners.delete(listener);};
 }
 present(order:readonly string[],frame:SceneFrame){
  if(!this.listeners.size)return;
  let scene:ReturnType<ScenePresentationRegistry['collect']>;
  try{scene=this.collect(order,frame);}catch(error){for(const onError of this.listeners.values())onError(error);return;}
  const keys=order.filter(key=>[...this.entries.values()].some(e=>e.key===key));
  for(const [listener,onError] of [...this.listeners])try{listener(scene,keys);}catch(error){onError(error);}
 }
}
/** View.cpp converts the lower-left origin and logical size separately to integers. */
export function nativeViewScissor(rect:{left:number;top:number;width:number;height:number},windowHeight:number,scale:number):PresentationScissor {
 const f=Math.fround;
 const lower=f(f(windowHeight)-f(f(rect.top)+f(rect.height)));
 const bottom=Math.trunc(f(lower*f(scale)));
 const height=Math.trunc(f(Math.trunc(f(rect.height))*f(scale)));
 return {x:Math.trunc(f(f(rect.left)*f(scale))),y:Math.round(windowHeight*scale)-bottom-height,
  width:Math.trunc(f(Math.trunc(f(rect.width))*f(scale))),height};
}
export function solidSceneRect(x1:number,y1:number,x2:number,y2:number,color:readonly number[]):PresentationLayer {
 const tint=[color[0],color[1],color[2],color[3]??1];
 return {mesh:{data:new Float32Array([[x1,y1],[x2,y1],[x2,y2],[x1,y1],[x2,y2],[x1,y2]].flatMap(p=>[...p,...tint])),vertexCount:6}};
}
