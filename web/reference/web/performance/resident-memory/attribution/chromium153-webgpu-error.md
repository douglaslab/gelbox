# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: view-churn.spec.ts >> compiled repeated sample/loupe disposal and resize release owned GPU resources
- Location: ../../../../../../../private/tmp/gel-browser-compat-1.64/memory/performance/view-churn.spec.ts:10:5

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByTestId('shared-scene')
Expected: "webgpu"
Received: "webgl2"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" getByTestId('shared-scene') with timeout 5000ms
  - waiting for getByTestId('shared-scene')
    13 × locator resolved to <canvas width="2730" height="1536" aria-hidden="true" data-context="webgl2" data-testid="shared-scene" data-view-keys="gel,sample,app-button,help-button,inspector-fragment,loupe-1,loupe-2"></canvas>
       - unexpected value "webgl2"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Application settings" [ref=e5] [cursor=pointer]
  - link "Help" [ref=e6] [cursor=pointer]:
    - /url: http://douglaslab.org/gelbox/
  - generic [ref=e7]:
    - generic [ref=e9]:
      - generic [ref=e10]:
        - button "Lane 1 sample" [ref=e11] [cursor=pointer]:
          - img "lane 1"
        - button "Lane 2 empty" [ref=e12] [cursor=pointer]
        - button "Lane 3 empty" [ref=e13] [cursor=pointer]
        - button "Lane 4 empty" [ref=e14] [cursor=pointer]
        - button "Lane 5 empty" [ref=e15] [cursor=pointer]
        - button "Lane 6 empty" [ref=e16] [cursor=pointer]
        - button "Lane 7 empty" [ref=e17] [cursor=pointer]
      - generic [ref=e18]:
        - generic [ref=e36] [cursor=pointer]
        - generic [ref=e41] [cursor=pointer]
      - button "Toggle gel settings" [ref=e43] [cursor=pointer]
      - generic [ref=e44]: 3:00
    - generic [ref=e52]:
      - button "New species" [ref=e53] [cursor=pointer]
      - generic:
        - heading "Sample" [level=2]
      - generic [ref=e56] [cursor=pointer]
    - generic [ref=e59]:
      - generic:
        - heading "Species" [level=2]
      - generic [ref=e63]:
        - 'button "Color 1: #0066cc" [ref=e64] [cursor=pointer]'
        - 'button "Color 2: #cc0000" [ref=e66] [cursor=pointer]'
        - 'button "Color 3: #f74308" [ref=e68] [cursor=pointer]'
        - 'button "Color 4: #f7931e" [ref=e70] [cursor=pointer]'
        - 'button "Color 5: #aaaa00" [ref=e72] [cursor=pointer]'
        - 'button "Color 6: #57bb00" [ref=e74] [cursor=pointer]'
        - 'button "Color 7: #007200" [ref=e76] [cursor=pointer]'
        - 'button "Color 8: #03b6a2" [ref=e78] [cursor=pointer]'
        - 'button "Color 9: #1700de" [ref=e80] [cursor=pointer]'
        - 'button "Color 10: #7300de" [ref=e82] [cursor=pointer]'
        - 'button "Color 11: #b8056c" [ref=e84] [cursor=pointer]'
        - 'button "Color 12: #333333" [pressed] [ref=e86] [cursor=pointer]'
      - generic [ref=e88]:
        - generic [ref=e89]: 10,000 bp
        - generic [ref=e95]: 42 ng
        - generic [ref=e101]: "1 : 1"
