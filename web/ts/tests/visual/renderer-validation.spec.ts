import {test,expect} from '@playwright/test';
for(const when of ['startup','running','exhausted'])test(`recover from asynchronous GPU validation while ${when}`,async({page})=>{
 const exceptions:string[]=[];page.on('pageerror',e=>exceptions.push(e.message));
 await page.addInitScript(when=>{
  localStorage.setItem('gelBackend','webgpu');
  (window as any).__attempted=[];
  const request=GPUAdapter.prototype.requestDevice;
  GPUAdapter.prototype.requestDevice=async function(...args){const device=await request.apply(this,args);(window as any).__validationDevice=device;return device;};
  const getContext=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type:any,options:any){const context=getContext.call(this,type,options);
   if(context){this.setAttribute('data-probe-context',type);if(this.getAttribute('data-testid')==='gel-canvas')(window as any).__attempted.push(type);}return context;
  } as typeof getContext;
  if(when!=='running'){
   const pipeline=GPUDevice.prototype.createRenderPipeline;
   GPUDevice.prototype.createRenderPipeline=function(descriptor){
    return pipeline.call(this,{...descriptor,vertex:{...descriptor.vertex,entryPoint:'missing_validation_probe_entry'}});
   };
  }
  if(when==='exhausted')WebGL2RenderingContext.prototype.compileShader=()=>{throw Error('Injected GL failure')};
 },when);
 await page.goto('/#/gel');
 if(when==='exhausted'){
  const error=page.getByTestId('gel-canvas-error');await expect(error).toBeVisible();
  expect(await page.evaluate(()=>(window as any).__attempted)).toEqual(['webgpu','webgl2']);
  await error.getByRole('button',{name:'Retry graphics'}).click();await expect(error).toBeVisible();
  expect(await page.evaluate(()=>(window as any).__attempted)).toEqual(['webgpu','webgl2','webgpu','webgl2']);
  expect(exceptions).toEqual([]);return;
 }
 if(when==='running')await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context','webgpu');
 else await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context','webgl2');
 await page.getByTestId('microtube-0').click();
 if(when==='running'){
  await expect(page.getByTestId('molecular-sim-canvas')).toHaveAttribute('data-probe-context','webgpu');
  await page.evaluate(()=>{const invalid=(window as any).__validationDevice.createBuffer({size:4,usage:0});invalid.destroy();});
 }
 for(const id of ['gel-canvas','molecular-sim-canvas']){
  await expect(page.getByTestId(id)).toHaveAttribute('data-probe-context','webgl2');
  await expect.poll(async()=>{
   const png=await page.getByTestId(id).screenshot();
   return page.evaluate(async({bytes,id})=>{
    const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
    const c=new OffscreenCanvas(image.width,image.height),ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);image.close();
    const pixels=ctx.getImageData(0,0,c.width,c.height).data;let count=0;
    for(let i=0;i<pixels.length;i+=4)if(id==='gel-canvas'?pixels[i]>100&&pixels[i+1]>100&&pixels[i+2]>100:
      pixels[i]<150&&pixels[i+1]<150&&pixels[i+2]<150)count++;
    return count;
   },{bytes:[...png],id});
  }).toBeGreaterThan(20);
 }
 await expect(page.getByRole('alert')).toHaveCount(0);expect(exceptions).toEqual([]);
});
