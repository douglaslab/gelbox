import {test,expect} from '@playwright/test';
for(const failure of ['null-adapter','adapter-rejection','device-rejection']){
 test(`gel and molecular views recover from ${failure} through WebGL2`,async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(failure=>{
   localStorage.setItem('gelBackend','webgpu');
   Object.defineProperty(navigator,'gpu',{configurable:true,value:{requestAdapter:async()=>{
    if(failure==='null-adapter')return null;
    if(failure==='adapter-rejection')throw Error('Injected adapter failure');
    return {requestDevice:async()=>{throw Error('Injected device failure')}};
   }}});
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type:any,options:any){
    const context=original.call(this,type,options);
    if(context)this.setAttribute('data-probe-context',type);
    return context;
   } as typeof original;
  },failure);
  await page.goto('/#/gel');
  const gel=page.getByTestId('gel-canvas');
  await expect(gel).toHaveAttribute('data-probe-context','webgl2');
  // A configured context alone is insufficient: require visible band pixels.
  await expect.poll(async()=>{
   const bytes=await gel.screenshot();
   return page.evaluate(async bytes=>{
    const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
    const canvas=new OffscreenCanvas(image.width,image.height),context=canvas.getContext('2d')!;
    context.drawImage(image,0,0);image.close();
    const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
    let bright=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]>100&&pixels[i+1]>100&&pixels[i+2]>100)bright++;
    return bright;
   },[...bytes]);
  }).toBeGreaterThan(100);
  await page.getByTestId('band-0').click();
  await expect(page.getByTestId('molecular-sim-canvas')).toHaveAttribute('data-probe-context','webgl2');
  const sample=page.getByTestId('molecular-sim-canvas');
  await expect.poll(async()=>{
   const bytes=await sample.screenshot();
   return page.evaluate(async bytes=>{
    const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
    const canvas=new OffscreenCanvas(image.width,image.height),context=canvas.getContext('2d')!;
    context.drawImage(image,0,0);image.close();
    const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
    let dark=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]<150&&pixels[i+1]<150&&pixels[i+2]<150)dark++;
    return dark;
   },[...bytes]);
  }).toBeGreaterThan(20);
  expect(errors).toEqual([]);
 });
}
