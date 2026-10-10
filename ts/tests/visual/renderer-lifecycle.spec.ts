import {test,expect} from '@playwright/test';
test.use({viewport:{width:1365,height:768}});
test('repeated sample/loupe disposal and route remount release owned GPU resources',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(backend=>{
  localStorage.setItem('gelBackend',backend);
  const live=new Set<object>();(window as any).__liveResources=live;
  if(typeof GPUDevice!=='undefined')for(const [create,prototype] of [['createBuffer',GPUBuffer.prototype],['createTexture',GPUTexture.prototype]] as const){
   const original=(GPUDevice.prototype as any)[create];
   (GPUDevice.prototype as any)[create]=function(...args:any[]){const resource=original.apply(this,args);live.add(resource);return resource;};
   const destroy=prototype.destroy;prototype.destroy=function(){live.delete(this);return destroy.call(this as any);};
  }
  for(const kind of ['Buffer','Texture','Framebuffer','Program','Shader','VertexArray']){
   const p=WebGL2RenderingContext.prototype as any,create=p['create'+kind],destroy=p['delete'+kind];
   p['create'+kind]=function(...args:any[]){const resource=create.apply(this,args);if(resource)live.add(resource);return resource;};
   p['delete'+kind]=function(resource:any){live.delete(resource);return destroy.call(this,resource);};
  }
 },info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');await expect(page.getByTestId('band-0')).toBeVisible();
 const count=()=>page.evaluate(()=>(window as any).__liveResources.size);
 const cycle=async()=>{
  await page.getByTestId('band-0').click();
  await expect.poll(async()=>Number(await page.getByTestId('molecular-sim-canvas').getAttribute('data-alive-count'))).toBeGreaterThan(0);
  for(let j=0;j<2;j++){
   const band=(await page.getByTestId(j===0?'band-0':'band-9').boundingBox())!;
   await page.keyboard.down('Meta');await page.mouse.click(band.x+band.width/2,band.y+band.height/2);await page.keyboard.up('Meta');
   // Move away so transient hover previews cannot mask permanent-view accounting.
   await page.mouse.move(1300,50);
  }
  await expect(page.locator('[data-loupe-id]')).toHaveCount(2);
  for(const canvas of await page.locator('[data-testid^="loupe-canvas-"]').all())
   await expect.poll(async()=>Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
  const peak=await count();
  for(let j=0;j<2;j++){
   await page.locator('[data-testid^="loupe-frame-"]').last().focus();await page.keyboard.press('Escape');
   await expect(page.locator('[data-loupe-id]')).toHaveCount(1-j);
  }
  // Native Escape retains selection and can reopen the sample on the next frame.
  // Gel settings explicitly clears it, allowing sustained disposal verification.
  await page.getByTestId('settings-button').click();
  await expect(page.getByTestId('molecular-sim-canvas')).toHaveCount(0);
  await expect(page.locator('[data-loupe-id]')).toHaveCount(0);
  await page.getByTestId('settings-button').click();
  return peak;
 };
 await cycle();const baseline=await count();expect(baseline).toBeGreaterThan(0);
 const peaks:number[]=[];
 for(let i=0;i<10;i++){
  const peak=await cycle();peaks.push(peak);expect(peak).toBeGreaterThan(baseline);
  await expect.poll(count).toBe(baseline);
 }
 // Hash navigation retains this page and its resource ledger.
 await page.evaluate(()=>{location.hash='/dev/slider';});
 await expect(page.getByTestId('gel-canvas')).toHaveCount(0);
 await expect.poll(count).toBe(0);
 await page.evaluate(()=>{location.hash='/gel';});
 await page.getByTestId('band-0').click();
 await expect.poll(async()=>Number(await page.getByTestId('molecular-sim-canvas').getAttribute('data-alive-count'))).toBeGreaterThan(0);
 await expect(page.getByRole('alert')).toHaveCount(0);expect(errors).toEqual([]);
 await info.attach('resource-lifecycle',{body:JSON.stringify({baseline,peaks,closedCycleCounts:peaks.map(()=>baseline),afterRouteUnmount:0,scope:'Explicit buffer/texture and GL object destruction; not browser/driver memory usage.'},null,2),contentType:'application/json'});
});
