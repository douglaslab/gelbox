import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const root='../reference/native/modern/well-scenes/';
const blackScenes=JSON.parse(fs.readFileSync(root+'cases.json','utf8')).map((scene:any)=>({...scene,png:fs.readFileSync(root+scene.id+'.png').toString('base64')}));
const coloredScenes=JSON.parse(fs.readFileSync(root+'compositing/cases.json','utf8')).map((scene:any)=>({...scene,png:fs.readFileSync(root+'compositing/'+scene.id+'.png').toString('base64'),basePng:fs.readFileSync(root+'compositing/base-'+scene.background+'.png').toString('base64')}));
const scenes=[...blackScenes,...coloredScenes];
test('presentation matches complete native well matrix',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 await page.goto('/#/gel');
 const results=await page.evaluate(async({scenes,backend})=>{
  const module=await import(/* @vite-ignore */ `/src/lib/gel/present${backend==='webgl2'?'-gl':''}.ts`);
  const device=backend==='webgpu'?await (await navigator.gpu.requestAdapter())!.requestDevice():null;
  const results=[];
  try{for(const scene of scenes){
   const width=390*scene.scale,height=50*scene.scale;
   const wells=scene.rects.map(([x1,y1,x2,y2]:number[])=>({x1,y1,x2,y2}));
   let pixels:Uint8Array;
   let baseWidth=1,baseHeight=1,basePixels=new Uint8Array([0,0,0,255]);
   if(scene.basePng){const img=new Image();img.src='data:image/png;base64,'+scene.basePng;await img.decode();baseWidth=img.width;baseHeight=img.height;const canvas=document.createElement('canvas');canvas.width=baseWidth;canvas.height=baseHeight;const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);basePixels=new Uint8Array(ctx.getImageData(0,0,baseWidth,baseHeight).data);}

   if(backend==='webgl2'){
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const gl=canvas.getContext('webgl2',{antialias:false,preserveDrawingBuffer:true})!;
    const flipped=new Uint8Array(basePixels.length);for(let y=0;y<baseHeight;y++)flipped.set(basePixels.subarray(y*baseWidth*4,(y+1)*baseWidth*4),(baseHeight-y-1)*baseWidth*4);
    const base=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,base);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,baseWidth,baseHeight,0,gl.RGBA,gl.UNSIGNED_BYTE,flipped);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    const presentation=module.createGlGelPresentation(gl,{width,height});
    try{presentation.draw(base,wells,scene.scale);const raw=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,raw);pixels=new Uint8Array(raw.length);for(let y=0;y<height;y++)pixels.set(raw.subarray((height-y-1)*width*4,(height-y)*width*4),y*width*4);}
    finally{presentation.destroy();gl.deleteTexture(base);gl.getExtension('WEBGL_lose_context')?.loseContext();}
   }else{
    const base=device!.createTexture({size:[baseWidth,baseHeight],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});device!.queue.writeTexture({texture:base},basePixels,{bytesPerRow:baseWidth*4},[baseWidth,baseHeight]);
    const output=device!.createTexture({size:[width,height],format:'rgba8unorm',usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC});
    const bytesPerRow=Math.ceil(width*4/256)*256;const readback=device!.createBuffer({size:bytesPerRow*height,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});
    const presentation=module.createGelPresentation(device!,'rgba8unorm',{width,height});
    try{const enc=device!.createCommandEncoder();presentation.draw(enc,base.createView(),output.createView(),wells,scene.scale);enc.copyTextureToBuffer({texture:output},{buffer:readback,bytesPerRow},{width,height});device!.queue.submit([enc.finish()]);await readback.mapAsync(GPUMapMode.READ);const raw=new Uint8Array(readback.getMappedRange());pixels=new Uint8Array(width*height*4);for(let y=0;y<height;y++)pixels.set(raw.subarray(y*bytesPerRow,y*bytesPerRow+width*4),y*width*4);}
    finally{presentation.destroy();readback.destroy();base.destroy();output.destroy();}
   }
   const image=new Image();image.src='data:image/png;base64,'+scene.png;await image.decode();const ref=document.createElement('canvas');ref.width=width;ref.height=height;const ctx=ref.getContext('2d')!;ctx.drawImage(image,0,0);const expected=ctx.getImageData(0,0,width,height).data;
   let differentPixels=0,maximumChannelError=0;const differences:Array<{x:number,y:number,expected:number[],actual:number[]}>=[];
   for(let i=0;i<expected.length;i+=4){let different=false;for(let c=0;c<3;c++){const error=Math.abs(expected[i+c]-pixels[i+c]);maximumChannelError=Math.max(maximumChannelError,error);different ||= error!==0;}if(different){differentPixels++;if(differences.length<12)differences.push({x:(i/4)%width,y:Math.floor(i/4/width),expected:Array.from(expected.slice(i,i+3)),actual:Array.from(pixels.slice(i,i+3))});}}
   results.push({id:scene.id,differentPixels,maximumChannelError,differences});
  }}finally{device?.destroy();}
  return results;
 },{scenes,backend});
 fs.writeFileSync(info.outputPath('comparison.json'),JSON.stringify(results,null,2)+'\n');
 expect(results.map(({differences,...result})=>result)).toEqual(scenes.map((scene:any)=>({id:scene.id,differentPixels:0,maximumChannelError:0})));
});
