import {validatePresentationSize,wellVertices,physicalBandVertices,type DirectPresentationBase,type PresentationSize,type PresentationOptions,type WellRect} from './presentationTypes';

/** Native window presentation: image or direct triangles, then four-sample well lines. */
export function createGelPresentation(device:GPUDevice,format:GPUTextureFormat,size:PresentationSize,options:PresentationOptions={}) {
  validatePresentationSize(size);
  const {width,height}=size;
  const owned:Array<{destroy():void}>=[];
  let vertices:GPUBuffer|undefined,capacity=0,destroyed=false;
  let bandVertices:GPUBuffer|undefined,bandCapacity=0,bandPipeline:GPURenderPipeline|undefined;
  const destroy=()=>{if(destroyed)return;destroyed=true;vertices?.destroy();bandVertices?.destroy();for(const resource of owned.reverse())resource.destroy();};
  try {
    const samples=device.createTexture({label:'gel-presentation-msaa',size:[width,height],format:'rgba8unorm',sampleCount:4,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});owned.push(samples);
    const sampleView=samples.createView();
    const fullVertex=`@vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f {
      let p=array<vec2f,3>(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));return vec4f(p[i],0.,1.);
    }`;
    const baseModule=device.createShaderModule({label:'gel-presentation-base',code:fullVertex+`
      @group(0) @binding(0) var base:texture_2d<f32>;
      @group(0) @binding(1) var linearSampler:sampler;
      @fragment fn fs(@builtin(position) p:vec4f)->@location(0) vec4f {
        return vec4f(textureSample(base,linearSampler,p.xy/vec2f(${width}.,${height}.)).rgb,1.);
      }`});
    const basePipeline=device.createRenderPipeline({label:'gel-presentation-base',layout:'auto',vertex:{module:baseModule,entryPoint:'vs'},fragment:{module:baseModule,entryPoint:'fs',targets:[{format:'rgba8unorm'}]},multisample:{count:4}});
    const sampler=device.createSampler({magFilter:'linear',minFilter:'linear',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'});
    const linesModule=device.createShaderModule({label:'gel-presentation-lines',code:`
      @vertex fn vs(@location(0) p:vec2f)->@builtin(position) vec4f {
        return vec4f(p.x/${width}.*2.-1.,1.-p.y/${height}.*2.,0.,1.);
      }
      @fragment fn fs()->@location(0) vec4f {return vec4f(.8);}`});
    const linePipeline=device.createRenderPipeline({label:'gel-presentation-lines',layout:'auto',vertex:{module:linesModule,entryPoint:'vs',buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:'float32x2'}]}]},fragment:{module:linesModule,entryPoint:'fs',targets:[{format:'rgba8unorm',blend:{color:{srcFactor:'src-alpha',dstFactor:'one-minus-src-alpha'},alpha:{srcFactor:'zero',dstFactor:'one'}}}]},primitive:{topology:'line-strip'},multisample:{count:4}});
    // Sum normalized samples in float32, in sample order, like the measured
    // native resolve. Integer tie rules match black scenes but fail colored
    // corners; automatic WebGPU resolve also differs. See well-scenes/compositing.
    const resolveModule=device.createShaderModule({label:'gel-presentation-resolve',code:fullVertex+`
      @group(0) @binding(0) var src:texture_multisampled_2d<f32>;
      @fragment fn fs(@builtin(position) pos:vec4f)->@location(0) vec4f {
        let p=vec2i(pos.xy);var sum=vec3f(0.);
        for(var i=0;i<4;i++){sum+=textureLoad(src,p,i).rgb;}
        return vec4f(sum*.25,1.);
      }`});
    const resolvePipeline=device.createRenderPipeline({label:'gel-presentation-resolve',layout:'auto',vertex:{module:resolveModule,entryPoint:'vs'},fragment:{module:resolveModule,entryPoint:'fs',targets:[{format}]}});
    const resolveGroup=device.createBindGroup({layout:resolvePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:sampleView}]});
    let previousBase:GPUTextureView|undefined,baseGroup:GPUBindGroup;
    return {
      draw(encoder:GPUCommandEncoder,base:GPUTextureView|DirectPresentationBase,target:GPUTextureView,wells:readonly WellRect[],scale:number) {
        if(destroyed)throw new Error('Gel presentation has been destroyed');
        const data=wellVertices(wells,scale);
        if(data.byteLength>capacity){
          const nextCapacity=Math.max(1024,2**Math.ceil(Math.log2(data.byteLength)));
          const next=device.createBuffer({label:'gel-presentation-wells',size:nextCapacity,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
          vertices?.destroy();vertices=next;capacity=nextCapacity;
        }
        if(data.byteLength)device.queue.writeBuffer(vertices!,0,data);
        const direct='mesh' in base;
        if(!direct&&base!==previousBase){baseGroup=device.createBindGroup({layout:basePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:base},{binding:1,resource:sampler}]});previousBase=base;}
        if(direct){
          if(!bandPipeline){
            const module=device.createShaderModule({label:'gel-presentation-bands',code:`
              struct Out {@builtin(position) p:vec4f,@location(0) color:vec4f};
              @vertex fn vs(@location(0) p:vec2f,@location(1) color:vec4f)->Out {
                var o:Out;o.p=vec4f(p.x/${width}.*2.-1.,1.-p.y/${height}.*2.,0.,1.);o.color=color;return o;
              }
              @fragment fn fs(o:Out)->@location(0) vec4f {return o.color;}`});
            bandPipeline=device.createRenderPipeline({label:'gel-presentation-bands',layout:'auto',vertex:{module,entryPoint:'vs',buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:'float32x2'},{shaderLocation:1,offset:8,format:'float32x4'}]}]},fragment:{module,entryPoint:'fs',targets:[{format:'rgba8unorm',blend:{color:{srcFactor:'src-alpha',dstFactor:options.meshBlend==='over'?'one-minus-src-alpha':'one'},alpha:{srcFactor:'zero',dstFactor:'one'}}}]},multisample:{count:4}});
          }
          const data=physicalBandVertices(base,scale);
          if(data.byteLength>bandCapacity){
            const nextCapacity=Math.max(1024,2**Math.ceil(Math.log2(data.byteLength)));
            const next=device.createBuffer({label:'gel-presentation-band-vertices',size:nextCapacity,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
            bandVertices?.destroy();bandVertices=next;bandCapacity=nextCapacity;
          }
          if(data.byteLength)device.queue.writeBuffer(bandVertices!,0,data);
        }
        const background=direct?(base.background??[0,0,0]):[0,0,0];
        const pass=encoder.beginRenderPass({label:'gel-presentation',colorAttachments:[{view:sampleView,loadOp:'clear',storeOp:'store',clearValue:{r:background[0],g:background[1],b:background[2],a:1}}]});
        if(direct){if(base.mesh.vertexCount){pass.setPipeline(bandPipeline!);pass.setVertexBuffer(0,bandVertices!);pass.draw(base.mesh.vertexCount);}}
        else{pass.setPipeline(basePipeline);pass.setBindGroup(0,baseGroup!);pass.draw(3);}
        if(wells.length){pass.setPipeline(linePipeline);pass.setVertexBuffer(0,vertices!);for(let i=0;i<wells.length;i++)pass.draw(5,1,i*5);}
        pass.end();
        const resolve=encoder.beginRenderPass({label:'gel-presentation-resolve',colorAttachments:[{view:target,loadOp:'clear',storeOp:'store',clearValue:{r:0,g:0,b:0,a:1}}]});
        resolve.setPipeline(resolvePipeline);resolve.setBindGroup(0,resolveGroup);resolve.draw(3);resolve.end();
      },destroy,
    };
  }catch(error){destroy();throw error;}
}
