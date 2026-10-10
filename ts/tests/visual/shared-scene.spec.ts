import {test,expect} from '@playwright/test';
test('development shared scene draws sample and fragment without their own graphics contexts',async({page},info)=>{
 await page.addInitScript(backend=>{
  localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');
  (window as any).__molsimFreezeAfterTicks=30;
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(...args:any[]){const context=original.apply(this,args as any);if(context)this.dataset.context=args[0];return context;} as any;
 },info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.setViewportSize({width:1365,height:768});await page.goto('/#/gel');
 await page.getByTestId('band-0').click();
 const scene=page.getByTestId('shared-scene');await expect(scene).toBeVisible();
 await expect(scene).toHaveAttribute('data-context',info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await expect(scene).toHaveAttribute('width','1365');await expect(scene).toHaveAttribute('height','768');
 const sample=page.getByTestId('molecular-sim-canvas'),fragment=page.getByTestId('fragment-representative');
 await expect(sample).toHaveAttribute('data-frozen','1');await expect(fragment).toBeAttached();
 expect(await sample.getAttribute('data-context')).toBeNull();expect(await fragment.getAttribute('data-context')).toBeNull();
 await expect(scene).toHaveAttribute('data-view-keys',/sample.*inspector-fragment/);
 await page.mouse.move(0,0);
 const body=page.getByTestId('sample-frame');
 const before=await page.screenshot({clip:(await body.boundingBox())!,path:info.outputPath('sample-before.png')});
 // Keep clear of the unmigrated gel canvas; mixed-boundary overlap remains Task 3.
 await page.getByTestId('stage-middle').evaluate(el=>{el.style.transform='translate(20px,-20px)';});
 await page.getByTestId('stage').evaluate(el=>{el.style.height='1200px';});
 await page.getByTestId('gel-page').evaluate(el=>{el.scrollTop=30;});
 await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
 const after=await page.screenshot({clip:(await body.boundingBox())!,path:info.outputPath('sample-after.png')});
 expect(after.equals(before)).toBe(true);
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1365,height:768,deviceScaleFactor:2,mobile:false});
 await expect(scene).toHaveAttribute('width','2730');await expect(scene).toHaveAttribute('height','1536');
 await expect(sample).toHaveAttribute('data-frozen','1');
 await page.setViewportSize({width:1200,height:700});
 await expect(scene).toHaveAttribute('width','1200');await expect(scene).toHaveAttribute('height','700');
 await expect(page.getByRole('alert')).toHaveCount(0);
});

