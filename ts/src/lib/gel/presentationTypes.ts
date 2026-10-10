/** Presentation geometry uses physical pixels; wells remain in gel units. */
export interface PresentationSize { width:number; height:number }
export interface WellRect { x1:number; y1:number; x2:number; y2:number }

export function wellVertices(wells:readonly WellRect[],scale:number):Float32Array {
  const data=new Float32Array(wells.length*10);
  wells.forEach(({x1,y1,x2,y2},i)=>data.set(
    [x1,y1,x2,y1,x2,y2,x1,y2,x1,y1].map(value=>value*scale),i*10));
  return data;
}

export function validatePresentationSize({width,height}:PresentationSize):void {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)
    throw new Error('Gel presentation requires positive integer pixel dimensions');
}

/** A direct scene draws its triangles into the same samples as the wells. */
export interface DirectPresentationBase {
  mesh:import('./mesh').Mesh;
  underlay?:readonly PresentationLayer[];
  /** Logical coordinate at the presentation surface origin. */
  origin?:{x:number;y:number};
  /** Opaque native display-domain background; defaults to gel black. */
  background?:readonly [number,number,number];
}
export interface PresentationOptions {
  meshBlend?:'additive'|'over';
  /** Resolve covered pixels opaquely, leaving untouched pixels transparent.
   * The caller must supply the actual opaque underlay color. */
  cutout?:boolean;
}
export function physicalBandVertices(base:DirectPresentationBase,scale:number):Float32Array {
  const data=base.mesh.data.slice();
  for(let i=0;i<data.length;i+=6){data[i]*=scale;data[i+1]*=scale;}
  return data;
}

export interface PresentationLayer {
  mesh:import('./mesh').Mesh;
  topology?:'triangle-list'|'line-list';
}

/** Pack ordered geometry into one upload; the main mesh follows its underlay. */
export function directPresentationGeometry(base:DirectPresentationBase,scale:number) {
  const layers=[...(base.underlay??[]),{mesh:base.mesh} as PresentationLayer];
  const count=layers.reduce((n,layer)=>n+layer.mesh.vertexCount,0);
  const data=new Float32Array(count*6);
  let first=0;
  const draws=layers.map(({mesh,topology='triangle-list'})=>{
    data.set(mesh.data.subarray(0,mesh.vertexCount*6),first*6);
    const draw={first,count:mesh.vertexCount,topology};first+=mesh.vertexCount;return draw;
  });
  for(let i=0;i<data.length;i+=6){data[i]=(data[i]-(base.origin?.x??0))*scale;data[i+1]=(data[i+1]-(base.origin?.y??0))*scale;}
  return {data,draws};
}
