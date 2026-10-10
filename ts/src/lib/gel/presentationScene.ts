import {directPresentationGeometry,type DirectPresentationBase,type PresentationScene,type PresentationTextureLayer,type PresentationLayer} from './presentationTypes';

/** Pack mesh and textured vertices independently, preserving the original command order. */
export function presentationSceneGeometry<Texture>(base:DirectPresentationBase|PresentationScene<Texture>,scale:number){
  const commands='commands' in base?base.commands:[...(base.underlay??[]),{mesh:base.mesh}];
  const meshes=commands.filter((op):op is PresentationLayer=>'mesh' in op)
    .map(op=>'commands' in base?{...op,blend:op.blend??'over' as const}:op);
  const empty={data:new Float32Array(),vertexCount:0};
  const geometry=directPresentationGeometry({mesh:empty,underlay:meshes,origin:base.origin},scale);
  const textureData=new Float32Array((commands.length-meshes.length)*6*8);
  let meshIndex=0,textureFirst=0;
  const draws=commands.map(op=>{
    if('mesh' in op)return {...geometry.draws[meshIndex++],texture:undefined as PresentationTextureLayer<Texture>|undefined};
    if(op.colorSpace!=='native-unorm')throw new Error('Presentation textures require native display-domain UNORM values');
    const {x1,y1,x2,y2}=op.rect,uv=op.uv??{x1:0,y1:0,x2:1,y2:1};
    const tint=op.tint??[1,1,1,1];
    const points=[[x1,y1,uv.x1,uv.y1],[x2,y1,uv.x2,uv.y1],[x2,y2,uv.x2,uv.y2],
      [x1,y1,uv.x1,uv.y1],[x2,y2,uv.x2,uv.y2],[x1,y2,uv.x1,uv.y2]];
    const mesh={data:new Float32Array(points.flatMap(([x,y])=>[x,y,...tint])),vertexCount:6};
    const packed=directPresentationGeometry({mesh:empty,underlay:[{mesh,transform:op.transform}],origin:base.origin},scale).data;
    points.forEach((point,i)=>{
      textureData.set(packed.subarray(i*6,i*6+6),(textureFirst+i)*8);
      textureData.set(point.slice(2),(textureFirst+i)*8+6);
    });
    const draw={first:textureFirst,count:6,topology:'triangle-list' as const,blend:op.blend??'over',scissor:op.scissor,texture:op};
    textureFirst+=6;return draw;
  });
  return {data:geometry.data,textureData,draws};
}
