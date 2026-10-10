import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test.use({viewport:{width:1365,height:768},launchOptions:{headless:false,ignoreDefaultArgs:['--disable-background-timer-throttling','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding'],args:['--enable-unsafe-webgpu','--ignore-gpu-blocklist']}});
test('application frames and retained views resume after browser freezing',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(b=>{
  localStorage.setItem('gelBackend',b);
  (window as any).__lifecycleEvents=[];
  for(const name of ['freeze','resume'])document.addEventListener(name,()=>{(window as any).__lifecycleEvents.push(name);});
 },info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.route('**/src/components/sample/SampleSimCanvas.tsx',async route=>{
  const response=await route.fetch();let body=await response.text();
  body=body.replace('const store = useGelStore();','const store = useGelStore();globalThis.__resumeStore=store;');
  body=body.replace('const sim = view.sim;','const sim = view.sim;globalThis.__resumeViews??=new Map();globalThis.__resumeViews.set(viewKey,view);');
  await route.fulfill({response,body});
 });
 await page.goto('/#/gel');await page.getByTestId('band-0').click();
 const band=(await page.getByTestId('band-0').boundingBox())!;
 await page.keyboard.down('Meta');await page.mouse.click(band.x+band.width/2,band.y+band.height/2);await page.keyboard.up('Meta');await page.mouse.move(1300,50);
 const ids=['molecular-sim-canvas','loupe-canvas-1'];
 for(const id of ids)await expect.poll(async()=>Number(await page.getByTestId(id).getAttribute('data-alive-count'))).toBeGreaterThan(0);
 const save=async()=>{
  const settings=page.getByRole('button',{name:'Application settings'});await settings.click();
  const promise=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
  const data=await readFile((await (await promise).path())!,'utf8');
  if(await settings.getAttribute('aria-expanded')==='true')await settings.click();
  return JSON.parse(data);
 };
 const before=await save();
 await page.evaluate(()=>{
  (window as any).__resumeFrames=0;(window as any).__resumeStore.subscribeFrame(()=>{(window as any).__resumeFrames++;});
  (window as any).__savedResumeViews=[...(window as any).__resumeViews.entries()].filter(([,v]:any)=>v.alive);
 });
 await expect.poll(()=>page.evaluate(()=>(window as any).__resumeFrames)).toBeGreaterThan(5);
 const cdp=await page.context().newCDPSession(page);
 const {windowId}=await cdp.send('Browser.getWindowForTarget');
 try{
  for(let i=0;i<2;i++){
   await cdp.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'minimized'}});
   await expect.poll(()=>page.evaluate(()=>document.visibilityState)).toBe('hidden');
   await cdp.send('Page.setWebLifecycleState',{state:'frozen'});
   const frozen=await page.evaluate(()=>(window as any).__resumeFrames);
   await page.waitForTimeout(200);
   expect(await page.evaluate(()=>(window as any).__resumeFrames)).toBe(frozen);
   await cdp.send('Page.setWebLifecycleState',{state:'active'});await cdp.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'normal'}});await page.bringToFront();
   await expect.poll(()=>page.evaluate(()=>(window as any).__resumeFrames)).toBeGreaterThan(frozen+10);
   expect(await page.evaluate(()=>(window as any).__savedResumeViews.every(([k,v]:any)=>v.alive&&(window as any).__resumeViews.get(k)===v))).toBe(true);
  }
 }finally{await cdp.send('Page.setWebLifecycleState',{state:'active'});await cdp.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'normal'}});await page.bringToFront();}
 expect(await page.evaluate(()=>(window as any).__lifecycleEvents)).toEqual(['freeze','resume','freeze','resume']);
 for(const id of ids)await expect.poll(async()=>{
  const png=await page.getByTestId(id).screenshot();
  return page.evaluate(async bytes=>{
   const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
   const canvas=new OffscreenCanvas(image.width,image.height),ctx=canvas.getContext('2d')!;
   ctx.drawImage(image,0,0);image.close();const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   let dark=0;for(let i=0;i<data.length;i+=4)if(data[i]<150&&data[i+1]<150&&data[i+2]<150)dark++;
   return dark;
  },[...png]);
 }).toBeGreaterThan(20);
 expect(await save()).toEqual(before);expect(errors).toEqual([]);
 await expect(page.getByRole('alert')).toHaveCount(0);
});
