import {presentationSamplingKey,type PresentationSize,type PresentationTextureLayer,type PresentationOptions,type PresentationBlend} from './presentationTypes';

/** Texture resources supplied by callers are borrowed; this owns only draw resources. */
export function createPresentationTextures(device:GPUDevice,size:PresentationSize,options:PresentationOptions){
  let vertices:GPUBuffer|undefined,capacity=0;
  const samplers=new Map<string,GPUSampler>();
  const pipelines=new Map<string,{pipeline:GPURenderPipeline;groups:WeakMap<GPUTextureView,Map<GPUSampler,GPUBindGroup>>}>();
  return {
    upload(data:Float32Array){
      if(!data.byteLength)return;
      if(data.byteLength>capacity){
        const nextCapacity=Math.max(1024,2**Math.ceil(Math.log2(data.byteLength)));
        const next=device.createBuffer({label:'presentation-texture-vertices',size:nextCapacity,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
        vertices?.destroy();vertices=next;capacity=nextCapacity;
      }
      device.queue.writeBuffer(vertices!,0,data);
    },
    draw(pass:GPURenderPassEncoder,op:PresentationTextureLayer<GPUTextureView>,first:number,blend:PresentationBlend){
      const key=blend+':'+op.alpha;
      let entry=pipelines.get(key);
      if(!entry){
        const premult=op.alpha==='premultiplied';
        const module=device.createShaderModule({label:'presentation-texture',code:`
          struct Out {@builtin(position) p:vec4f,@location(0) tint:vec4f,@location(1) uv:vec2f};
          @vertex fn vs(@location(0) p:vec2f,@location(1) tint:vec4f,@location(2) uv:vec2f)->Out {
            var o:Out;o.p=${options.windowSize?'vec4f(p.x,p.y,0.,1.)':`vec4f(p.x/${size.width}.*2.-1.,1.-p.y/${size.height}.*2.,0.,1.)`};o.tint=tint;o.uv=uv;return o;
          }
          @group(0) @binding(0) var image:texture_2d<f32>;
          @group(0) @binding(1) var imageSampler:sampler;
          @fragment fn fs(o:Out)->@location(0) vec4f {
            let c=textureSample(image,imageSampler,o.uv)*o.tint;
            return ${premult?'vec4f(c.rgb*o.tint.a,c.a)':'c'};
          }`});
        const pipeline=device.createRenderPipeline({label:'presentation-texture',layout:'auto',vertex:{module,entryPoint:'vs',buffers:[{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:'float32x2'},{shaderLocation:1,offset:8,format:'float32x4'},{shaderLocation:2,offset:24,format:'float32x2'}]}]},fragment:{module,entryPoint:'fs',targets:[{format:'rgba8unorm',blend:{color:{srcFactor:premult?'one':'src-alpha',dstFactor:blend==='over'?'one-minus-src-alpha':'one'},alpha:{srcFactor:options.transparent?'one':'zero',dstFactor:options.transparent?'one-minus-src-alpha':'one'}}}]},multisample:{count:4}});
        entry={pipeline,groups:new WeakMap()};pipelines.set(key,entry);
      }
      const sampling=op.sampling,samplerKey=presentationSamplingKey(sampling);
      let sampler=samplers.get(samplerKey);
      if(!sampler){
        sampler=device.createSampler({minFilter:sampling.minFilter,magFilter:sampling.magFilter,mipmapFilter:sampling.mipmapFilter==='none'?'nearest':sampling.mipmapFilter,lodMinClamp:0,lodMaxClamp:sampling.mipmapFilter==='none'?0:32,addressModeU:sampling.addressModeU,addressModeV:sampling.addressModeV});samplers.set(samplerKey,sampler);
      }
      let groups=entry.groups.get(op.texture);if(!groups){groups=new Map();entry.groups.set(op.texture,groups);}
      let group=groups.get(sampler);
      if(!group){group=device.createBindGroup({layout:entry.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:op.texture},{binding:1,resource:sampler}]});groups.set(sampler,group);}
      pass.setPipeline(entry.pipeline);pass.setBindGroup(0,group);pass.setVertexBuffer(0,vertices!);pass.draw(6,1,first);
    },
    destroy(){vertices?.destroy();vertices=undefined;capacity=0;samplers.clear();pipelines.clear();},
  };
}
