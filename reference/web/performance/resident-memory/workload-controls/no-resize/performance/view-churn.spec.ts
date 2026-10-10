import {test,expect} from '@playwright/test';
import {serveBuiltApp} from '../production/built-app';
import {writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const runFile=promisify(execFile);
const cycles=Number(process.env.GEL_LIFECYCLE_CYCLES??10);
if(!Number.isInteger(cycles)||cycles<1||cycles>1000)throw new Error('GEL_LIFECYCLE_CYCLES must be an integer from 1 to 1000');
test.use({viewport:{width:1365,height:768}});
test('compiled repeated sample/loupe disposal without resize releases owned GPU resources',async({page,browser},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
 test.setTimeout(Math.max(30000,cycles*3000));
 const started=Date.now();
 const networkBuffer=process.env.GEL_LIFECYCLE_NETWORK_BUFFER_BYTES;
 if(networkBuffer!==undefined){
  const limit=Number(networkBuffer);
  if(!Number.isSafeInteger(limit)||limit<1)throw Error('Network response buffer must be a positive integer');
  // Network.enable is session-scoped; adjust the pinned Playwright connection
  // that enables response-body retention, not a separate observer connection.
  const session=(page as any)._toImpl()._delegate._mainFrameSession._client;
  if(typeof session?.send!=='function')throw Error('Pinned Playwright main-frame session unavailable');
  await session.send('Network.enable',{maxTotalBufferSize:limit,maxResourceBufferSize:limit});
 }

 const heap=process.env.GEL_LIFECYCLE_MEASURE_HEAP==='1'?await page.context().newCDPSession(page):null;
 const rss=process.env.GEL_LIFECYCLE_MEASURE_RSS==='1';
 if(rss&&process.platform!=='darwin')throw Error('RSS sampler is scoped to macOS ps units');
 const browserSession=rss?await browser.newBrowserCDPSession():null;
 const memory:unknown[]=[],residentMemory:unknown[]=[];
 const measure=async(cycle:number)=>{
  if(heap){await heap.send('HeapProfiler.collectGarbage');memory.push({cycle,...await heap.send('Runtime.getHeapUsage'),dom:await heap.send('Memory.getDOMCounters')});}
  if(browserSession){
   const {processInfo}=await browserSession.send('SystemInfo.getProcessInfo');
   const ids=processInfo.map(p=>p.id);if(ids.some(id=>!Number.isInteger(id)||id<=0))throw Error('Invalid browser PID');
   const {stdout}=await runFile('/bin/ps',['-p',ids.join(','),'-o','pid=,rss=']);
   const rows=new Map(stdout.trim().split('\n').map(line=>line.trim().split(/\s+/).map(Number)).map(([pid,rssKiB])=>[pid,rssKiB]));
   const processes=processInfo.map(p=>({pid:p.id,type:p.type,rssKiB:rows.get(p.id)??null}));
   if(processes.some(p=>p.rssKiB===null||!Number.isFinite(p.rssKiB)||p.rssKiB<=0))throw Error('Missing or invalid browser RSS sample');
   residentMemory.push({cycle,elapsedMs:Date.now()-started,processes,totalRssKiB:processes.reduce((n,p)=>n+p.rssKiB!,0)});
   await writeFile(info.outputPath('memory-checkpoints.json'),JSON.stringify({memory,residentMemory},null,2));
  }
 };
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(backend=>{
  localStorage.setItem('gelBackend',backend);
  const get=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type:any,options:any){const c=get.call(this,type,options);if(c)this.dataset.context=type;return c;} as any;
  const live=new Set<object>();(window as any).__liveResources=live;
  if(typeof GPUDevice!=='undefined')for(const [create,prototype] of [['createBuffer',GPUBuffer.prototype],['createTexture',GPUTexture.prototype]] as const){
   const original=(GPUDevice.prototype as any)[create];
   (GPUDevice.prototype as any)[create]=function(...args:any[]){const resource=original.apply(this,args);live.add(resource);return resource;};
   const destroy=prototype.destroy;prototype.destroy=function(){live.delete(this);return destroy.call(this as any);};
  }
  for(const kind of ['Buffer','Texture','Framebuffer','Renderbuffer','Program','Shader','VertexArray','Sampler']){
   const p=WebGL2RenderingContext.prototype as any,create=p['create'+kind],destroy=p['delete'+kind];
   p['create'+kind]=function(...args:any[]){const resource=create.apply(this,args);if(resource)live.add(resource);return resource;};
   p['delete'+kind]=function(resource:any){live.delete(resource);return destroy.call(this,resource);};
  }
 },info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto(`${app.url}#/gel`);await expect(page.getByTestId('band-0')).toBeVisible();
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
  await expect(page.getByTestId('shared-scene')).toHaveAttribute('data-context',info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await expect(page.locator('canvas[data-context=webgpu],canvas[data-context=webgl2]')).toHaveCount(1);
  // Attribution control: keep the canvas at its initial viewport size.
  await expect(page.getByTestId('shared-scene')).toHaveAttribute('width','2730');
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
 await measure(0);
 const peaks:number[]=[],closedCycleCounts:number[]=[];
 for(let i=0;i<cycles;i++){
  const peak=await cycle();peaks.push(peak);expect(peak).toBeGreaterThan(baseline);
  await expect.poll(count).toBe(baseline);closedCycleCounts.push(await count());
  if((i+1)%10===0){await measure(i+1);console.log(`Lifecycle cycles completed: ${i+1}/${cycles}`);}
 }
 // Hash navigation retains this page and its resource ledger.
 await page.evaluate(()=>{location.hash='/dev/slider';});
 await expect(page.getByTestId('gel-canvas')).toHaveCount(0);
 await expect.poll(count).toBe(0);
 await measure(cycles+.5);
 await page.evaluate(()=>{location.hash='/gel';});
 await page.getByTestId('band-0').click();
 await expect.poll(async()=>Number(await page.getByTestId('molecular-sim-canvas').getAttribute('data-alive-count'))).toBeGreaterThan(0);
 await expect(page.getByRole('alert')).toHaveCount(0);expect(errors).toEqual([]);
 await measure(cycles+1);

 const report={resizeEachCycle:false,backend:info.project.name,browser:browser.version(),cycles,elapsedMs:Date.now()-started,baseline,peaks,closedCycleCounts,afterRouteUnmount:0,memory,residentMemory,networkResponseBufferBytes:networkBuffer===undefined?null:Number(networkBuffer),scope:'Explicit buffer/texture and GL object destruction. Optional CDP heap samples follow forced GC; final sample is after route remount. Heap observations are not a driver-memory or release-budget assertion. Optional macOS RSS samples cover processes belonging to this test browser, including its GPU process. RSS includes shared pages/caches and is not isolated driver allocation accounting.'};
 await writeFile(info.outputPath('resource-lifecycle.json'),JSON.stringify(report,null,2));
 await info.attach('resource-lifecycle',{body:JSON.stringify(report,null,2),contentType:'application/json'});
 await heap?.detach();await browserSession?.detach();
 }finally{await app.close();}
});
