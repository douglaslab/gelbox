# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: webkit-visibility.spec.ts >> retained views resume after WebKit engine activity changes
- Location: ../../../../../../../private/tmp/gel-browser-compat-1.64/release-profile-lifecycle/lifecycle/webkit-visibility.spec.ts:6:5

# Error details

```
TypeError: page._toImpl is not a function
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Application settings" [ref=e5] [cursor=pointer]
  - link "Help" [ref=e6]:
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
      - generic [ref=e36] [cursor=pointer]
      - button "Toggle gel settings" [ref=e38] [cursor=pointer]
      - generic [ref=e39]: 3:00
    - generic [ref=e47]:
      - button "New species" [ref=e48] [cursor=pointer]
      - generic:
        - heading "Sample" [level=2]
      - generic [ref=e51] [cursor=pointer]
    - generic [ref=e54]:
      - generic:
        - heading "Species" [level=2]
      - generic [ref=e58]:
        - 'button "Color 1: #0066cc" [ref=e59] [cursor=pointer]'
        - 'button "Color 2: #cc0000" [ref=e61] [cursor=pointer]'
        - 'button "Color 3: #f74308" [ref=e63] [cursor=pointer]'
        - 'button "Color 4: #f7931e" [ref=e65] [cursor=pointer]'
        - 'button "Color 5: #aaaa00" [ref=e67] [cursor=pointer]'
        - 'button "Color 6: #57bb00" [ref=e69] [cursor=pointer]'
        - 'button "Color 7: #007200" [ref=e71] [cursor=pointer]'
        - 'button "Color 8: #03b6a2" [ref=e73] [cursor=pointer]'
        - 'button "Color 9: #1700de" [ref=e75] [cursor=pointer]'
        - 'button "Color 10: #7300de" [ref=e77] [cursor=pointer]'
        - 'button "Color 11: #b8056c" [ref=e79] [cursor=pointer]'
        - 'button "Color 12: #333333" [pressed] [ref=e81] [cursor=pointer]'
      - generic [ref=e83]:
        - generic [ref=e84]: 10,000 bp
        - generic [ref=e90]: 42 ng
        - generic [ref=e96]: "1 : 1"
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import {readFile,writeFile} from 'node:fs/promises';
  3  | import {createHash} from 'node:crypto';
  4  | import {serveBuiltApp} from '../production/built-app';
  5  | test.use({viewport:{width:1365,height:768},headless:false});
  6  | test('retained views resume after WebKit engine activity changes',async({page,browser},info)=>{
  7  |  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  8  |  await page.addInitScript(b=>{
  9  |   localStorage.setItem('gelBackend',b);
  10 |   (window as any).__lifecycleEvents=[];
  11 |   (window as any).__visibilityEvents=[];
  12 |   document.addEventListener('visibilitychange',()=>{(window as any).__visibilityEvents.push(document.visibilityState);});
  13 |   for(const name of ['freeze','resume'])document.addEventListener(name,()=>{(window as any).__lifecycleEvents.push(name);});
  14 |  },info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  15 |  const app=await serveBuiltApp();
  16 |  try{
  17 |  await page.goto(`${app.url}#/gel`);await page.getByTestId('band-0').click();
  18 |  await expect(page.getByTestId('molecular-sim-canvas')).toHaveAttribute('data-shared-ready','1');
  19 |  await page.getByTestId('molecular-sim-canvas').evaluate(canvas=>{
  20 |   const key=Object.keys(canvas).find(k=>k.startsWith('__reactFiber$'));if(!key)throw Error('Missing React18 DOM fiber');
  21 |   let store:any,registry:any;
  22 |   for(let fiber=(canvas as any)[key];fiber;fiber=fiber.return){const value=fiber.memoizedProps?.value;if(value&&typeof value.getMolecularView==='function')store=value;if(value&&typeof value.getGraphics==='function')registry=value;}
  23 |   if(!store||!registry)throw Error('Missing production providers');
  24 |   if(registry.getGraphics()?.backend!==localStorage.getItem('gelBackend'))throw Error('Unexpected graphics backend');
  25 |   (window as any).__resumeStore=store;
  26 |  });
  27 |  const band=(await page.getByTestId('band-0').boundingBox())!;
  28 |  await page.keyboard.down('Meta');await page.mouse.click(band.x+band.width/2,band.y+band.height/2);await page.keyboard.up('Meta');await page.mouse.move(1300,50);
  29 |  const ids=['molecular-sim-canvas','loupe-canvas-1'];
  30 |  for(const id of ids)await expect.poll(async()=>Number(await page.getByTestId(id).getAttribute('data-alive-count'))).toBeGreaterThan(0);
  31 |  const save=async()=>{
  32 |   const settings=page.getByRole('button',{name:'Application settings'});await settings.click();
  33 |   const promise=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
  34 |   const data=await readFile((await (await promise).path())!,'utf8');
  35 |   if(await settings.getAttribute('aria-expanded')==='true')await settings.click();
  36 |   return JSON.parse(data);
  37 |  };
  38 |  const before=await save();
  39 |  await page.evaluate(()=>{
  40 |   (window as any).__resumeFrames=0;(window as any).__resumeStore.subscribeFrame(()=>{(window as any).__resumeFrames++;});
  41 |   (window as any).__savedResumeViews=['sample','loupe-1'].map(k=>{const v=(window as any).__resumeStore.getMolecularView(k);if(!v?.alive)throw Error('Missing retained view '+k);return [k,v];});
  42 |  });
  43 |  await expect.poll(()=>page.evaluate(()=>(window as any).__resumeFrames)).toBeGreaterThan(5);
  44 |  // WebKit protocol controls the browser engine's activity/visibility state.
  45 |  // This is not an OS sleep or physical tab-switch test.
