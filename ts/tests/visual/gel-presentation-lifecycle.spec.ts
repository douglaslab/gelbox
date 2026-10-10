import {test,expect,type Page} from '@playwright/test';
test.use({viewport:{width:1365,height:768}});
async function track(page:Page,backend:string,initialFailure=false){
 await page.addInitScript(({backend,initialFailure})=>{
  localStorage.setItem('gelBackend',backend);
  const live=new Map<object,{kind:string,label?:string}>();(window as any).__presentationLive=live;
  (window as any).__failPresentation=initialFailure;(window as any).__failBoth=false;(window as any).__failWellDraw=false;
  const contexts:WebGL2RenderingContext[]=[];(window as any).__presentationGlContexts=contexts;
  const getContext=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type:any,options:any){const context=getContext.call(this,type,options);if(context){this.setAttribute('data-probe-context',type);if(type==='webgl2')contexts.push(context as WebGL2RenderingContext);}return context;} as typeof getContext;
  if(typeof GPUDevice!=='undefined'){
   for(const [create,prototype] of [['createBuffer',GPUBuffer.prototype],['createTexture',GPUTexture.prototype]] as const){
    const original=(GPUDevice.prototype as any)[create];
    (GPUDevice.prototype as any)[create]=function(desc:any){if(create==='createBuffer'&&desc.label==='gel-presentation-band-vertices'&&(window as any).__failBandAllocation&&backend==='webgpu')throw Error('Injected band vertex allocation failure');if(create==='createTexture'&&desc.label==='gel-presentation-msaa'&&(window as any).__failPresentation&&(backend==='webgpu'||(window as any).__failBoth))throw Error('Injected presentation allocation failure');const resource=original.call(this,desc);live.set(resource,{kind:create,label:desc.label});return resource;};
    const destroy=prototype.destroy;prototype.destroy=function(){live.delete(this);return destroy.call(this as any);};
   }
   const pipeline=GPUDevice.prototype.createRenderPipeline;GPUDevice.prototype.createRenderPipeline=function(desc){if((window as any).__failBandShader&&backend==='webgpu'&&desc.label==='gel-presentation-bands')throw Error('Injected band pipeline failure');if((window as any).__failPresentationShader&&backend==='webgpu'&&desc.label==='gel-presentation-base')throw Error('Injected presentation pipeline failure');return pipeline.call(this,desc);};
   const upload=GPUQueue.prototype.writeBuffer;GPUQueue.prototype.writeBuffer=function(...args){if((window as any).__failWellDraw&&(backend==='webgpu'||(window as any).__failBoth)&&live.get(args[0])?.label==='gel-presentation-wells')throw Error('Injected well draw failure');return upload.apply(this,args);};
  }
  const p=WebGL2RenderingContext.prototype as any;
  for(const kind of ['Buffer','Texture','Framebuffer','Renderbuffer','Program','Shader','VertexArray']){const create=p['create'+kind],destroy=p['delete'+kind];p['create'+kind]=function(...args:any[]){const resource=create.apply(this,args);if(resource)live.set(resource,{kind});return resource;};p['delete'+kind]=function(resource:any){live.delete(resource);return destroy.call(this,resource);};}
  const badShaders=new WeakSet<WebGLShader>(),bandShaders=new WeakSet<WebGLShader>();const source=p.shaderSource,compile=p.compileShader;p.shaderSource=function(shader:WebGLShader,text:string){if(text.includes('in vec4 tint'))bandShaders.add(shader);if(text.includes('uniform sampler2D base'))badShaders.add(shader);return source.call(this,shader,text);};p.compileShader=function(shader:WebGLShader){if((window as any).__failBandShader&&backend==='webgl2'&&bandShaders.has(shader))throw Error('Injected band shader failure');if((window as any).__failPresentationShader&&backend==='webgl2'&&badShaders.has(shader))throw Error('Injected presentation shader failure');return compile.call(this,shader);};
  const uploadBands=p.bufferSubData;p.bufferSubData=function(...args:any[]){if((window as any).__failBandAllocation&&backend==='webgl2'&&args[2]?.length>=36)throw Error('Injected band vertex upload failure');return uploadBands.apply(this,args);};
  const storage=p.renderbufferStorageMultisample;p.renderbufferStorageMultisample=function(...args:any[]){if((window as any).__failPresentation&&(backend==='webgl2'||(window as any).__failBoth))throw Error('Injected presentation allocation failure');return storage.apply(this,args);};
  const draw=p.drawArrays;p.drawArrays=function(...args:any[]){if((window as any).__failWellDraw&&(backend==='webgl2'||(window as any).__failBoth)&&args[0]===this.LINE_STRIP)throw Error('Injected well draw failure');return draw.apply(this,args);};
 },{backend,initialFailure});
}
async function unmountAndCheck(page:Page){await page.evaluate(()=>{location.hash='/dev/slider';});await expect(page.getByTestId('gel-canvas')).toHaveCount(0);await expect.poll(()=>page.evaluate(()=>[...(window as any).__presentationLive.values()])).toEqual([]);await expect.poll(()=>page.evaluate(()=>(window as any).__presentationGlContexts.every((gl:WebGL2RenderingContext)=>gl.isContextLost()))).toBe(true);}
for(const mode of ['effects','direct'])test(`presentation allocation failure recovers and cleans up in ${mode} mode`,async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await track(page,backend,mode==='effects');await page.goto('/#/gel');
 if(mode==='direct'){await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',backend);await page.evaluate(()=>{(window as any).__failPresentation=true;});await page.keyboard.press('Meta+r');}
 await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode',mode);
 await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',backend==='webgpu'?'webgl2':'webgpu');
 await expect(page.getByRole('alert')).toHaveCount(0);await page.getByTestId('gel-canvas').screenshot();await unmountAndCheck(page);expect(errors).toEqual([]);
});
test('direct mode contains well draw failures and recovers',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await track(page,backend);await page.goto('/#/gel');await page.keyboard.press('Meta+r');
 await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',backend);await page.getByTestId('gel-canvas').screenshot();
 await page.evaluate(()=>{(window as any).__failWellDraw=true;});await page.getByTestId('timeline-slider-icon-lo').click();
 await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',backend==='webgpu'?'webgl2':'webgpu');await unmountAndCheck(page);expect(errors).toEqual([]);
});
test('direct mode shows bounded failure and supports retry when both presentations fail',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';await track(page,backend);await page.goto('/#/gel');await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',backend);
 await page.evaluate(()=>{(window as any).__failPresentation=true;(window as any).__failBoth=true;});await page.keyboard.press('Meta+r');
 const error=page.getByTestId('gel-canvas-error');await expect(error).toBeVisible();await expect.poll(()=>page.evaluate(()=>(window as any).__presentationLive.size)).toBe(0);await page.evaluate(()=>{(window as any).__failPresentation=false;});await error.getByRole('button',{name:'Retry graphics'}).click();await expect(error).toHaveCount(0);await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',backend);await unmountAndCheck(page);
});
test('mode and DPR changes return to stable resource counts and unmount to zero',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';await track(page,backend);await page.goto('/#/gel');const cdp=await page.context().newCDPSession(page);const baselines=new Map<string,number>();
 for(let cycle=0;cycle<4;cycle++)for(const mode of ['effects','direct']){
  await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode',mode);
  for(const dpr of [1,2]){await cdp.send('Emulation.setDeviceMetricsOverride',{width:1365,height:768,deviceScaleFactor:dpr,mobile:false});await expect(page.getByTestId('gel-canvas')).toHaveAttribute('width',String(390*dpr));await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',backend);await page.getByTestId('gel-canvas').screenshot();const key=mode+dpr;if(cycle===0)baselines.set(key,await page.evaluate(()=>(window as any).__presentationLive.size));else await expect.poll(()=>page.evaluate(()=>(window as any).__presentationLive.size)).toBe(baselines.get(key));}
  await page.keyboard.press('Meta+r');
 }
 await unmountAndCheck(page);await cdp.detach();
});
for(const mode of ['effects','direct'])test(`late presentation import after ${mode} route exit allocates no resources`,async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';await track(page,backend);
 let release!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;});let requested=false;
 await page.route(`**/src/lib/gel/present${backend==='webgl2'?'-gl':''}.ts`,async route=>{requested=true;const response=await route.fetch();await held;await route.fulfill({response});});
 await page.goto('/#/gel');await expect.poll(()=>requested).toBe(true);
 if(mode==='direct'){await page.keyboard.press('Meta+r');await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode','direct');}
 await unmountAndCheck(page);release();await page.unrouteAll({behavior:'wait'});await expect.poll(()=>page.evaluate(()=>(window as any).__presentationLive.size)).toBe(0);
 await page.evaluate(()=>{location.hash='/gel';});await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',backend);await page.getByTestId('gel-canvas').screenshot();await expect.poll(()=>page.evaluate(()=>(window as any).__presentationLive.size)).toBeGreaterThan(0);await unmountAndCheck(page);
});

