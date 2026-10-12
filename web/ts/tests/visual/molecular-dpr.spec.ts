import {test,expect} from '@playwright/test';
test.use({viewport:{width:1365,height:768},deviceScaleFactor:1});
test('sample, loupe and representative resize backing buffers across live display-scale changes',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.route('**/src/components/sample/SampleSimCanvas.tsx*',async route=>{
  const response=await route.fetch();const source=(await response.text()).replace('const sim = view.sim;',`const sim = view.sim;
   globalThis.__dprViews ??= new Map();globalThis.__dprViews.set(viewKey,view);`);
  await route.fulfill({response,body:source});
 });
 await page.goto('/#/gel');await page.getByTestId('band-0').click();
 const band=(await page.getByTestId('band-0').boundingBox())!;
 await page.keyboard.down('Meta');await page.mouse.click(band.x+band.width/2,band.y+band.height/2);await page.keyboard.up('Meta');
 const ids=['molecular-sim-canvas','loupe-canvas-1','fragment-representative'];
 for(const id of ids)await expect.poll(async()=>Number(await page.getByTestId(id).getAttribute('data-alive-count'))).toBeGreaterThan(0);
 await expect.poll(()=>page.evaluate(()=>[...new Set((window as any).__dprViews.values())].filter((v:any)=>v.alive).length)).toBe(2);
 await page.evaluate(()=>{(window as any).__savedDprViews=[...(window as any).__dprViews.entries()].filter(([,v]:any)=>v.alive);});
 expect(await page.evaluate(()=>(window as any).__dprViews.get('fragment-preview')===(window as any).__dprViews.get('sample'))).toBe(true);
 const nodes=await Promise.all(ids.map(id=>page.getByTestId(id).elementHandle()));
 const cdp=await page.context().newCDPSession(page);
 for(const dpr of [2,1]){
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1365,height:768,deviceScaleFactor:dpr,mobile:false});
  for(const id of ids)await expect.poll(()=>page.getByTestId(id).evaluate(c=>{
   const canvas=c as HTMLCanvasElement,r=c.getBoundingClientRect();
   return [canvas.width,canvas.height,Math.round(r.width*window.devicePixelRatio),Math.round(r.height*window.devicePixelRatio)];
  })).toEqual(await page.getByTestId(id).evaluate((c,d)=>{const r=c.getBoundingClientRect();return [Math.round(r.width*d),Math.round(r.height*d),Math.round(r.width*d),Math.round(r.height*d)];},dpr));
  for(const id of ids)await expect.poll(async()=>{
   const png=await page.getByTestId(id).screenshot();
   return page.evaluate(async bytes=>{
    const img=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
    const canvas=new OffscreenCanvas(img.width,img.height),ctx=canvas.getContext('2d')!;
    ctx.drawImage(img,0,0);img.close();const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let dark=0;for(let i=0;i<data.length;i+=4)if(data[i]<150&&data[i+1]<150&&data[i+2]<150)dark++;
    return dark;
   },[...png]);
  }).toBeGreaterThan(20);
  expect(await page.evaluate(()=>(window as any).__savedDprViews.every(([key,v]:any)=>(window as any).__dprViews.get(key)===v&&v.alive))).toBe(true);
  for(const node of nodes)expect(await node!.evaluate(c=>c.isConnected)).toBe(true);
 }
 await expect(page.getByRole('alert')).toHaveCount(0);expect(errors).toEqual([]);
});
