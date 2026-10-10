import {test,expect} from '@playwright/test';
import fs from 'node:fs';

test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});

// Read the real application's final gel texture before canvas/display scaling.
// The PNG is an independent modern native build export, not a web golden.
const nativePng=fs.readFileSync('../reference/native/modern/lossless-probe/offscreen/native-startup.png').toString('base64');
test('startup gel texture matches native RGBA8 export',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),backend);
 await page.route('**/src/components/gel/GelCanvas.tsx*',async route=>{
  const response=await route.fetch();let body=await response.text();
  const glMarker='gl.bindFramebuffer(gl.FRAMEBUFFER, null);';
  const gpuMarker='const bg = device.createBindGroup({';
  expect(body.split(glMarker)).toHaveLength(2);
  expect(body.split(gpuMarker)).toHaveLength(2);
  body=body.replace(glMarker,`
   if(!window.__nativeReadback){
    const {width,height,framebuffer}=renderer.output;
    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
    const raw=new Uint8Array(width*height*4);
    gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,raw);
    const rgba=new Uint8Array(raw.length);
    for(let y=0;y<height;y++)rgba.set(raw.subarray((height-y-1)*width*4,(height-y)*width*4),y*width*4);
    window.__nativeReadback={width,height,rgba:Array.from(rgba),backend:'webgl2'};
   }
   ${glMarker}`);
  body=body.replace(gpuMarker,`
   if(!window.__nativeReadbackPending){
    window.__nativeReadbackPending=true;
    const {width,height,texture}=renderer.output;
    const bytesPerRow=Math.ceil(width*4/256)*256;
    const readback=device.createBuffer({size:bytesPerRow*height,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
    const copy=device.createCommandEncoder();
    copy.copyTextureToBuffer({texture},{buffer:readback,bytesPerRow},{width,height});
    queue.submit([copy.finish()]);
    (async()=>{try{
     await readback.mapAsync(GPUMapMode.READ);
     const raw=new Uint8Array(readback.getMappedRange());
     const rgba=new Uint8Array(width*height*4);
     for(let y=0;y<height;y++)rgba.set(raw.subarray(y*bytesPerRow,y*bytesPerRow+width*4),y*width*4);
     window.__nativeReadback={width,height,rgba:Array.from(rgba),backend:'webgpu'};
    }finally{readback.destroy();}})();
   }
   ${gpuMarker}`);
  await route.fulfill({response,body});
 });
 await page.goto('/#/gel');
 await expect.poll(()=>page.evaluate(()=>!!(window as any).__nativeReadback)).toBe(true);
 const result=await page.evaluate(async png=>{
  const actual=(window as any).__nativeReadback;
  const image=new Image();image.src=`data:image/png;base64,${png}`;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);
  const expected=ctx.getImageData(0,0,image.width,image.height).data;
  let differentPixels=0,maximumError=0;
  for(let i=0;i<expected.length;i+=4){let different=false;for(let c=0;c<3;c++){
   const error=Math.abs(expected[i+c]-actual.rgba[i+c]);maximumError=Math.max(maximumError,error);different ||= error!==0;
  }if(different)differentPixels++;}
  return {backend:actual.backend,width:actual.width,height:actual.height,differentPixels,maximumError};
 },nativePng);
 expect(result).toEqual({backend,width:390,height:520,differentPixels:0,maximumError:0});
});

const nativeWindow=fs.readFileSync('../reference/native/modern/lossless-probe/startup.png').toString('base64');
test('displayed startup bands match native linear enlargement at DPR 2',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),backend);
 await page.goto('/#/gel');
 await expect(page.getByTestId('band-0')).toBeVisible();
 await expect(async()=>{
  const screenshot=(await page.screenshot()).toString('base64');
  const differences=await page.evaluate(async({nativeWindow,screenshot})=>{
   const decode=async(png:string)=>{
    const image=new Image();image.src=`data:image/png;base64,${png}`;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=90;canvas.height=920;
    const ctx=canvas.getContext('2d')!;
    ctx.drawImage(image,430,310,90,920,0,0,90,920);
    return ctx.getImageData(0,0,90,920).data;
   };
   const [native,web]=await Promise.all([decode(nativeWindow),decode(screenshot)]);
   let count=0;for(let i=0;i<native.length;i++)if(native[i]!==web[i])count++;
   return count;
  },{nativeWindow,screenshot});
  expect(differences).toBe(0);
 }).toPass({timeout:5000});
});
