import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serveBuiltApp} from '../production/built-app';
test.use({viewport:{width:1365,height:768},headless:false});
test('retained views resume after WebKit engine activity changes',async({page,browser},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(b=>{
  localStorage.setItem('gelBackend',b);
  (window as any).__lifecycleEvents=[];
  (window as any).__visibilityEvents=[];
  document.addEventListener('visibilitychange',()=>{(window as any).__visibilityEvents.push(document.visibilityState);});
  for(const name of ['freeze','resume'])document.addEventListener(name,()=>{(window as any).__lifecycleEvents.push(name);});
 },info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 const app=await serveBuiltApp();
 try{
 await page.goto(`${app.url}#/gel`);await page.getByTestId('band-0').click();
 await expect(page.getByTestId('molecular-sim-canvas')).toHaveAttribute('data-shared-ready','1');
 await page.getByTestId('molecular-sim-canvas').evaluate(canvas=>{
  const key=Object.keys(canvas).find(k=>k.startsWith('__reactFiber$'));if(!key)throw Error('Missing React18 DOM fiber');
  let store:any,registry:any;
  for(let fiber=(canvas as any)[key];fiber;fiber=fiber.return){const value=fiber.memoizedProps?.value;if(value&&typeof value.getMolecularView==='function')store=value;if(value&&typeof value.getGraphics==='function')registry=value;}
  if(!store||!registry)throw Error('Missing production providers');
  if(registry.getGraphics()?.backend!==localStorage.getItem('gelBackend'))throw Error('Unexpected graphics backend');
  (window as any).__resumeStore=store;
 });
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
  (window as any).__savedResumeViews=['sample','loupe-1'].map(k=>{const v=(window as any).__resumeStore.getMolecularView(k);if(!v?.alive)throw Error('Missing retained view '+k);return [k,v];});
 });
 await expect.poll(()=>page.evaluate(()=>(window as any).__resumeFrames)).toBeGreaterThan(5);
 // WebKit protocol controls the browser engine's activity/visibility state.
 // This is not an OS sleep or physical tab-switch test.
 const proxy=(page as any)._toImpl()._delegate._pageProxySession;
 if(typeof proxy?.send!=='function')throw Error('Pinned WebKit page proxy unavailable');
 const cycles:any[]=[];
 try{
  for(let i=0;i<2;i++){
   await proxy.send('Emulation.setActiveAndFocused',{active:false});
   await expect.poll(()=>page.evaluate(()=>document.visibilityState)).toBe('hidden');

   const hiddenStart=await page.evaluate(()=>(window as any).__resumeFrames);
   await page.waitForTimeout(1000);
   const hiddenEnd=await page.evaluate(()=>(window as any).__resumeFrames);
   expect(hiddenEnd,'application frames pause while WebKit is inactive').toBe(hiddenStart);
   await proxy.send('Emulation.setActiveAndFocused',{active:true});
   await expect.poll(()=>page.evaluate(()=>document.visibilityState)).toBe('visible');
   await expect.poll(()=>page.evaluate(()=>(window as any).__resumeFrames)).toBeGreaterThan(hiddenEnd+10);
   cycles.push({cycle:i,hiddenStart,hiddenEnd,resumed:await page.evaluate(()=>(window as any).__resumeFrames)});
   expect(await page.evaluate(()=>(window as any).__savedResumeViews.every(([k,v]:any)=>v.alive&&(window as any).__resumeStore.getMolecularView(k)===v))).toBe(true);
  }
 }finally{await proxy.send('Emulation.setActiveAndFocused',{active:true});}
 const visibility=await page.evaluate(()=>(window as any).__visibilityEvents as string[]);
 expect(visibility.filter(v=>v==='hidden').length).toBeGreaterThanOrEqual(2);
 expect(visibility.filter(v=>v==='visible').length).toBeGreaterThanOrEqual(2);
 for(const id of ids)await expect.poll(async()=>{
  const png=await page.getByTestId(id).screenshot();
  return page.evaluate(async bytes=>{
   const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
   const canvas=new OffscreenCanvas(image.width,image.height),ctx=canvas.getContext('2d')!;
   ctx.drawImage(image,0,0);image.close();const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   // Exclude panel edges/shadow so chrome alone cannot satisfy particle visibility.
   let dark=0;const margin=24;for(let y=margin;y<canvas.height-margin;y++)for(let x=margin;x<canvas.width-margin;x++){const i=(y*canvas.width+x)*4;if(data[i]<150&&data[i+1]<150&&data[i+2]<150)dark++;}
   return dark;
  },[...png]);
 }).toBeGreaterThan(20);
 const sample=page.getByTestId('molecular-sim-canvas'),paintBefore=await sample.screenshot();
 const paintFrame=await page.evaluate(()=>(window as any).__resumeFrames);
 await expect.poll(()=>page.evaluate(()=>(window as any).__resumeFrames)).toBeGreaterThan(paintFrame+10);
 const paintAfter=await sample.screenshot();
 expect(paintAfter.equals(paintBefore),'sample particles must continue painting after resume').toBe(false);
 const resumedPaint={before:createHash('sha256').update(paintBefore).digest('hex'),after:createHash('sha256').update(paintAfter).digest('hex')};
 await writeFile(info.outputPath('resumed-before.png'),paintBefore);await writeFile(info.outputPath('resumed-after.png'),paintAfter);
 expect(await save()).toEqual(before);expect(errors).toEqual([]);
 await expect(page.getByRole('alert')).toHaveCount(0);
 await writeFile(info.outputPath('resume.json'),JSON.stringify({backend:info.project.name,browser:browser.version(),resumedPaint,cycles,events:await page.evaluate(()=>(window as any).__lifecycleEvents),visibilityEvents:await page.evaluate(()=>(window as any).__visibilityEvents)},null,2));
 }finally{await app.close();}
});
