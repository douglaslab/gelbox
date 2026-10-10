import type {PresentationCommand,PresentationLayer,PresentationSampling,WellRect} from './presentationTypes';
import {solidRoundedRect,strokedRoundedRect} from './fragmentWellGeometry';
import {solidSceneRect} from './scenePresentation';
import {nativeUiTextLayers,shapeNativeUiText} from './nativeUiText';
type Point={x:number;y:number};
type Color=readonly[number,number,number,number];
export interface SliderPaintInput {
 style:'slider'|'bar'|'graph';value:number;enabled:boolean;
 width:number;iconGutter:number;iconSize:Point;naturalIcons:readonly[Point,Point];
 barSize:Point;barGutter:number;barRadius:number;fill:Color;empty:Color;
 notches:readonly number[];graph:readonly number[];label:string;textColor:Color;highlight:number;
}
const f=Math.fround;
const round=(n:number)=>Math.sign(n)*Math.floor(Math.abs(n)+.5);
const lerp=(a:number,b:number,t:number)=>f(a+f(f(b-a)*f(t)));
const lineColor=f(151/255),handleColor=[f(73/255),f(144/255),f(226/255),1] as const;
const sampling:PresentationSampling={minFilter:'linear',magFilter:'linear',mipmapFilter:'linear',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'};
function snapRect(r:WellRect):WellRect {
 const x=round(r.x1),y=round(r.y1);
 return {x1:x,y1:y,x2:f(x+f(r.x2-r.x1)),y2:f(y+f(r.y2-r.y1))};
}
function line(x1:number,y1:number,x2:number,y2:number,color:readonly number[]):PresentationLayer {
 return {mesh:{data:new Float32Array([x1,y1,...color,x2,y2,...color]),vertexCount:2},topology:'line-list'};
}
function circle(x:number,y:number,r:number,color:readonly number[]):PresentationLayer {
 const segments=Math.max(3,Math.floor(r*Math.PI*2)),delta=f(f(f(1/segments)*2)*f(Math.PI));
 const point=(i:number)=>{const a=f(i*delta);return [f(x+f(f(Math.cos(a))*r)),f(y+f(f(Math.sin(a))*r))];};
 const vertices=[];
 for(let i=0;i<segments;i++)for(const p of [[x,y],point(i),point(i+1)])vertices.push(...p,...color);
 return {mesh:{data:new Float32Array(vertices),vertexCount:segments*3}};
}
/** Pinned Slider::doLayoutInWidth / doLayoutFromBar, local to the native slider. */
export function sliderPaintLayout(input:SliderPaintInput){
 const {naturalIcons,iconSize,style}=input;
 let x1:number,x2:number,cy:number,bar:WellRect;
 const icons:WellRect[]=[];
 if(style==='bar'){
  x1=0;x2=f(input.barSize.x);cy=f(input.barSize.y/2);bar={x1:0,y1:0,x2,y2:f(input.barSize.y)};
  naturalIcons.forEach((size,i)=>{
   const x=i?f(x2+input.barGutter):f(-input.barGutter-size.x),y=f(cy-f(size.y/2));
   icons.push(snapRect({x1:x,y1:y,x2:f(x+size.x),y2:f(y+size.y)}));
  });
 }else{
  cy=f(iconSize.y/2);x1=round(f(iconSize.x+input.iconGutter));x2=round(f(round(f(input.width-iconSize.x))-input.iconGutter));
  naturalIcons.forEach((size,i)=>{
   const pickX=i?round(f(input.width-iconSize.x)):0,center=f(pickX+f(iconSize.x/2));
   icons.push(snapRect({x1:f(center-f(size.x/2)),y1:f(cy-f(size.y/2)),x2:f(center+f(size.x/2)),y2:f(cy+f(size.y/2))}));
  });
  cy=round(cy)+(style==='graph'?16:0);bar={x1,y1:cy,x2,y2:cy};
 }
 return {x1,x2,cy,bar,icons};
}
/** Native paint order: style body, notches, handle, icons, then value text. */
export function sliderPaint<T>(input:SliderPaintInput,textures:readonly(T|null)[],fontTextures:readonly T[],scale:1|2):PresentationCommand<T>[] {
 const {style,enabled,label}=input,{x1,x2,cy,bar,icons}=sliderPaintLayout(input);
 const commands:PresentationCommand<T>[]=[],value=f(input.value),valueX=lerp(x1,x2,value);
 if(style==='slider'){
  const gray=enabled?lineColor:lerp(lineColor,1,.75);
  commands.push(line(x1,f(cy+.5),x2,f(cy+.5),[gray,gray,gray,1]));
 }else if(style==='bar'){
  const fill=(r:WellRect,color:Color)=>{
   const tint=[...color.slice(0,3),enabled?1:.5];
   const radius=Math.min(input.barRadius,Math.min(f(r.x2-r.x1),f(r.y2-r.y1))/2);
   commands.push(input.barRadius<=0?solidSceneRect(r.x1,r.y1,r.x2,r.y2,tint):solidRoundedRect(r,radius,tint));
  };
  fill(bar,input.empty);fill({...bar,x2:valueX},input.fill);
 }else{
  commands.push(line(x1,f(cy-32),x2,f(cy-32),[.9,.9,1,1]));
  const width=f(f(x2-x1)/input.graph.length);
  input.graph.forEach((v,i)=>{
   const left=f(x1+f(width*i)),right=f(left+width),top=f(cy-f(f(v)*32));
   commands.push(solidSceneRect(f(left+1),cy,f(right-1),top,handleColor));
   // Native Rectf is not canonicalized; getUpperLeft stays at the baseline.
   commands.push(line(f(left+1),cy,f(right-1),cy,[lineColor,lineColor,lineColor,1]));
  });
 }
 if(style!=='graph')for(const notch of input.notches){
  const x=round(lerp(x1,x2,notch)),y=round(cy);
  if(style==='bar')commands.push(line(f(x-.5),bar.y1,f(x-.5),bar.y2,[...input.fill.slice(0,3).map(c=>f(f(c)*f(.8))),enabled?1:.5]));
  else{
   const gray=enabled?f(lineColor*.5):lerp(f(lineColor*.5),1,.75);
   commands.push(circle(x,y,2.5,[gray,gray,gray,1]));
  }
 }
 if(style==='slider'){
  const snapped=snapRect({x1:f(valueX-8),y1:f(cy-10),x2:f(valueX+8),y2:f(cy+10)});
  const r={x1:f(snapped.x1+.5),y1:f(snapped.y1+.5),x2:f(snapped.x2-.5),y2:f(snapped.y2-.5)};
  const color=enabled?handleColor:handleColor.map(c=>lerp(c,1,.5));
  if(enabled)commands.push(solidRoundedRect({...r,y1:r.y1+3,y2:r.y2+3},4,[0,0,0,.15]));
  commands.push(solidRoundedRect(r,4,color),strokedRoundedRect(r,4,color.map(c=>f(c*.5))));
 }
 icons.forEach((rect,i)=>{
  const texture=textures[i];if(!texture)return;
  const tint:Color=!enabled?[.85,.85,.85,.5]:i===input.highlight?[.5,.5,.5,1]:[1,1,1,1];
  commands.push({texture,rect,tint,alpha:'straight',colorSpace:'native-unorm',sampling});
 });
 if(label){
  const size=f(shapeNativeUiText(label,scale).size[0]/scale);
  const x=style==='slider'?f(valueX-f(size/2)):style==='bar'?(value>.5?f(f(valueX-8)-size):f(valueX+8)):lerp(x1,x2,.5);
  const y=style==='slider'?f(cy+25):style==='bar'?f(bar.y2-8):f(cy+25);
  commands.push(...nativeUiTextLayers(label,scale,{x:round(x),y:round(y)},fontTextures,input.textColor));
 }
 return commands;
}
