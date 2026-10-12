import {test,expect} from '@playwright/test';

test('ordered textures retire owned resources after draw failures and preserve borrowed images',async({page},info)=>{
 await page.goto('/#/dev');
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 const result=await page.evaluate(async backend=>{
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;document.body.append(canvas);
  const live=new Set<any>();let failSampler=false,borrowedDestroyed=false;
  let make:()=>any,draw:(p:any)=>Promise<void>,borrowed:any,usable:()=>boolean;
  const scene=(texture:any)=>({commands:[{texture,rect:{x1:0,y1:0,x2:64,y2:64},alpha:'straight',colorSpace:'native-unorm',sampling:{minFilter:'linear',magFilter:'linear',mipmapFilter:'none',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'}}],background:[1,1,1]});
  if(backend==='webgl2'){
   const {configureGl2Context}=await import('/src/lib/gpu/gl/context.ts');
   const {createGlGelPresentation}=await import('/src/lib/gel/present-gl.ts');
   const {gl}=configureGl2Context(canvas);borrowed=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,borrowed);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([200,80,40,128]));
   for(const kind of ['Buffer','Texture','Renderbuffer','Framebuffer','VertexArray','Shader','Program','Sampler']){
    const create=(gl as any)['create'+kind].bind(gl),remove=(gl as any)['delete'+kind].bind(gl);
    (gl as any)['create'+kind]=(...args:any[])=>{if(kind==='Sampler'&&failSampler)return null;const r=create(...args);if(r)live.add(r);return r;};
    (gl as any)['delete'+kind]=(r:any)=>{if(r===borrowed)borrowedDestroyed=true;live.delete(r);return remove(r);};
   }
   make=()=>createGlGelPresentation(gl,{width:64,height:64});
   draw=async p=>{p.draw(scene(borrowed),[],1);const error=gl.getError();if(error!==gl.NO_ERROR)throw Error('GL validation '+error);};
   usable=()=>gl.isTexture(borrowed);
  }else{
   const {requestDevice}=await import('/src/lib/gpu/device.ts');
   const {configureContext}=await import('/src/lib/gpu/context.ts');
   const {createGelPresentation}=await import('/src/lib/gel/present.ts');
   const {device}=await requestDevice();const {context,format}=configureContext(canvas,device);
   borrowed=device.createTexture({size:[1,1],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
   device.queue.writeTexture({texture:borrowed},new Uint8Array([200,80,40,128]),{bytesPerRow:4},[1,1]);
   const destroyBorrowed=borrowed.destroy.bind(borrowed);borrowed.destroy=()=>{borrowedDestroyed=true;destroyBorrowed();};
   for(const kind of ['Buffer','Texture']){
    const create=(device as any)['create'+kind].bind(device);
    (device as any)['create'+kind]=(desc:any)=>{
     const r=create(desc);if(desc.label?.startsWith('gel-presentation')||desc.label?.startsWith('presentation-texture')){
      live.add(r);const destroy=r.destroy.bind(r);r.destroy=()=>{live.delete(r);destroy();};
     }return r;
    };
   }
   const createSampler=device.createSampler.bind(device);device.createSampler=(desc:any)=>{if(failSampler)throw Error('Injected sampler allocation failure');return createSampler(desc);};
   const texture=borrowed.createView();
   make=()=>createGelPresentation(device,format,{width:64,height:64});
   draw=async p=>{
    device.pushErrorScope('validation');
    try{const encoder=device.createCommandEncoder();p.draw(encoder,scene(texture),context.getCurrentTexture().createView(),[],1);device.queue.submit([encoder.finish()]);await device.queue.onSubmittedWorkDone();}
    finally{const error=await device.popErrorScope();if(error)throw Error(error.message);}
   };
   usable=()=>!borrowedDestroyed;
  }
  const results=[];
  for(const fail of [false,true,false]){
   failSampler=false;const p=make();failSampler=fail;let error='';
   try{await draw(p);}catch(e){error=String(e);}
   p.destroy();p.destroy();results.push({fail,error,owned:live.size,borrowedUsable:usable(),borrowedDestroyed});
  }
  return results;
 },backend);
 expect(result.map(r=>r.owned)).toEqual([0,0,0]);
 expect(result.map(r=>r.borrowedUsable)).toEqual([true,true,true]);
 expect(result.map(r=>r.borrowedDestroyed)).toEqual([false,false,false]);
 expect(result[0].error).toBe('');expect(result[1].error).toMatch(/sampler/i);expect(result[2].error).toBe('');
});
