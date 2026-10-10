import type {SceneGraphics,SceneTexture} from './scenePresentation';
import {withAllocationRollback,allocateTexture} from '../gpu/allocations';
import {withGlAllocationRollback} from '../gpu/gl/allocations';
export interface SceneImageTexture {texture:SceneTexture;destroy:()=>void}
/** Native ImageView uses straight UNORM pixels with a complete linear mip chain. */
export function createSceneImageTexture(graphics:SceneGraphics,bitmap:ImageBitmap,label='scene-image'):SceneImageTexture {
 const width=bitmap.width,height=bitmap.height;
 if(!width||!height)throw Error('Reference image bitmap has no pixels');
 if(graphics.backend==='webgl2')return withGlAllocationRollback(graphics.gl,()=>{
  const gl=graphics.gl,texture=gl.createTexture();if(!texture)throw Error('Could not allocate reference image texture');
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.generateMipmap(gl.TEXTURE_2D);
  return {texture:{backend:'webgl2',value:texture},destroy:()=>gl.deleteTexture(texture)};
 });
 const device=graphics.device;
 return withAllocationRollback(device,()=>{
  const levels=Math.floor(Math.log2(Math.max(width,height)))+1;
  const texture=allocateTexture(device,{label,size:{width,height},format:'rgba8unorm',mipLevelCount:levels,
   usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});
  device.queue.copyExternalImageToTexture({source:bitmap},{texture,premultipliedAlpha:false,colorSpace:'srgb'},{width,height});
  if(levels>1){
   const module=device.createShaderModule({label:'scene-image-mips',code:`
    struct Vertex{@builtin(position) p:vec4f,@location(0) uv:vec2f};
    @vertex fn vs(@builtin(vertex_index) i:u32)->Vertex{
     let uv=vec2f(f32((i<<1u)&2u),f32(i&2u));var v:Vertex;
     v.p=vec4f(uv*vec2f(2.,-2.)+vec2f(-1.,1.),0.,1.);v.uv=uv;return v;
    }
    @group(0) @binding(0) var source:texture_2d<f32>;
    @group(0) @binding(1) var imageSampler:sampler;
    @fragment fn fs(v:Vertex)->@location(0) vec4f{return textureSample(source,imageSampler,v.uv);}
   `});
   const pipeline=device.createRenderPipeline({label:'scene-image-mips',layout:'auto',vertex:{module,entryPoint:'vs'},fragment:{module,entryPoint:'fs',targets:[{format:'rgba8unorm'}]}});
   const sampler=device.createSampler({minFilter:'linear',magFilter:'linear'}),encoder=device.createCommandEncoder();
   for(let level=1;level<levels;level++){
    const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[
     {binding:0,resource:texture.createView({baseMipLevel:level-1,mipLevelCount:1})},{binding:1,resource:sampler}]});
    const pass=encoder.beginRenderPass({colorAttachments:[{view:texture.createView({baseMipLevel:level,mipLevelCount:1}),loadOp:'clear',storeOp:'store',clearValue:[0,0,0,0]}]});
    pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.draw(3);pass.end();
   }
   device.queue.submit([encoder.finish()]);
  }
  return {texture:{backend:'webgpu',value:texture.createView()},destroy:()=>texture.destroy()};
 });
}
