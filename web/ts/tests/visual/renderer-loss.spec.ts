import {test,expect} from '@playwright/test';
test('live gel, sample and loupe survive repeated graphics loss',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const initial=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 await page.route('**/src/components/sample/SampleSimCanvas.tsx*',async route=>{
  const response=await route.fetch();let source=await response.text();
  source=source.replace('const sim = view.sim;',`const sim = view.sim;
    globalThis.__lossViews ??= new Map(); globalThis.__lossViews.set(viewKey,view);`);
  await route.fulfill({response,body:source});
 });
 await page.addInitScript(initial=>{
  localStorage.setItem('gelBackend',initial);
  (window as any).__devices=[];
  const request=GPUAdapter.prototype.requestDevice;
  GPUAdapter.prototype.requestDevice=async function(...args){const device=await request.apply(this,args);(window as any).__devices.push(device);return device;};
  const getContext=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type:any,options:any){
   const context=getContext.call(this,type,options);if(context)this.setAttribute('data-probe-context',type);return context;
  } as typeof getContext;
 },initial);
 await page.goto('/#/gel');await page.getByTestId('band-0').click();
 const band=(await page.getByTestId('band-0').boundingBox())!;
 await page.keyboard.down('Meta');await page.mouse.click(band.x+band.width/2,band.y+band.height/2);await page.keyboard.up('Meta');
 const ids=['gel-canvas','molecular-sim-canvas','loupe-canvas-1'];
 for(const id of ids)await expect(page.getByTestId(id)).toHaveAttribute('data-probe-context',initial);
 await expect.poll(async()=>Number(await page.getByTestId('loupe-canvas-1').getAttribute('data-alive-count'))).toBeGreaterThan(0);
 await page.evaluate(()=>{(window as any).__savedViews=[...(window as any).__lossViews.entries()];});
 let backend=initial;
 for(let cycle=0;cycle<2;cycle++){
  const oldNodes=await Promise.all(ids.map(id=>page.getByTestId(id).elementHandle()));
  await page.evaluate(({backend,ids})=>{
   if(backend==='webgpu')for(const device of (window as any).__devices)device.destroy();
   else for(const id of ids){const canvas=document.querySelector(`[data-testid="${id}"]`) as HTMLCanvasElement;
    canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext();}
  },{backend,ids});
  backend=backend==='webgpu'?'webgl2':'webgpu';
  for(const id of ids)await expect(page.getByTestId(id)).toHaveAttribute('data-probe-context',backend);
  for(const node of oldNodes)expect(await node!.evaluate(el=>el.isConnected)).toBe(false);
  await expect(page.getByRole('alert')).toHaveCount(0);
  for(const id of ids)await expect.poll(async()=>{
   const png=await page.getByTestId(id).screenshot();
   return page.evaluate(async({bytes,id})=>{
    const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
    const c=new OffscreenCanvas(image.width,image.height),ctx=c.getContext('2d')!;
    ctx.drawImage(image,0,0);image.close();const pixels=ctx.getImageData(0,0,c.width,c.height).data;
    let count=0;for(let i=0;i<pixels.length;i+=4)if(id==='gel-canvas'?
      pixels[i]>100&&pixels[i+1]>100&&pixels[i+2]>100:
      pixels[i]<150&&pixels[i+1]<150&&pixels[i+2]<150)count++;
    return count;
   },{bytes:[...png],id});
  }).toBeGreaterThan(20);
  expect(await page.evaluate(()=>(window as any).__savedViews.every(([key,view]:any)=>(window as any).__lossViews.get(key)===view))).toBe(true);
 }
 await expect(page.getByTestId('fragment-view')).toBeVisible();
 expect(errors).toEqual([]);
});
