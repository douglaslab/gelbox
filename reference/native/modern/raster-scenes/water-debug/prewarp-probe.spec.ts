import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const root='../reference/native/modern/raster-scenes';
const cases=JSON.parse(fs.readFileSync(`${root}/cases.json`,'utf8')).filter((c:any)=>c.id.startsWith('water')||c.id.startsWith('combined')).map((c:any)=>({...c,png:fs.readFileSync(`${root}/${c.id}.png`).toString('base64')}));
test('gel effects match independent native scene exports',async({page},info)=>{
 await page.goto('/#/gel');
 const controls=await page.evaluate(async cases=>{
  const {buildOvercookWarp}=await import('/src/lib/gel/overcook.ts');
  return cases.map(c=>({id:c.id,...buildOvercookWarp(c.globalWarp,c,c.ppu),data:Array.from(buildOvercookWarp(c.globalWarp,c,c.ppu)!.data)}));
 },cases);
 fs.writeFileSync('/tmp/gel-water-controls.json',JSON.stringify(controls));
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 const results=await page.evaluate(async({cases,backend})=>{
  const {createGelRenderer}=await import('/src/lib/gel/render.ts');
  const {createGlGelRenderer}=await import('/src/lib/gel/render-gl.ts');
  const gl=backend==='webgl2'?document.createElement('canvas').getContext('webgl2'):null;
  const device=backend==='webgpu'?await(await navigator.gpu.requestAdapter())!.requestDevice():null;
  if(!gl&&!device)throw Error('Requested GPU unavailable');
  const results=[];
  for(const c of cases){
   const renderer=gl?createGlGelRenderer(gl,c,c.ppu):createGelRenderer(device!,c,c.ppu);
   renderer.setBands(c.bands.map(b=>({...b,brightness:b.brightness*.25,smearBrightnessAbove:b.smearBrightnessAbove.map(x=>x*.25),smearBrightnessBelow:b.smearBrightnessBelow.map(x=>x*.25)})));renderer.setGlobalWarp({h2oDistort:false,randSeed:42});renderer.render();
   const {width,height}=renderer.output;
   const rgba=new Uint8Array(width*height*4);
   if(gl){
    gl.bindFramebuffer(gl.FRAMEBUFFER,(renderer.output as any).framebuffer);
    const raw=new Uint8Array(rgba.length);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,raw);
    for(let y=0;y<height;y++)rgba.set(raw.subarray((height-y-1)*width*4,(height-y)*width*4),y*width*4);
   }else{
    const bytesPerRow=Math.ceil(width*4/256)*256;
    const buffer=device!.createBuffer({size:bytesPerRow*height,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
    const encoder=device!.createCommandEncoder();encoder.copyTextureToBuffer({texture:renderer.output.texture as GPUTexture},{buffer,bytesPerRow},{width,height});
    device!.queue.submit([encoder.finish()]);await buffer.mapAsync(GPUMapMode.READ);
    const raw=new Uint8Array(buffer.getMappedRange());
    for(let y=0;y<height;y++)rgba.set(raw.subarray(y*bytesPerRow,y*bytesPerRow+width*4),y*width*4);
    buffer.destroy();
   }
   const image=new Image();image.src=`data:image/png;base64,${c.png}`;await image.decode();
   if(image.width!==width||image.height!==height)throw Error('Reference dimensions differ');
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);
   const native=ctx.getImageData(0,0,width,height).data;
   let differentPixels=0,maximumError=0,absoluteRgbDifferenceSum=0;
   for(let i=0;i<rgba.length;i+=4){let different=false;for(let channel=0;channel<3;channel++){
    const error=Math.abs(native[i+channel]-rgba[i+channel]);different ||=error!==0;maximumError=Math.max(maximumError,error);absoluteRgbDifferenceSum+=error;
   }if(different)differentPixels++;}
   ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba),width,height),0,0);
   results.push({id:c.id,differentPixels,maximumError,absoluteRgbDifferenceSum,png:canvas.toDataURL().split(",")[1]});
   renderer.destroy();
  }
  device?.destroy();gl?.getExtension('WEBGL_lose_context')?.loseContext();return results;
 },{cases,backend});
 for(const r of results){fs.writeFileSync(`/tmp/gel-native-lossless-probe/raster-scenes/web-${backend}-${r.id}.png`,Buffer.from(r.png,"base64"));delete (r as any).png;}
 fs.writeFileSync(`/tmp/gel-native-raster-${backend}.json`,JSON.stringify(results,null,2));

});
