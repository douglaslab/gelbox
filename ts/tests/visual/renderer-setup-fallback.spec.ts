import {test,expect} from '@playwright/test';
for(const failure of ['gpu-configure','gl-shader'])test(`fresh canvases recover from ${failure}`,async({page})=>{
 await page.addInitScript(failure=>{
  localStorage.setItem('gelBackend',failure==='gpu-configure'?'webgpu':'webgl2');
  (window as any).retired=[];
  const getContext=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type:any,options:any){
   const context=getContext.call(this,type,options);
   if(context){this.setAttribute('data-probe-context',type);
    if(type===(failure==='gpu-configure'?'webgpu':'webgl2'))(window as any).retired.push({canvas:this,context});}
   return context;
  } as typeof getContext;
  if(failure==='gpu-configure'){
   const configure=GPUCanvasContext.prototype.configure;
   GPUCanvasContext.prototype.configure=function(options){configure.call(this,options);throw Error('Injected configure failure after context acquisition');};
   const unconfigure=GPUCanvasContext.prototype.unconfigure;
   GPUCanvasContext.prototype.unconfigure=function(){(this as any).released=true;return unconfigure.call(this);};
  }else{
   WebGL2RenderingContext.prototype.compileShader=function(){throw Error('Injected shader failure after context acquisition');};
  }
 },failure);
 await page.goto('/#/gel');
 const expected=failure==='gpu-configure'?'webgl2':'webgpu';
 await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',expected);
 await page.getByTestId('microtube-0').click();
 await expect(page.getByTestId('molecular-sim-canvas')).toHaveAttribute('data-probe-context',expected);
 await expect(page.getByRole('alert')).toHaveCount(0);
 for(const id of ['gel-canvas','molecular-sim-canvas'])await expect.poll(async()=>{
  const png=await page.getByTestId(id).screenshot();
  return page.evaluate(async({bytes,id})=>{
   const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
   const canvas=new OffscreenCanvas(image.width,image.height),ctx=canvas.getContext('2d')!;
   ctx.drawImage(image,0,0);image.close();const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   let count=0;for(let i=0;i<data.length;i+=4){
    if(id==='gel-canvas'?data[i]>100&&data[i+1]>100&&data[i+2]>100:
      data[i]<150&&data[i+1]<150&&data[i+2]<150)count++;
   }
   return count;
  },{bytes:[...png],id});
 }).toBeGreaterThan(20);
 await expect.poll(()=>page.evaluate(failure=>{
  const retired=(window as any).retired as {canvas:HTMLCanvasElement;context:any}[];
  return retired.length>=2&&retired.every(({canvas,context})=>!canvas.isConnected&&
    (failure==='gpu-configure'?context.released:context.isContextLost()));
 },failure)).toBe(true);
});
