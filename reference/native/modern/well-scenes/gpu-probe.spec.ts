import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const root='../reference/native/modern/well-scenes/';
const cases=JSON.parse(fs.readFileSync(root+'cases.json','utf8'));
test('measure WebGPU line-strip raster against native window',async({page},info)=>{
 await page.goto('/#/gel');
 const results=[];
 for(const scene of cases)for(const flip of [false]){
  const native=fs.readFileSync(root+scene.id+'.png').toString('base64');
  results.push(await page.evaluate(async({scene,native,flip})=>{
   const width=390*scene.scale,height=50*scene.scale;
   const adapter=await navigator.gpu.requestAdapter();const device=await adapter!.requestDevice();
   const module=device.createShaderModule({code:`
    @vertex fn vs(@location(0) p:vec2f)->@builtin(position) vec4f {
     return vec4f(p.x/${width}.0*2.-1.,${flip?'p.y/'+height+'.0*2.-1.':'1.-p.y/'+height+'.0*2.'},0.,1.);
    }
    @fragment fn fs()->@location(0) vec4f {return vec4f(.8);}`});
   const blend={srcFactor:'src-alpha',dstFactor:'one-minus-src-alpha'} as const;
   const pipeline=device.createRenderPipeline({layout:'auto',vertex:{module,entryPoint:'vs',buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:'float32x2'}]}]},fragment:{module,entryPoint:'fs',targets:[{format:'rgba8unorm',blend:{color:blend,alpha:blend}}]},primitive:{topology:'line-strip'},multisample:{count:4}});
   const msaa=device.createTexture({size:[width,height],format:'rgba8unorm',sampleCount:4,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});
   const output=device.createTexture({size:[width,height],format:'rgba8unorm',usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC});
   const data=new Float32Array(scene.rects.flatMap(([x1,y1,x2,y2]:number[])=>[x1,y1,x2,y1,x2,y2,x1,y2,x1,y1].map(x=>x*scene.scale)));
   const vertices=device.createBuffer({size:data.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});device.queue.writeBuffer(vertices,0,data);
   const encoder=device.createCommandEncoder();const pass=encoder.beginRenderPass({colorAttachments:[{view:msaa.createView(),loadOp:'clear',storeOp:'store',clearValue:{r:0,g:0,b:0,a:1}}]});pass.setPipeline(pipeline);pass.setVertexBuffer(0,vertices);for(let i=0;i<scene.rects.length;i++)pass.draw(5,1,i*5);pass.end();
   const resolveModule=device.createShaderModule({code:`
    @group(0) @binding(0) var src:texture_multisampled_2d<f32>;
    @vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f {
     let p=array<vec2f,3>(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));return vec4f(p[i],0.,1.);
    }
    @fragment fn fs(@builtin(position) pos:vec4f)->@location(0) vec4f {
     let p=vec2i(pos.xy);var sum=vec4f(0.);
     for(var i=0;i<4;i++){sum+=round(textureLoad(src,p,i)*255.);}
     let total=vec4u(sum);let base=total/4u;let remainder=total%4u;
     let increment=(remainder>vec4u(2u)) | ((remainder==vec4u(2u)) & ((base%2u)==vec4u(1u)));
     return vec4f(base+select(vec4u(0u),vec4u(1u),increment))/255.;
    }`});
   const resolvePipeline=device.createRenderPipeline({layout:'auto',vertex:{module:resolveModule,entryPoint:'vs'},fragment:{module:resolveModule,entryPoint:'fs',targets:[{format:'rgba8unorm'}]}});
   const bg=device.createBindGroup({layout:resolvePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:msaa.createView()}]});
   const resolve=encoder.beginRenderPass({colorAttachments:[{view:output.createView(),loadOp:'clear',storeOp:'store',clearValue:{r:0,g:0,b:0,a:1}}]});resolve.setPipeline(resolvePipeline);resolve.setBindGroup(0,bg);resolve.draw(3);resolve.end();
   const bytesPerRow=Math.ceil(width*4/256)*256;const readback=device.createBuffer({size:bytesPerRow*height,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});encoder.copyTextureToBuffer({texture:output},{buffer:readback,bytesPerRow},{width,height});device.queue.submit([encoder.finish()]);await readback.mapAsync(GPUMapMode.READ);const raw=new Uint8Array(readback.getMappedRange());
   const image=new Image();image.src='data:image/png;base64,'+native;await image.decode();const ref=document.createElement('canvas');ref.width=width;ref.height=height;const ctx=ref.getContext('2d')!;ctx.drawImage(image,0,0);const expected=ctx.getImageData(0,0,width,height).data;
   let differentPixels=0,maximumChannelError=0;const pairs:Record<string,number>={};
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){let different=false;for(let c=0;c<3;c++){const error=Math.abs(expected[(y*width+x)*4+c]-raw[(flip?height-y-1:y)*bytesPerRow+x*4+c]);maximumChannelError=Math.max(maximumChannelError,error);different ||= error!==0;}if(different){differentPixels++;const key=expected[(y*width+x)*4]+":"+raw[(flip?height-y-1:y)*bytesPerRow+x*4];pairs[key]=(pairs[key]??0)+1;}}
   readback.destroy();vertices.destroy();msaa.destroy();output.destroy();device.destroy();return {id:scene.id,flip,differentPixels,maximumChannelError,pairs};
  },{scene,native,flip}));
 }
 fs.writeFileSync(info.outputPath('line-strip.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));expect(results).toHaveLength(16);expect(results.every(r=>r.differentPixels===0)).toBe(true);
});
