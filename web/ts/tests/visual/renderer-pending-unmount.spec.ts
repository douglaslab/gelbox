import {test,expect} from '@playwright/test';
test('retired views ignore graphics modules that finish after route exit',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 const module=backend==='webgl2'?'/src/lib/gpu/gl/meshBatch.ts':'/src/lib/gpu/meshBatch.ts';
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 let release!:()=>void,requested=false;
 const gate=new Promise<void>(r=>release=r);
 await page.route(`**${module}*`,async route=>{requested=true;await gate;await route.continue();});
 await page.addInitScript(backend=>{
  localStorage.setItem('gelBackend',backend);
  (window as any).__retiredProbe={contexts:[],late:0,allocations:0,unconfigured:[]};
  const p=(window as any).__retiredProbe,get=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type:any,opts:any){
   const context=get.call(this,type,opts);
   if(context&&this.dataset.testid){p.contexts.push({canvas:this,context,type});if(!this.isConnected)p.late++;}
   return context;
  } as typeof get;
  if(typeof GPUCanvasContext!=='undefined'){
   const unconfigure=GPUCanvasContext.prototype.unconfigure;
   GPUCanvasContext.prototype.unconfigure=function(){p.unconfigured.push(this);return unconfigure.call(this);};
   for(const key of ['createBuffer','createTexture']){
    const create=(GPUDevice.prototype as any)[key];
    (GPUDevice.prototype as any)[key]=function(...args:any[]){p.allocations++;return create.apply(this,args);};
   }
  }
  for(const key of ['createBuffer','createTexture','createProgram']){
   const create=(WebGL2RenderingContext.prototype as any)[key];
   (WebGL2RenderingContext.prototype as any)[key]=function(...args:any[]){p.allocations++;return create.apply(this,args);};
  }
 },backend);
 try{
  await page.goto('/#/gel');await page.getByTestId('band-0').click();
  await expect.poll(()=>requested).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).__retiredProbe.contexts.length)).toBeGreaterThan(0);
  await page.evaluate(()=>{location.hash='/dev/slider';});
  await expect(page.getByTestId('gel-canvas')).toHaveCount(0);
  await expect(page.getByTestId('molecular-sim-canvas')).toHaveCount(0);
  release();await page.unrouteAll({behavior:'wait'});
  await page.evaluate(async url=>{await import(url);await new Promise(requestAnimationFrame);},module);
  expect(await page.evaluate(()=>{
   const p=(window as any).__retiredProbe;
   return {late:p.late,allocations:p.allocations,retired:p.contexts.every((c:any)=>!c.canvas.isConnected&&(c.type==='webgl2'?c.context.isContextLost():p.unconfigured.includes(c.context)))};
  })).toEqual({late:0,allocations:0,retired:true});
  await page.evaluate(()=>{location.hash='/gel';});await page.getByTestId('band-0').click();
  await expect.poll(async()=>Number(await page.getByTestId('molecular-sim-canvas').getAttribute('data-alive-count'))).toBeGreaterThan(0);
  await expect.poll(()=>page.evaluate(()=>(window as any).__retiredProbe.allocations)).toBeGreaterThan(0);
  await expect(page.getByRole('alert')).toHaveCount(0);expect(errors).toEqual([]);
 }finally{release();await page.unrouteAll({behavior:'wait'});}
});