> 46 |  const proxy=(page as any)._toImpl()._delegate._pageProxySession;
     |                            ^ TypeError: page._toImpl is not a function
  47 |  if(typeof proxy?.send!=='function')throw Error('Pinned WebKit page proxy unavailable');
  48 |  const cycles:any[]=[];
  49 |  try{
  50 |   for(let i=0;i<2;i++){
  51 |    await proxy.send('Emulation.setActiveAndFocused',{active:false});
  52 |    await expect.poll(()=>page.evaluate(()=>document.visibilityState)).toBe('hidden');
  53 | 
  54 |    const hiddenStart=await page.evaluate(()=>(window as any).__resumeFrames);
  55 |    await page.waitForTimeout(1000);
  56 |    const hiddenEnd=await page.evaluate(()=>(window as any).__resumeFrames);
  57 |    expect(hiddenEnd,'application frames pause while WebKit is inactive').toBe(hiddenStart);
  58 |    await proxy.send('Emulation.setActiveAndFocused',{active:true});
  59 |    await expect.poll(()=>page.evaluate(()=>document.visibilityState)).toBe('visible');
  60 |    await expect.poll(()=>page.evaluate(()=>(window as any).__resumeFrames)).toBeGreaterThan(hiddenEnd+10);
  61 |    cycles.push({cycle:i,hiddenStart,hiddenEnd,resumed:await page.evaluate(()=>(window as any).__resumeFrames)});
  62 |    expect(await page.evaluate(()=>(window as any).__savedResumeViews.every(([k,v]:any)=>v.alive&&(window as any).__resumeStore.getMolecularView(k)===v))).toBe(true);
  63 |   }
  64 |  }finally{await proxy.send('Emulation.setActiveAndFocused',{active:true});}
  65 |  const visibility=await page.evaluate(()=>(window as any).__visibilityEvents as string[]);
  66 |  expect(visibility.filter(v=>v==='hidden').length).toBeGreaterThanOrEqual(2);
  67 |  expect(visibility.filter(v=>v==='visible').length).toBeGreaterThanOrEqual(2);
  68 |  for(const id of ids)await expect.poll(async()=>{
  69 |   const png=await page.getByTestId(id).screenshot();
  70 |   return page.evaluate(async bytes=>{
  71 |    const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
  72 |    const canvas=new OffscreenCanvas(image.width,image.height),ctx=canvas.getContext('2d')!;
  73 |    ctx.drawImage(image,0,0);image.close();const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  74 |    // Exclude panel edges/shadow so chrome alone cannot satisfy particle visibility.
  75 |    let dark=0;const margin=24;for(let y=margin;y<canvas.height-margin;y++)for(let x=margin;x<canvas.width-margin;x++){const i=(y*canvas.width+x)*4;if(data[i]<150&&data[i+1]<150&&data[i+2]<150)dark++;}
  76 |    return dark;
  77 |   },[...png]);
  78 |  }).toBeGreaterThan(20);
  79 |  const sample=page.getByTestId('molecular-sim-canvas'),paintBefore=await sample.screenshot();
  80 |  const paintFrame=await page.evaluate(()=>(window as any).__resumeFrames);
  81 |  await expect.poll(()=>page.evaluate(()=>(window as any).__resumeFrames)).toBeGreaterThan(paintFrame+10);
  82 |  const paintAfter=await sample.screenshot();
  83 |  expect(paintAfter.equals(paintBefore),'sample particles must continue painting after resume').toBe(false);
  84 |  const resumedPaint={before:createHash('sha256').update(paintBefore).digest('hex'),after:createHash('sha256').update(paintAfter).digest('hex')};
  85 |  await writeFile(info.outputPath('resumed-before.png'),paintBefore);await writeFile(info.outputPath('resumed-after.png'),paintAfter);
  86 |  expect(await save()).toEqual(before);expect(errors).toEqual([]);
  87 |  await expect(page.getByRole('alert')).toHaveCount(0);
  88 |  await writeFile(info.outputPath('resume.json'),JSON.stringify({backend:info.project.name,browser:browser.version(),resumedPaint,cycles,events:await page.evaluate(()=>(window as any).__lifecycleEvents),visibilityEvents:await page.evaluate(()=>(window as any).__visibilityEvents)},null,2));
  89 |  }finally{await app.close();}
  90 | });
  91 | 
```