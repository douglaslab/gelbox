import { LAYOUT } from '../layout/layout';
import type { Mesh } from './mesh';
import type { PresentationLayer } from './presentationTypes';

const f=Math.fround;
/** Legacy Cinder RoundedRect/WireRoundedRect tessellation, in panel coordinates. */
function rounded(x1:number,y1:number,x2:number,y2:number,r:number,stroke=false):number[][] {
  const n=Math.max(2,Math.floor(r*Math.PI/2));
  const delta=f(f(1/n)*Math.PI/2);
  const centers=[[x2-r,y2-r],[x1+r,y2-r],[x1+r,y1+r],[x2-r,y1+r]];
  const point=(center:number[],a:number)=>[f(center[0]+f(f(Math.cos(a))*r)),f(center[1]+f(f(Math.sin(a))*r))];
  const points:number[][]=[];
  if(stroke)points.push(point(centers[3],f(f(f(3*f(Math.PI))/2)+f(delta*n))));
  else points.push([f((x1+x2)/2),f((y1+y2)/2)]);
  for(let corner=0;corner<4;corner++){
    let angle=stroke?f(f(corner*f(Math.PI))/2):f(corner*Math.PI/2);
    for(let s=0;s<=n;s++){
      const p=point(centers[corner],angle);points.push(p);if(stroke)points.push(p);
      angle=f(angle+delta);
    }
  }
  if(stroke)points.pop(); // GL_LINES ignores the unmatched last vertex.
  else points.push([x2,y2-r]);
  return points;
}
function mesh(points:number[][],gray:number,fan=false):Mesh {
  const vertices=fan?points.slice(1,-1).flatMap((p,i)=>[points[0],p,points[i+2]]):points;
  const data=new Float32Array(vertices.flatMap(([x,y])=>[x,y,gray/255,gray/255,gray/255,1]));
  return {data,vertexCount:vertices.length};
}
const {x,y}=LAYOUT.fragViewWellTopLeft;
const {x:w,y:h}=LAYOUT.fragViewWellSize;
const r=LAYOUT.fragViewWellCornerRadius;
const {x:dx,y:dy}=LAYOUT.fragViewWellShadowOffset;
export const FRAGMENT_WELL_LAYERS:readonly PresentationLayer[]=[
  {mesh:mesh(rounded(x+dx,y+dy,x+w+dx,y+h+dy,r),240,true)},
  {mesh:mesh(rounded(x,y,x+w,y+h,r),241,true)},
  {mesh:mesh(rounded(x,y,x+w,y+h,r,true),189),topology:'line-list'},
];
