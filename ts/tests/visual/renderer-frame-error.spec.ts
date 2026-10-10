import {test,expect} from '@playwright/test';
test('draw exceptions recover without stopping application frames',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/components/sample/SampleSimCanvas.tsx',async route=>{
  const response=await route.fetch();const body=(await response.text()).replace('const store = useGelStore();','const store = useGelStore(); globalThis.__frameStore = store;');
  await route.fulfill({response,body});
 });
 await page.addInitScript(backend=>{
  localStorage.setItem('gelBackend',backend);(window as any).__throwDraw=false;
  const getContext=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type:any,options:any){const c=getContext.call(this,type,options);if(c)this.setAttribute('data-probe-context',type);return c;} as typeof getContext;
  if(backend==='webgpu'){
   const write=GPUQueue.prototype.writeBuffer;
   GPUQueue.prototype.writeBuffer=function(...args){if((window as any).__throwDraw)throw Error('Injected frame upload failure');return write.apply(this,args);};
  }else{
   const upload=WebGL2RenderingContext.prototype.bufferSubData;
   WebGL2RenderingContext.prototype.bufferSubData=function(...args:any[]){if((window as any).__throwDraw)throw Error('Injected frame upload failure');return (upload as any).apply(this,args);};
  }
 },backend);
 await page.goto('/#/gel');await page.getByTestId('band-0').click();
 await expect(page.getByTestId('molecular-sim-canvas')).toHaveAttribute('data-probe-context',backend);
 await page.evaluate(()=>{
  (window as any).__frameCount=0;
  (window as any).__frameStore.subscribeFrame(()=>{(window as any).__frameCount++;});
  (window as any).__throwDraw=true;
 });
 // Editing the timeline also exercises the gel's React-driven render path.
 await page.getByTestId('timeline-slider-icon-lo').click();
 const alternate=backend==='webgpu'?'webgl2':'webgpu';
 for(const id of ['gel-canvas','molecular-sim-canvas'])await expect(page.getByTestId(id)).toHaveAttribute('data-probe-context',alternate);
 await expect.poll(()=>page.evaluate(()=>(window as any).__frameCount)).toBeGreaterThan(15);
 await expect(page.getByTestId('fragment-view')).toBeVisible();
 expect(errors).toEqual([]);
});