```

# Test source

```ts
  1   | import {test,expect} from '@playwright/test';
  2   | import {serveBuiltApp} from '../production/built-app';
  3   | import {writeFile} from 'node:fs/promises';
  4   | import {execFile} from 'node:child_process';
  5   | import {promisify} from 'node:util';
  6   | const runFile=promisify(execFile);
  7   | const cycles=Number(process.env.GEL_LIFECYCLE_CYCLES??10);
  8   | if(!Number.isInteger(cycles)||cycles<1||cycles>1000)throw new Error('GEL_LIFECYCLE_CYCLES must be an integer from 1 to 1000');
  9   | test.use({viewport:{width:1365,height:768}});
  10  | test('compiled repeated sample/loupe disposal and resize release owned GPU resources',async({page,browser},info)=>{
  11  |  const app=await serveBuiltApp('/gelbox/');
  12  |  try{
  13  |  test.setTimeout(Math.max(30000,cycles*3000));
  14  |  const started=Date.now();
  15  |  const networkBuffer=process.env.GEL_LIFECYCLE_NETWORK_BUFFER_BYTES;
  16  |  if(networkBuffer!==undefined){
  17  |   const limit=Number(networkBuffer);
  18  |   if(!Number.isSafeInteger(limit)||limit<1)throw Error('Network response buffer must be a positive integer');
  19  |   // Network.enable is session-scoped; adjust the pinned Playwright connection
  20  |   // that enables response-body retention, not a separate observer connection.
  21  |   const session=(page as any)._toImpl()._delegate._mainFrameSession._client;
  22  |   if(typeof session?.send!=='function')throw Error('Pinned Playwright main-frame session unavailable');
  23  |   await session.send('Network.enable',{maxTotalBufferSize:limit,maxResourceBufferSize:limit});
  24  |  }
  25  | 
  26  |  const heap=process.env.GEL_LIFECYCLE_MEASURE_HEAP==='1'?await page.context().newCDPSession(page):null;
  27  |  const rss=process.env.GEL_LIFECYCLE_MEASURE_RSS==='1';
  28  |  if(rss&&process.platform!=='darwin')throw Error('RSS sampler is scoped to macOS ps units');
  29  |  const browserSession=rss?await browser.newBrowserCDPSession():null;
  30  |  const memory:unknown[]=[],residentMemory:unknown[]=[];
  31  |  const measure=async(cycle:number)=>{
  32  |   if(heap){await heap.send('HeapProfiler.collectGarbage');memory.push({cycle,...await heap.send('Runtime.getHeapUsage'),dom:await heap.send('Memory.getDOMCounters')});}
  33  |   if(browserSession){
  34  |    const {processInfo}=await browserSession.send('SystemInfo.getProcessInfo');
  35  |    const ids=processInfo.map(p=>p.id);if(ids.some(id=>!Number.isInteger(id)||id<=0))throw Error('Invalid browser PID');
  36  |    const {stdout}=await runFile('/bin/ps',['-p',ids.join(','),'-o','pid=,rss=']);
  37  |    const rows=new Map(stdout.trim().split('\n').map(line=>line.trim().split(/\s+/).map(Number)).map(([pid,rssKiB])=>[pid,rssKiB]));
  38  |    const processes=processInfo.map(p=>({pid:p.id,type:p.type,rssKiB:rows.get(p.id)??null}));
  39  |    if(processes.some(p=>p.rssKiB===null||!Number.isFinite(p.rssKiB)||p.rssKiB<=0))throw Error('Missing or invalid browser RSS sample');
  40  |    residentMemory.push({cycle,elapsedMs:Date.now()-started,processes,totalRssKiB:processes.reduce((n,p)=>n+p.rssKiB!,0)});
  41  |    await writeFile(info.outputPath('memory-checkpoints.json'),JSON.stringify({memory,residentMemory},null,2));
  42  |   }
  43  |  };
  44  |  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  45  |  await page.addInitScript(backend=>{
  46  |   localStorage.setItem('gelBackend',backend);
  47  |   const get=HTMLCanvasElement.prototype.getContext;
  48  |   HTMLCanvasElement.prototype.getContext=function(type:any,options:any){const c=get.call(this,type,options);if(c)this.dataset.context=type;return c;} as any;
  49  |   const live=new Set<object>();(window as any).__liveResources=live;
  50  |   if(typeof GPUDevice!=='undefined')for(const [create,prototype] of [['createBuffer',GPUBuffer.prototype],['createTexture',GPUTexture.prototype]] as const){
  51  |    const original=(GPUDevice.prototype as any)[create];
  52  |    (GPUDevice.prototype as any)[create]=function(...args:any[]){const resource=original.apply(this,args);live.add(resource);return resource;};
  53  |    const destroy=prototype.destroy;prototype.destroy=function(){live.delete(this);return destroy.call(this as any);};
  54  |   }
  55  |   for(const kind of ['Buffer','Texture','Framebuffer','Renderbuffer','Program','Shader','VertexArray','Sampler']){
  56  |    const p=WebGL2RenderingContext.prototype as any,create=p['create'+kind],destroy=p['delete'+kind];
  57  |    p['create'+kind]=function(...args:any[]){const resource=create.apply(this,args);if(resource)live.add(resource);return resource;};
  58  |    p['delete'+kind]=function(resource:any){live.delete(resource);return destroy.call(this,resource);};
  59  |   }
  60  |  },info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  61  |  await page.goto(`${app.url}#/gel`);await expect(page.getByTestId('band-0')).toBeVisible();
  62  |  const count=()=>page.evaluate(()=>(window as any).__liveResources.size);
  63  |  const cycle=async()=>{
  64  |   await page.getByTestId('band-0').click();
  65  |   await expect.poll(async()=>Number(await page.getByTestId('molecular-sim-canvas').getAttribute('data-alive-count'))).toBeGreaterThan(0);
  66  |   for(let j=0;j<2;j++){
  67  |    const band=(await page.getByTestId(j===0?'band-0':'band-9').boundingBox())!;
  68  |    await page.keyboard.down('Meta');await page.mouse.click(band.x+band.width/2,band.y+band.height/2);await page.keyboard.up('Meta');
  69  |    // Move away so transient hover previews cannot mask permanent-view accounting.
  70  |    await page.mouse.move(1300,50);
  71  |   }
  72  |   await expect(page.locator('[data-loupe-id]')).toHaveCount(2);
  73  |   for(const canvas of await page.locator('[data-testid^="loupe-canvas-"]').all())
  74  |    await expect.poll(async()=>Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
> 75  |   await expect(page.getByTestId('shared-scene')).toHaveAttribute('data-context',info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
      |                                                  ^ Error: expect(locator).toHaveAttribute(expected) failed
  76  |   await expect(page.locator('canvas[data-context=webgpu],canvas[data-context=webgl2]')).toHaveCount(1);
  77  |   await page.setViewportSize({width:1465,height:868});
  78  |   await expect(page.getByTestId('shared-scene')).toHaveAttribute('width','2930');
  79  |   await page.setViewportSize({width:1365,height:768});
  80  |   await expect(page.getByTestId('shared-scene')).toHaveAttribute('width','2730');
  81  |   const peak=await count();
  82  |   for(let j=0;j<2;j++){
  83  |    await page.locator('[data-testid^="loupe-frame-"]').last().focus();await page.keyboard.press('Escape');
  84  |    await expect(page.locator('[data-loupe-id]')).toHaveCount(1-j);
  85  |   }
  86  |   // Native Escape retains selection and can reopen the sample on the next frame.
  87  |   // Gel settings explicitly clears it, allowing sustained disposal verification.
  88  |   await page.getByTestId('settings-button').click();
  89  |   await expect(page.getByTestId('molecular-sim-canvas')).toHaveCount(0);
  90  |   await expect(page.locator('[data-loupe-id]')).toHaveCount(0);
  91  |   await page.getByTestId('settings-button').click();
  92  |   return peak;
  93  |  };
  94  |  await cycle();const baseline=await count();expect(baseline).toBeGreaterThan(0);
  95  |  await measure(0);
  96  |  const peaks:number[]=[],closedCycleCounts:number[]=[];
  97  |  for(let i=0;i<cycles;i++){
  98  |   const peak=await cycle();peaks.push(peak);expect(peak).toBeGreaterThan(baseline);
  99  |   await expect.poll(count).toBe(baseline);closedCycleCounts.push(await count());
  100 |   if((i+1)%10===0){await measure(i+1);console.log(`Lifecycle cycles completed: ${i+1}/${cycles}`);}
  101 |  }
  102 |  // Hash navigation retains this page and its resource ledger.
  103 |  await page.evaluate(()=>{location.hash='/dev/slider';});
  104 |  await expect(page.getByTestId('gel-canvas')).toHaveCount(0);
  105 |  await expect.poll(count).toBe(0);
  106 |  await measure(cycles+.5);
  107 |  await page.evaluate(()=>{location.hash='/gel';});
  108 |  await page.getByTestId('band-0').click();
  109 |  await expect.poll(async()=>Number(await page.getByTestId('molecular-sim-canvas').getAttribute('data-alive-count'))).toBeGreaterThan(0);
  110 |  await expect(page.getByRole('alert')).toHaveCount(0);expect(errors).toEqual([]);
  111 |  await measure(cycles+1);
  112 | 
  113 |  const report={backend:info.project.name,browser:browser.version(),cycles,elapsedMs:Date.now()-started,baseline,peaks,closedCycleCounts,afterRouteUnmount:0,memory,residentMemory,networkResponseBufferBytes:networkBuffer===undefined?null:Number(networkBuffer),scope:'Explicit buffer/texture and GL object destruction. Optional CDP heap samples follow forced GC; final sample is after route remount. Heap observations are not a driver-memory or release-budget assertion. Optional macOS RSS samples cover processes belonging to this test browser, including its GPU process. RSS includes shared pages/caches and is not isolated driver allocation accounting.'};
  114 |  await writeFile(info.outputPath('resource-lifecycle.json'),JSON.stringify(report,null,2));
  115 |  await info.attach('resource-lifecycle',{body:JSON.stringify(report,null,2),contentType:'application/json'});
  116 |  await heap?.detach();await browserSession?.detach();
  117 |  }finally{await app.close();}
  118 | });
  119 | 
```