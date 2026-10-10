import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {serveBuiltApp} from './built-app';

for(const failure of ['loss','allocation'] as const)test(`compiled buffer/loupe/resize workflow survives ${failure}`,async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/'),errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 const initial=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 try{
  await page.addInitScript(backend=>{
   localStorage.setItem('gelBackend',backend);
   const w=window as any;w.__recoveryDevices=[];w.__recoveryFail=false;
   const request=GPUAdapter.prototype.requestDevice;
   GPUAdapter.prototype.requestDevice=async function(...args){const d=await request.apply(this,args);w.__recoveryDevices.push(d);return d;};
   const gpuCreate=GPUDevice.prototype.createBuffer;
   GPUDevice.prototype.createBuffer=function(desc){if(w.__recoveryFail)throw Error('Injected allocation failure');return gpuCreate.call(this,desc);};
   const glCreate=WebGL2RenderingContext.prototype.createBuffer;
   WebGL2RenderingContext.prototype.createBuffer=function(){if(w.__recoveryFail)return null;return glCreate.call(this);};
   const get=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type:any,opts:any){const c=get.call(this,type,opts);if(c&&this.dataset.testid==='shared-scene'){this.dataset.context=type;w.__recoveryContext=c;}return c;} as any;
  },initial);
  await page.goto(`${app.url}#/gel`);
  const scene=page.getByTestId('shared-scene');await expect(scene).toHaveAttribute('data-context',initial);
  const b=(await page.getByTestId('band-0').boundingBox())!;
  await page.keyboard.down('Meta');await page.mouse.click(b.x+b.width/2,b.y+b.height/2);await page.keyboard.up('Meta');
  const loupe=page.getByTestId('loupe-canvas-1');await expect(loupe).toHaveAttribute('data-shared-ready','1');
  await page.getByTestId('settings-button').click();
  await page.getByRole('button',{name:'H2O',exact:true}).click();
  await expect(page.getByTestId('gel-buffer-view').getByText('0.0 mM',{exact:true})).toHaveCount(4);
  await page.getByRole('button',{name:'.5x TBE',exact:true}).click();
  await page.getByTestId('settings-button').click();
  // Pick a different band so the loupe anchor cannot intercept the selection.
  await page.getByTestId('band-1').click();await page.mouse.move(1300,30);
  const sample=page.getByTestId('molecular-sim-canvas');await expect(sample).toHaveAttribute('data-shared-ready','1');
  for(const canvas of [sample,loupe])await expect.poll(async()=>Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
  await sample.evaluate(canvas=>{
   const key=Object.keys(canvas).find(k=>k.startsWith('__reactFiber$'))!;let store:any;
   for(let fiber=(canvas as any)[key];fiber;fiber=fiber.return){const v=fiber.memoizedProps?.value;if(typeof v?.getMolecularView==='function')store=v;}
   if(!store)throw Error('Missing production store');
   const w=window as any;w.__recoveryStore=store;w.__recoveryFrames=0;
   store.subscribeFrame(()=>w.__recoveryFrames++);
   w.__recoveryViews=['sample','loupe-1'].map(k=>[k,store.getMolecularView(k)]);
   if(w.__recoveryViews.some(([,v]:any)=>!v?.alive))throw Error('Missing live view');
   const state=store.getSnapshot().gel;
   w.__recoverySelection=state.selection;w.__recoverySamples=state.samples;
   w.__recoveryLoupes=JSON.stringify(state.loupes);
  });
  const save=async()=>{
   const menu=page.getByRole('button',{name:'Application settings'});await menu.click();
   const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
   const doc=JSON.parse(await readFile((await(await pending).path())!,'utf8'));await expect(menu).toHaveAttribute('aria-expanded','false');return doc;
  };
  const before=await save();await page.mouse.move(1300,30);
  const gelPaint=await page.getByTestId('gel-overlay').screenshot();
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1465,height:868,deviceScaleFactor:1,mobile:false});
  await expect(scene).toHaveAttribute('width','1465');
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1365,height:768,deviceScaleFactor:2,mobile:false});
  await expect(scene).toHaveAttribute('width','2730');
  const old=await scene.elementHandle();
  await page.evaluate(({failure,initial})=>{
   const w=window as any;
   if(failure==='allocation')w.__recoveryFail=true;
   else if(initial==='webgpu')w.__recoveryDevices.forEach((d:any)=>d.destroy());
   else w.__recoveryContext.getExtension('WEBGL_lose_context').loseContext();
  },{failure,initial});
  if(failure==='allocation'){
   await cdp.send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:2,mobile:false});
   await expect(page.getByTestId('shared-scene-error')).toBeVisible();
   await page.evaluate(()=>{(window as any).__recoveryFail=false;});
   await page.getByRole('button',{name:'Retry graphics'}).click();
   await expect(page.getByTestId('shared-scene-error')).toHaveCount(0);
  }else await expect(scene).toHaveAttribute('data-context',initial==='webgpu'?'webgl2':'webgpu');
  await expect(sample).toHaveAttribute('data-shared-ready','1');await expect(loupe).toHaveAttribute('data-shared-ready','1');
  expect(await old!.evaluate(el=>el.isConnected)).toBe(false);
  expect(await page.evaluate(()=>{
   const w=window as any,s=w.__recoveryStore.getSnapshot().gel;
   return w.__recoveryViews.every(([k,v]:any)=>v.alive&&w.__recoveryStore.getMolecularView(k)===v)&&s.selection===w.__recoverySelection&&s.samples===w.__recoverySamples&&JSON.stringify(s.loupes)===w.__recoveryLoupes;
  })).toBe(true);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1365,height:768,deviceScaleFactor:2,mobile:false});
  await expect(scene).toHaveAttribute('width','2730');await page.mouse.move(1300,30);
  expect(await page.getByTestId('gel-overlay').screenshot()).toEqual(gelPaint);
  const frame=await page.evaluate(()=>(window as any).__recoveryFrames),paint=await sample.screenshot();
  await expect.poll(()=>page.evaluate(()=>(window as any).__recoveryFrames)).toBeGreaterThan(frame+10);
  await expect.poll(async()=>(await sample.screenshot()).equals(paint)).toBe(false);
  expect(await save()).toEqual(before);expect(errors).toEqual([]);
  await writeFile(info.outputPath('document.json'),JSON.stringify(before,null,2));
  await page.screenshot({path:info.outputPath('recovered.png')});
 }finally{await app.close();}
});
