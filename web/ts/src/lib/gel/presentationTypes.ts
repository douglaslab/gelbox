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
  /** Logical native window dimensions. Compose projection with the view before
   * transforming vertices, as Cinder's ciModelViewProjection does. */
  windowSize?:PresentationSize;
  /** Composite direct geometry into a transparent premultiplied surface.
   * Uses source-over blending and ignores the opaque background color. */
  transparent?:boolean;
}
export function physicalBandVertices(base:DirectPresentationBase,scale:number):Float32Array {
  const data=base.mesh.data.slice();
  for(let i=0;i<data.length;i+=6){data[i]*=scale;data[i+1]*=scale;}
  return data;
}

export type PresentationBlend='additive'|'over';
export type PresentationTopology='triangle-list'|'line-list'|'line-strip';
/** Column-major affine [a,b,c,d,tx,ty], mapping local positions into root coordinates. */
export type PresentationTransform=readonly [number,number,number,number,number,number];
/** Physical pixels with a top-left origin, independent of the layer transform. */
export interface PresentationScissor {x:number;y:number;width:number;height:number}
export interface PresentationLayer {
  mesh:import('./mesh').Mesh;
  topology?:PresentationTopology;
  blend?:PresentationBlend;
  transform?:PresentationTransform;
  scissor?:PresentationScissor;
}
export function presentationBlend(blend:PresentationBlend|undefined,options:PresentationOptions):PresentationBlend {
  if(options.transparent&&blend==='additive')throw new Error('Additive layers require an opaque presentation surface');
  return blend??(options.transparent?'over':options.meshBlend??'additive');
}
export function clipPresentationScissor(clip:PresentationScissor|undefined,size:PresentationSize):PresentationScissor|null {
  if(!clip)return {x:0,y:0,width:size.width,height:size.height};
  if(![clip.x,clip.y,clip.width,clip.height].every(Number.isSafeInteger)||clip.width<0||clip.height<0)
    throw new Error('Presentation scissor requires integer coordinates and nonnegative dimensions');
  const x=Math.max(0,clip.x),y=Math.max(0,clip.y);
  const right=Math.min(size.width,clip.x+clip.width),bottom=Math.min(size.height,clip.y+clip.height);
  return right<=x||bottom<=y?null:{x,y,width:right-x,height:bottom-y};
}

/** Pack ordered geometry into one upload; the main mesh follows its underlay. */
export function directPresentationGeometry(base:DirectPresentationBase,scale:number,windowSize?:PresentationSize) {
  const layers=[...(base.underlay??[]),{mesh:base.mesh} as PresentationLayer];
  const count=layers.reduce((n,layer)=>n+layer.mesh.vertexCount,0);
  const data=new Float32Array(count*6);
  let first=0;
  const draws=layers.map(({mesh,topology='triangle-list',blend,transform,scissor})=>{
    data.set(mesh.data.subarray(0,mesh.vertexCount*6),first*6);
    if(windowSize){
      if(transform&&(transform.length!==6||!transform.every(Number.isFinite)))throw new Error('Presentation transform requires six finite coefficients');
      const f=Math.fround,[a,b,c,d,tx,ty]=(transform??[1,0,0,1,0,0]).map(f);
      const sx=f(2/windowSize.width),sy=f(-2/windowSize.height);
      const ax=f(sx*a),cx=f(sx*c),by=f(sy*b),dy=f(sy*d);
      const ox=f(f(sx*f(tx-(base.origin?.x??0)))-1),oy=f(f(sy*f(ty-(base.origin?.y??0)))+1);
      for(let i=first*6;i<(first+mesh.vertexCount)*6;i+=6){
        const x=data[i],y=data[i+1];
        data[i]=f(f(f(ax*x)+f(cx*y))+ox);data[i+1]=f(f(f(by*x)+f(dy*y))+oy);
      }
    }else if(transform){
      if(transform.length!==6||!transform.every(Number.isFinite))throw new Error('Presentation transform requires six finite coefficients');
      const f=Math.fround,[a,b,c,d,tx,ty]=transform.map(f);
      for(let i=first*6;i<(first+mesh.vertexCount)*6;i+=6){
        const x=data[i],y=data[i+1];
        data[i]=f(f(f(a*x)+f(c*y))+tx);data[i+1]=f(f(f(b*x)+f(d*y))+ty);
      }
    }
    const draw={first,count:mesh.vertexCount,topology,blend,scissor};first+=mesh.vertexCount;return draw;
  });
  if(!windowSize)for(let i=0;i<data.length;i+=6){data[i]=(data[i]-(base.origin?.x??0))*scale;data[i+1]=(data[i+1]-(base.origin?.y??0))*scale;}
  return {data,draws};
}

export interface PresentationSampling {
  minFilter:'nearest'|'linear';
  magFilter:'nearest'|'linear';
  mipmapFilter:'none'|'nearest'|'linear';
  addressModeU:'clamp-to-edge'|'repeat'|'mirror-repeat';
  addressModeV:'clamp-to-edge'|'repeat'|'mirror-repeat';
}
export interface PresentationTextureLayer<Texture> {
  texture:Texture;
  rect:WellRect;
  uv?:WellRect;
  tint?:readonly [number,number,number,number];
  alpha:'straight'|'premultiplied';
  /** The supplied texture must use a display-domain UNORM format, not sRGB. */
  colorSpace:'native-unorm';
  sampling:PresentationSampling;
  blend?:PresentationBlend;
  transform?:PresentationTransform;
  scissor?:PresentationScissor;
}
export type PresentationCommand<Texture>=PresentationLayer|PresentationTextureLayer<Texture>;
/** Native window operations default to source-over; legacy direct scenes retain their factory blend default. */
export interface PresentationScene<Texture> {
  commands:readonly PresentationCommand<Texture>[];
  origin?:{x:number;y:number};
  /** The shared app supplies white; offscreen/reference callers choose explicitly. */
  background:readonly [number,number,number];
}
export function presentationSamplingKey(s:PresentationSampling):string {
  return [s.minFilter,s.magFilter,s.mipmapFilter,s.addressModeU,s.addressModeV].join(':');
}