test('presentation pipeline failure releases partial shaders and recovers',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';await track(page,backend);await page.goto('/#/gel');await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',backend);
 await page.evaluate(()=>{(window as any).__failPresentationShader=true;});await page.keyboard.press('Meta+r');
 await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',backend==='webgpu'?'webgl2':'webgpu');await unmountAndCheck(page);
});

for(const failure of ['allocation','frame'])test(`effects terminal ${failure} failure releases resources before retry`,async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';await track(page,backend);
 if(failure==='allocation')await page.addInitScript(()=>{(window as any).__failPresentation=true;(window as any).__failBoth=true;});
 await page.goto('/#/gel');
 if(failure==='frame'){
  await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',backend);await page.getByTestId('gel-canvas').screenshot();
  await page.evaluate(()=>{(window as any).__failWellDraw=true;(window as any).__failBoth=true;});await page.getByTestId('timeline-slider-icon-lo').click();
 }
 const error=page.getByTestId('gel-canvas-error');await expect(error).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>[...(window as any).__presentationLive.values()])).toEqual([]);
 await expect.poll(()=>page.evaluate(()=>(window as any).__presentationGlContexts.every((gl:WebGL2RenderingContext)=>gl.isContextLost()))).toBe(true);
 await page.evaluate(()=>{(window as any).__failPresentation=false;(window as any).__failWellDraw=false;});
 await error.getByRole('button',{name:'Retry graphics'}).click();await expect(error).toHaveCount(0);
 await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',backend);await page.getByTestId('gel-canvas').screenshot();await unmountAndCheck(page);
});

for(const failure of ['Shader','Allocation'])test(`direct band ${failure} failure retires partial presentation resources`,async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';await track(page,backend);await page.goto('/#/gel');
 await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',backend);await page.getByTestId('gel-canvas').screenshot();
 await page.evaluate(failure=>{(window as any)['__failBand'+failure]=true;},failure);await page.keyboard.press('Meta+r');
 await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-probe-context',backend==='webgpu'?'webgl2':'webgpu');
 await expect(page.getByRole('alert')).toHaveCount(0);await page.getByTestId('gel-canvas').screenshot();await unmountAndCheck(page);
});
