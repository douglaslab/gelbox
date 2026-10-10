import {test,expect,type Page} from '@playwright/test';
async function setup(page:Page,backend:string){
 await page.route('**/src/components/sample/SampleSimCanvas.tsx',async route=>{
  const response=await route.fetch(),source=await response.text();
  const patched=source.replace('const sim = view.sim;',`const sim = view.sim;
   globalThis.__sharedViews ??= new Map();globalThis.__sharedViews.set(viewKey,view);`);
  expect(patched).not.toBe(source);await route.fulfill({response,body:patched});
 });
 await page.addInitScript(backend=>{
  localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');
  (window as any).__molsimFreezeAfterTicks=30;
  (window as any).__sharedLive=new Map();(window as any).__sharedDevices=[];(window as any).__sharedFail=false;
  const live=(window as any).__sharedLive as Map<object,string>;
  const getContext=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type:any,options:any){const result=getContext.call(this,type,options);if(result&&this.dataset.testid==='shared-scene'){this.dataset.context=type;(window as any).__sharedContext=result;}return result;} as any;
  const request=GPUAdapter.prototype.requestDevice;
  GPUAdapter.prototype.requestDevice=async function(...args){const device=await request.apply(this,args);(window as any).__sharedDevices.push(device);return device;};
  for(const kind of ['Buffer','Texture']){
   const proto=GPUDevice.prototype as any,create=proto['create'+kind];
   proto['create'+kind]=function(desc:any){
    // Distinguish this owner from the still-separate gel presentation on the same device.
    const shared=/\/(ScenePresentation|SharedGelCanvas)\.tsx/.test(new Error().stack??'');
    if(shared&&kind==='Buffer'&&(window as any).__sharedFail)throw Error('injected shared buffer failure');
    const resource=create.call(this,desc);
    if(shared){live.set(resource,'gpu-'+kind);const destroy=resource.destroy.bind(resource);resource.destroy=()=>{live.delete(resource);destroy();};}
    return resource;
   };
  }
  for(const kind of ['Buffer','Texture','Renderbuffer','Framebuffer','VertexArray','Shader','Program','Sampler']){
   const proto=WebGL2RenderingContext.prototype as any,create=proto['create'+kind],remove=proto['delete'+kind];
   proto['create'+kind]=function(...args:any[]){
    const shared=this.canvas.dataset.testid==='shared-scene';
    if(shared&&kind==='Buffer'&&(window as any).__sharedFail)return null;
    const resource=create.apply(this,args);if(shared&&resource)live.set(resource,'gl-'+kind);return resource;
   };
   proto['delete'+kind]=function(resource:any){live.delete(resource);return remove.call(this,resource);};
  }
 },backend);
 await page.setViewportSize({width:1365,height:768});await page.goto('/#/gel');await page.getByTestId('band-0').click();await page.mouse.move(0,0);
 await expect(page.getByTestId('shared-scene')).toHaveAttribute('data-view-keys',/inspector-fragment/);
 await expect(page.getByTestId('molecular-sim-canvas')).toHaveAttribute('data-frozen','1');
 await page.evaluate(()=>{
  const view=(window as any).__sharedViews.get('sample');(window as any).__savedSharedView=view;
  (window as any).__savedSharedState=JSON.stringify({parts:view.sim.parts,ticks:view.ticks,seed:view.sim.seed});
 });
}
const count=(page:Page)=>page.evaluate(()=>(window as any).__sharedLive.size as number);
async function unchanged(page:Page){
 expect(await page.evaluate(()=>{const view=(window as any).__sharedViews.get('sample');return view===(window as any).__savedSharedView&&JSON.stringify({parts:view.sim.parts,ticks:view.ticks,seed:view.sim.seed})===(window as any).__savedSharedState;})).toBe(true);
}

