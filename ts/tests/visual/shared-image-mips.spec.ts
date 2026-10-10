import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const root='../reference/native/modern/shared-image-scenes/';
const native=JSON.parse(fs.readFileSync(root+'textures.json','utf8'));
test('reference image decode and generated mip bytes match native Cinder textures',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 await page.addInitScript(backend=>{
  localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');
  const create=GPUDevice.prototype.createTexture;
  GPUDevice.prototype.createTexture=function(desc){const image=desc.label==='scene-image';const texture=create.call(this,image?{...desc,usage:desc.usage|GPUTextureUsage.COPY_SRC}:desc);if(image)(window as any).__imageProbe={device:this,texture};return texture;};
  const gl=WebGL2RenderingContext.prototype,allocate=gl.createTexture;
  gl.createTexture=function(){const texture=allocate.call(this);if(/sceneImageTexture/.test(new Error().stack??''))(window as any).__imageProbe={gl:this,texture};return texture;};
 },backend);
 await page.goto('/#/gel');const results=[];
 for(const [index,name] of ['alpha','odd'].entries()){
  await page.evaluate(bytes=>{const data=new DataTransfer();data.items.add(new File([new Uint8Array(bytes)],'fixture.png',{type:'image/png'}));document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:data,clientX:100,clientY:100}));},[...fs.readFileSync(root+name+'.png')]);
  await expect(page.getByTestId(`reference-image-canvas-${index+1}`)).toHaveAttribute('data-shared-ready','1');
  const comparisons=await page.evaluate(async levels=>{
   const {gl,device,texture}=(window as any).__imageProbe,results=[];
   for(const [mipLevel,native] of levels.entries()){
    const {width,height,rgba}=native,actual=new Uint8Array(width*height*4);
    if(gl){const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,mipLevel);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,actual);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.deleteFramebuffer(fbo);}
    else{const bytesPerRow=Math.ceil(width*4/256)*256,buffer=device.createBuffer({size:bytesPerRow*height,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),encoder=device.createCommandEncoder();encoder.copyTextureToBuffer({texture,mipLevel},{buffer,bytesPerRow},{width,height});device.queue.submit([encoder.finish()]);await buffer.mapAsync(GPUMapMode.READ);const raw=new Uint8Array(buffer.getMappedRange());for(let y=0;y<height;y++)actual.set(raw.subarray(y*bytesPerRow,y*bytesPerRow+width*4),y*width*4);buffer.destroy();}
    let different=0,max=0;const first=[];
    // Native Texture2d upload reverses source rows. Our image upload uses top-down UVs.
    for(let y=0;y<height;y++)for(let x=0;x<width*4;x++){const a=actual[y*width*4+x],b=rgba[(height-y-1)*width*4+x],d=Math.abs(a-b);if(d){different++;max=Math.max(max,d);if(first.length<6)first.push({x:Math.floor(x/4),y,channel:x%4,native:b,web:a});}}
    results.push({mipLevel,width,height,different,max,first});
   }
   return results;
  },native[index].levels);
  results.push({name,comparisons});await page.keyboard.press('Delete');
 }
 await fs.promises.writeFile(info.outputPath('mips.json'),JSON.stringify(results,null,2));
 expect(results.flatMap(r=>r.comparisons).filter(r=>r.different)).toEqual([]);
});
