import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const percentile=(a:number[],p:number)=>{const sorted=[...a].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];};
test('measure built gel with fifty bands, sample and three loupes',async({page,browser},info)=>{
 const server=createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url!,'http://localhost').pathname),file=path.resolve('dist','.'+pathname+(pathname==='/'?'index.html':''));
  try{const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'} as any)[path.extname(file)]??'application/octet-stream');res.end(data);}catch{res.writeHead(404).end();}
 });
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 try{
  const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(backend=>{
   localStorage.setItem('gelBackend',backend);
   const live=new Set<object>();(window as any).__appPerf={live,frames:[],record:false};
   const perf=(window as any).__appPerf,raf=window.requestAnimationFrame;
   window.requestAnimationFrame=cb=>raf.call(window,t=>{const start=performance.now();try{cb(t);}finally{if(perf.record)perf.frames.push([t,performance.now()-start]);}});
   if(typeof GPUDevice!=='undefined')for(const [key,prototype] of [['createBuffer',GPUBuffer.prototype],['createTexture',GPUTexture.prototype]] as const){
    const create=(GPUDevice.prototype as any)[key],destroy=prototype.destroy;
    (GPUDevice.prototype as any)[key]=function(...args:any[]){const v=create.apply(this,args);live.add(v);return v;};
    prototype.destroy=function(){live.delete(this);return destroy.call(this as any);};
   }
   for(const kind of ['Buffer','Texture','Framebuffer','Program','Shader','VertexArray']){
    const p=WebGL2RenderingContext.prototype as any,create=p['create'+kind],destroy=p['delete'+kind];
    p['create'+kind]=function(...args:any[]){const v=create.apply(this,args);if(v)live.add(v);return v;};
    p['delete'+kind]=function(v:any){live.delete(v);return destroy.call(this,v);};
   }
   const get=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type:any,opts:any){const c=get.call(this,type,opts);if(c)this.setAttribute('data-context',type);return c;} as typeof get;
  },backend);
  await page.goto(`http://127.0.0.1:${(server.address() as any).port}/#/gel`);
  const fixture=await readFile('../reference/web/performance/five-ladders.gel.json');
  await page.getByRole('button',{name:'Application settings'}).click();
  await page.getByTestId('file-input').setInputFiles({name:'five-ladders.json',mimeType:'application/json',buffer:fixture});
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(50);
  await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-context',backend);
  await page.getByTestId('band-0').click();
  for(const index of [0,5,9]){
   const band=(await page.getByTestId(`band-${index}`).boundingBox())!;
   await page.keyboard.down('Meta');await page.mouse.click(band.x+band.width/2,band.y+band.height/2);await page.keyboard.up('Meta');await page.mouse.move(1300,50);
  }
  await expect(page.locator('[data-loupe-id]')).toHaveCount(3);
  const canvases=page.locator('[data-testid="molecular-sim-canvas"],[data-testid^="loupe-canvas-"]');
  await expect(canvases).toHaveCount(4);
  for(const c of await canvases.all()){await expect(c).toHaveAttribute('data-context',backend);await expect.poll(async()=>Number(await c.getAttribute('data-alive-count'))).toBeGreaterThan(0);}
  await page.waitForTimeout(3000);
  const snapshot=()=>page.evaluate(()=>({resources:(window as any).__appPerf.live.size,particles:[...document.querySelectorAll('[data-alive-count]')].map(c=>({view:c.getAttribute('data-testid'),count:Number(c.getAttribute('data-alive-count'))}))}));
  const baseline=await snapshot(),windows=[];
  for(let i=0;i<2;i++){
   await page.evaluate(()=>{(window as any).__appPerf.frames=[];(window as any).__appPerf.record=true;});
   await page.waitForTimeout(10000);
   const frames:number[][]=await page.evaluate(()=>{(window as any).__appPerf.record=false;return (window as any).__appPerf.frames;});
   const stamps=[...new Set(frames.map(f=>f[0]))],intervals=stamps.slice(1).map((t,i)=>t-stamps[i]);
   expect(intervals.length).toBeGreaterThan(100);
   windows.push({samples:intervals.length,intervalMs:{p50:percentile(intervals,.5),p95:percentile(intervals,.95),p99:percentile(intervals,.99),max:Math.max(...intervals)},callbackCpuMs:{p50:percentile(frames.map(f=>f[1]),.5),p95:percentile(frames.map(f=>f[1]),.95)},end:await snapshot()});
  }
  const track=(await page.getByTestId('timeline-slider-track').boundingBox())!,handle=(await page.getByTestId('timeline-slider-handle').boundingBox())!;
  await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);
  const started=await page.evaluate(()=>{(window as any).__appPerf.frames=[];(window as any).__appPerf.record=true;return performance.now();});
  await page.mouse.down();
  await page.mouse.move(track.x+track.width*.1,handle.y+handle.height/2,{steps:30});
  await expect(page.getByTestId('timeline-slider')).toContainText('0:18');
  await page.mouse.move(track.x+track.width,handle.y+handle.height/2,{steps:30});
  await page.mouse.up();
  await expect(page.getByTestId('timeline-slider')).toContainText('3:00');
  await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
  const drag=await page.evaluate(()=>{(window as any).__appPerf.record=false;return {end:performance.now(),frames:(window as any).__appPerf.frames as number[][]};});
  const dragStamps=[...new Set(drag.frames.map(f=>f[0]))],dragIntervals=dragStamps.slice(1).map((t,i)=>t-dragStamps[i]);
  expect(dragIntervals.length).toBeGreaterThan(5);
  const interaction={pointerMoves:60,controllerInclusiveMs:drag.end-started,frameSamples:dragIntervals.length,intervalMs:{p50:percentile(dragIntervals,.5),p95:percentile(dragIntervals,.95),p99:percentile(dragIntervals,.99),max:Math.max(...dragIntervals)},end:await snapshot()};
  await expect(page.locator('[data-loupe-id]')).toHaveCount(3);
  expect(errors).toEqual([]);await expect(page.getByRole('alert')).toHaveCount(0);
  const report={recordedAt:new Date().toISOString(),backend,browser:browser.version(),productCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),os:execFileSync('sw_vers',['-productVersion'],{encoding:'utf8'}).trim(),hardware:execFileSync('sysctl',['-n','hw.model','machdep.cpu.brand_string'],{encoding:'utf8'}).trim(),fixtureSha256:createHash('sha256').update(fixture).digest('hex'),viewport:{width:1365,height:768,dpr:2},warmupSeconds:3,windowSeconds:10,baseline,windows,interaction,limitations:'Steady windows use a static gel and moving molecular views; interaction drags the timeline through 60 pointer moves. Controller-inclusive gesture timing is not input-to-photon latency. rAF intervals and callback CPU time, not GPU timestamps or presentation latency. Instrumented resource-object counts, not resident memory. No native performance comparison or release threshold.'};
  await writeFile(info.outputPath('application-performance.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