test('shared presentation observes committed opens/removals without advancing molecular state',async({page},info)=>{
 await page.addInitScript(b=>{localStorage.setItem('gelBackend',b);localStorage.setItem('gelSharedPresentation','1');},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/dev');
 await page.evaluate(async()=>{
  const {default:React}=await import('/node_modules/.vite/deps/react.js');
  const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
  const {GelProvider,useGelStore,useGelState}=await import('/src/components/gel/GelContext.tsx');
  const {useSharedPresentation}=await import('/src/components/gel/ScenePresentation.tsx');
  const {SampleView}=await import('/src/components/sample/SampleView.tsx');
  const {FragmentWell}=await import('/src/components/inspector/FragmentWell.tsx');
  const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:999';document.body.append(host);
  const results:any[]=[];(window as any).sharedResults=results;
  let queued:any,afterTick:string;
  const Fixture=()=>{
   const store=useGelStore(),state=useGelState(),registry=useSharedPresentation()!;
   const snapshot=()=>JSON.stringify({parts:store.getMolecularView('sample')?.sim.parts,ticks:store.getMolecularView('sample')?.ticks,seed:(store.getMolecularView('sample')?.sim as any)?.seed,random:(store.molecular as any).globalRand.clone().nextInt()});
   React.useLayoutEffect(()=>{
    
    (window as any).queueSharedAction=(action:any)=>{queued=action;};
    const stop=store.subscribeFrame(()=>{if(queued){store.dispatch(queued);queued=null;}afterTick=snapshot();});
    const off=registry.subscribe((_scene,keys)=>{
     const marker=host.querySelector('[data-selected]')!.getAttribute('data-selected');
     results.push({before:afterTick,after:snapshot(),marker,expected:String(store.getSnapshot().gel.lastSampleLane),keys:[...keys],expectedKeys:store.getSnapshot().order.filter(k=>k==='sample'||k==='inspector-fragment')});
    });
    return()=>{stop();off();};
   },[store,registry]);
   return React.createElement('div',{'data-selected':String(state.lastSampleLane)},state.lastSampleLane===null?null:[
    React.createElement('div',{key:'sample',style:{position:'relative',width:362,height:520}},React.createElement(SampleView)),
    React.createElement('div',{key:'fragment',style:{position:'absolute',left:77,top:71}},React.createElement(FragmentWell,{fragmentIndex:0}))]);
  };
  createRoot(host).render(React.createElement(GelProvider,null,React.createElement(Fixture)));
 });
 await expect.poll(()=>page.evaluate(()=>typeof (window as any).queueSharedAction)).toBe('function');
 for(const laneIndex of [0,null,0,null]){
  await page.evaluate(laneIndex=>{(window as any).sharedResults.length=0;(window as any).queueSharedAction(laneIndex===null?{type:'CLOSE_SAMPLE'}:{type:'SET_SELECTED',laneIndex,index:0});},laneIndex);
  await expect.poll(()=>page.evaluate(laneIndex=>((window as any).sharedResults as any[]).some(r=>r.marker===String(laneIndex)&&(laneIndex===null?r.keys.length===0:r.keys.includes('inspector-fragment'))),laneIndex)).toBe(true);
  const results=await page.evaluate(()=>(window as any).sharedResults);
  expect(results.length).toBeGreaterThan(0);
  for(const r of results){expect(r.marker).toBe(r.expected);expect(r.after).toBe(r.before);expect(r.keys).toEqual(r.expectedKeys);}
 }
 await expect(page.getByRole('alert')).toHaveCount(0);
});

test('shared graphics initialization falls back on a fresh canvas',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 await page.addInitScript(b=>{
  localStorage.setItem('gelBackend',b);localStorage.setItem('gelSharedPresentation','1');(window as any).__molsimFreezeAfterTicks=30;
  (window as any).sharedCanvases=[];
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(...args:any[]){
   if(this.dataset.testid==='shared-scene'){
    const seen=(window as any).sharedCanvases as HTMLCanvasElement[];if(!seen.includes(this))seen.push(this);
    if(seen.length===1)throw Error('injected shared context failure');
    this.dataset.context=args[0];
   }
   return original.apply(this,args as any);
  } as any;
 },backend);
 await page.goto('/#/gel');await page.getByTestId('band-0').click();
 await expect(page.getByTestId('shared-scene')).toHaveAttribute('data-context',backend==='webgl2'?'webgpu':'webgl2');
 await expect(page.getByTestId('shared-scene')).toHaveAttribute('data-view-keys',/inspector-fragment/);
 await expect(page.getByTestId('molecular-sim-canvas')).toHaveAttribute('data-frozen','1');
 expect(await page.evaluate(()=>(window as any).sharedCanvases.map((c:HTMLCanvasElement)=>c.isConnected))).toEqual([false,true]);
 await expect(page.getByRole('alert')).toHaveCount(0);
});

test('shared presentation import completing after route removal allocates nothing',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 const module=backend==='webgl2'?'present-gl.ts':'present.ts';
 let release!:()=>void,arrived!:()=>void;
 const held=new Promise<void>(r=>release=r),requested=new Promise<void>(r=>arrived=r);
 await page.route(`**/src/lib/gel/${module}`,async route=>{arrived();await held;await route.continue();});
 await page.addInitScript(b=>{
  localStorage.setItem('gelBackend',b);localStorage.setItem('gelSharedPresentation','1');(window as any).lateSharedAllocations=0;(window as any).removedShared=false;
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(...args:any[]){if((window as any).removedShared&&this.dataset.testid==='shared-scene')(window as any).lateSharedAllocations++;return original.apply(this,args as any);} as any;
  if(navigator.gpu){const texture=GPUDevice.prototype.createTexture;GPUDevice.prototype.createTexture=function(desc){if((window as any).removedShared&&desc.label==='gel-presentation-msaa')(window as any).lateSharedAllocations++;return texture.call(this,desc);};}
 },backend);
 await page.goto('/#/gel');await requested;
 await page.evaluate(()=>{location.hash='/dev';});await expect(page.getByTestId('shared-scene')).toHaveCount(0);
 await page.evaluate(()=>{(window as any).removedShared=true;});release();
 await page.evaluate(async module=>{await import(`/src/lib/gel/${module}`);await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));},module);
 expect(await page.evaluate(()=>(window as any).lateSharedAllocations)).toBe(0);
});
