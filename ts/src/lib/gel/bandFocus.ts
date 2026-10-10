import {isDyeFragment} from '../sim/sample';
import type {Band,Rect} from '../sim/band';
import {bandUIRect,type BandLaneFragment} from '../sim/sampleFromGel';
import type {GelState} from './gelState';
import {fragmentIndexIn} from './sampleFragRef';
import type {PresentationLayer} from './presentationTypes';
export interface BandFocus {rect:Rect;color:readonly number[];selected:boolean;hovered:boolean}
const f=Math.fround;
/** GelSim focus colors retain native float channels; sample identity owns focus. */
export function bandFocusState(bands:readonly Band[],mapping:readonly BandLaneFragment[],state:GelState):BandFocus[]{
 return bands.map((band,i)=>{
  const {lane,fragment}=mapping[i],sample=state.samples[lane],frag=sample?.fragments[fragment];
  return {rect:bandUIRect(band),color:frag&&isDyeFragment(frag)?band.color.map(c=>f(f(c)*.5)):frag?.color??[1,1,1],
   selected:fragmentIndexIn(state.selection,sample)===fragment,hovered:fragmentIndexIn(state.rollover,sample)===fragment};
 });
}
/** GelView::drawBandFocus and Cinder's two-unit drawStrokedRect triangle strip. */
export function buildBandFocusLayers(bands:readonly BandFocus[]):PresentationLayer[]{
 const layers:PresentationLayer[]=[];
 for(const band of bands){
  if(!band.selected&&!band.hovered)continue;
  const alpha=Math.min(1,f((band.selected?f(.65):0)+(band.hovered?f(.35):0)));
  const r=band.rect,x1=f(f(r.x1)-1),y1=f(f(r.y1)-1),x2=f(f(r.x2)+1),y2=f(f(r.y2)+1);
  const a=f(x1+1),b=f(y1+1),c=f(x2-1),d=f(y2-1),e=f(x1-1),g=f(y1-1),h=f(x2+1),j=f(y2+1);
  const points=[[a,d],[a,b],[e,j],[e,g],[a,b],[c,b],[e,g],[h,g],[c,b],[c,d],[h,g],[h,j],[c,d],[a,d],[h,j],[e,j]];
  const triangles=points.slice(2).flatMap((p,i)=>i%2?[points[i+1],points[i],p]:[points[i],points[i+1],p]);
  layers.push({mesh:{data:new Float32Array(triangles.flatMap(p=>[...p,band.color[0],band.color[1],band.color[2],alpha])),vertexCount:triangles.length}});
 }
 return layers;
}