test('shared scene survives repeated device/context loss and resize with bounded live resources',async({page},info)=>{
 test.setTimeout(60000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 let backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';await setup(page,backend);
 const scene=page.getByTestId('shared-scene'),sample=page.getByTestId('sample-frame');
 const before=await page.screenshot({clip:(await sample.boundingBox())!});
 const counts=new Map<string,number>();
 for(let cycle=0;cycle<4;cycle++){
  await expect(scene).toHaveAttribute('data-context',backend);
  const active=await count(page);expect(active).toBeGreaterThan(0);
  if(counts.has(backend))expect(active).toBe(counts.get(backend));else counts.set(backend,active);
  const node=await scene.elementHandle();
  await page.evaluate(backend=>{
   if(backend==='webgpu')for(const device of (window as any).__sharedDevices)device.destroy();
   else (window as any).__sharedContext.getExtension('WEBGL_lose_context').loseContext();
  },backend);
  backend=backend==='webgpu'?'webgl2':'webgpu';
  await expect(scene).toHaveAttribute('data-context',backend);await expect(scene).toHaveAttribute('data-view-keys',/inspector-fragment/);
  expect(await node!.evaluate(el=>el.isConnected)).toBe(false);
  expect((await page.screenshot({clip:(await sample.boundingBox())!})).equals(before)).toBe(true);
  await unchanged(page);
 }
 const stable=await count(page);
 for(let i=0;i<4;i++){
  await page.setViewportSize({width:1200+i,height:710+i});await expect(scene).toHaveAttribute('width',String(1200+i));
  await expect.poll(()=>count(page)).toBe(stable);await unchanged(page);
 }
 await page.evaluate(()=>{location.hash='/dev';});await expect(scene).toHaveCount(0);
 await expect.poll(()=>count(page)).toBe(0);expect(errors).toEqual([]);
});

test('shared draw allocation failures retire resources and retry preserves the live engine',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';await setup(page,backend);
 expect(await count(page)).toBeGreaterThan(0);
 await page.evaluate(()=>{(window as any).__sharedFail=true;});await page.setViewportSize({width:1366,height:768});
 await expect(page.getByTestId('shared-scene-error')).toBeVisible();await expect.poll(()=>count(page)).toBe(0);
 await unchanged(page);
 await page.evaluate(()=>{(window as any).__sharedFail=false;});await page.getByRole('button',{name:'Retry graphics'}).click();
 await expect(page.getByTestId('shared-scene-error')).toHaveCount(0);
 await expect(page.getByTestId('shared-scene')).toHaveAttribute('data-view-keys',/inspector-fragment/);
 expect(await count(page)).toBeGreaterThan(0);await unchanged(page);
 await page.evaluate(()=>{location.hash='/dev';});await expect(page.getByTestId('shared-scene')).toHaveCount(0);
 await expect.poll(()=>count(page)).toBe(0);
});

test('shared device acquisition finishing after route removal does not configure a retired canvas',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('gelBackend','webgpu');localStorage.setItem('gelSharedPresentation','1');
  (window as any).__sharedLateContexts=0;
  const request=GPUAdapter.prototype.requestDevice;
  GPUAdapter.prototype.requestDevice=async function(...args){
   const device=await request.apply(this,args);
   await new Promise<void>(resolve=>{(window as any).__releaseSharedDevice=resolve;});return device;
  };
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(...args:any[]){
   if(this.dataset.testid==='shared-scene')(window as any).__sharedLateContexts++;
   return original.apply(this,args as any);
  } as any;
 });
 await page.goto('/#/gel');await expect.poll(()=>page.evaluate(()=>typeof (window as any).__releaseSharedDevice)).toBe('function');
 await page.evaluate(()=>{location.hash='/dev';});await expect(page.getByTestId('shared-scene')).toHaveCount(0);
 await page.evaluate(async()=>{(window as any).__releaseSharedDevice();const {requestDevice}=await import('/src/lib/gpu/device.ts');await requestDevice();await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));});
 expect(await page.evaluate(()=>(window as any).__sharedLateContexts)).toBe(0);
});
