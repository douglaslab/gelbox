import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
async function pixels(page:Page,points:number[][]){
 const png=await page.locator('[data-render-mode="direct"]').screenshot();
 return page.evaluate(async({bytes,points})=>{
  const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
  const c=new OffscreenCanvas(image.width,image.height),ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);image.close();
  return points.map(([x,y])=>Array.from(ctx.getImageData(x,y,1,1).data));
 },{bytes:[...png],points});
}
test.beforeEach(async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.setViewportSize({width:1365,height:768});await page.goto('/#/gel');
});
test('Render checkbox and Cmd-R share native mode; off-mode editing and imports preserve it',async({page})=>{
 await page.getByRole('button',{name:'Application settings'}).click();
 const render=page.getByRole('checkbox',{name:'Render',exact:true});await expect(render).toBeChecked();
 await render.uncheck();await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode','direct');
 await expect(page.getByTestId('gel-well-0')).toBeVisible();
 await page.getByTestId('band-0').click();await expect(page.getByTestId('fragment-view')).toBeVisible();
 await page.getByTestId('frag-size-icon-hi').click();
 await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode','direct');
 const native=await readFile('../reference/native/files/ladder-after-selection.gel.json','utf8');
 await page.getByTestId('file-input').setInputFiles({name:'native.json',mimeType:'application/json',buffer:Buffer.from(native)});
 await expect(page.getByTestId('sample-view')).toHaveCount(0);
 await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode','direct');
 await page.getByRole('button',{name:'Application settings'}).click();const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
 expect(JSON.parse(await readFile((await(await pending).path())!,'utf8'))).toEqual(JSON.parse(native));
 // The app shortcut precedes focused image key handling and cannot refresh the page.
 await page.evaluate(async()=>{
  const c=document.createElement('canvas');c.width=c.height=20;
  const blob=await new Promise<Blob>(resolve=>c.toBlob(b=>resolve(b!)));
  const dt=new DataTransfer();dt.items.add(new File([blob],'focus.png',{type:'image/png'}));
  document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:dt,clientX:1200,clientY:650}));
 });
 const image=page.getByTestId('reference-image-1');await expect(image).toBeFocused();
 await page.keyboard.press('r');await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode','direct');
 await page.keyboard.press('Meta+r');await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode','effects');await expect(image).toBeFocused();
 await page.getByRole('button',{name:'Application settings'}).click();await expect(render).toBeChecked();
 await page.keyboard.press('Meta+r');await expect(render).not.toBeChecked();await expect(image).toBeFocused();
 await page.screenshot({path:`/tmp/gel-render-off-${test.info().project.name}.png`});
});

for(const dpr of [1,2])test(`direct canvas draws additive bodies, gradients and blur at DPR ${dpr}`,async({browser},info)=>{
 const context=await browser.newContext({viewport:{width:500,height:300},deviceScaleFactor:dpr});const page=await context.newPage();
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/dev');
 await page.evaluate(async()=>{
  const {default:React}=await import('/node_modules/.vite/deps/react.js');
  const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
  const {DirectBandCanvas}=await import('/src/components/gel/DirectBandCanvas.tsx');
  const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:999;background:white';document.body.append(host);
  const root=createRoot(host);
  const base={rect:{x1:10,y1:30,x2:40,y2:40},brightness:.5,color:[1,.5,0],blur:0,smearAbove:0,smearBelow:20,smearBrightnessAbove:[0,0],smearBrightnessBelow:[.8,.2],flameHeight:20};
  const bands=[base,{...base,rect:{x1:20,y1:30,x2:30,y2:40},color:[0,0,1],brightness:.25,smearBelow:0,flameHeight:0},{...base,rect:{x1:70,y1:30,x2:80,y2:40},blur:3,smearBelow:0,flameHeight:0}];
  (window as any).directRender=(empty=false,width=100,height=100)=>root.render(React.createElement(DirectBandCanvas,{bands:empty?[]:bands,gelSize:{width,height}}));
  (window as any).directRender();
 });
 const canvas=page.locator('[data-render-mode="direct"]');await expect(canvas).toHaveAttribute('width',String(100*dpr));
 const coords=[[15,35],[25,35],[15,20],[15,45],[68,35],[95,90]].map(p=>p.map(v=>v*dpr));
 const actual=await pixels(page,coords);
 const flame=(20+.5/dpr-10)/20*.5,smear=.8-(45+.5/dpr-40)/20*.6;
 const expected=[[127.5,63.75,0],[127.5,63.75,63.75],[flame*255,flame*.5*255,0],[smear*255,smear*255,smear*255],[25.5,12.75,0],[0,0,0]];
 actual.forEach((rgba,j)=>{expect(rgba[3]).toBe(255);for(let i=0;i<3;i++)expect(Math.abs(rgba[i]-expected[j][i])).toBeLessThanOrEqual(2);});
 const cdp=await context.newCDPSession(page);
 const changedDpr=dpr===1?2:1;
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:501,height:301,deviceScaleFactor:changedDpr,mobile:false});
 await expect(canvas).toHaveAttribute('width',String(100*changedDpr));
 await page.evaluate(()=>(window as any).directRender(true,150,120));
 await expect(canvas).toHaveAttribute('width',String(150*changedDpr));
 await expect(canvas).toHaveAttribute('height',String(120*changedDpr));
 await expect.poll(async()=>await pixels(page,[[25*dpr,35*dpr]])).toEqual([[0,0,0,255]]);
 await context.close();
});

test('repeated Render switching and route removal produce no late renderer errors',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 for(let i=0;i<12;i++)await page.keyboard.press('Meta+r');
 await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode','effects');
 await page.keyboard.press('Meta+r');await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode','direct');
 await page.evaluate(()=>{location.hash='/dev';});await expect(page.getByTestId('gel-page')).toHaveCount(0);
 await page.goto('/#/gel');await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode','effects');
 expect(errors).toEqual([]);
});

for(const delayPresentation of [false,true])test(`switching off while effects modules load prevents late effects allocation (presentation held: ${delayPresentation})`,async({page},info)=>{
 let release!:()=>void,arrived!:()=>void;
 const held=new Promise<void>(r=>{release=r;}),requested=new Promise<void>(r=>{arrived=r;});
 const module=info.project.name.endsWith('webgl2')?'render-gl.ts':'render.ts';
 await page.route(`**/src/lib/gel/${module}`,async route=>{arrived();await held;await route.continue();});
 // Force the replacement direct renderer to initialize after cancellation too.
 // Its presentation texture is valid; only the cancelled effects owner is forbidden.
 if(delayPresentation)await page.route(`**/src/lib/gel/${module.replace('render','present')}`,async route=>{await held;await route.continue();});
 await page.addInitScript(()=>{
  (window as any).lateEffectsTextures=[];(window as any).directTextures=0;(window as any).cancelledEffects=false;
  const proto=navigator.gpu?GPUDevice.prototype:null;
  if(proto){const original=proto.createTexture;proto.createTexture=function(...args){
   if((window as any).cancelledEffects){
    if(args[0].label==='gel-presentation-msaa')(window as any).directTextures++;
    else (window as any).lateEffectsTextures.push(args[0].label??'(unlabelled)');
   }
   return original.apply(this,args);
  };}
  const gl=WebGL2RenderingContext.prototype,original=gl.createTexture;
  gl.createTexture=function(){
   if((window as any).cancelledEffects){
    if((this.canvas as HTMLCanvasElement).dataset.renderMode==='direct')(window as any).directTextures++;
    else (window as any).lateEffectsTextures.push((this.canvas as HTMLCanvasElement).dataset.renderMode??'(unknown owner)');
   }
   return original.call(this);
  };
 });
 await page.reload();await requested;
 await page.keyboard.press('Meta+r');await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode','direct');
 await page.evaluate(()=>{(window as any).cancelledEffects=true;});release();
 await page.evaluate(async module=>{await import(`/src/lib/gel/${module}`);await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));},module);
 if(delayPresentation)await expect.poll(()=>page.evaluate(()=>(window as any).directTextures)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>(window as any).lateEffectsTextures)).toEqual([]);
});

test('switching off releases effects canvas buffers and GL programs',async({page},info)=>{
 await page.addInitScript(()=>{
  (window as any).liveEffectResources=new Set();
  const tracked=(window as any).liveEffectResources as Set<object>;
  if(navigator.gpu){
   const original=GPUDevice.prototype.createBuffer;
   GPUDevice.prototype.createBuffer=function(desc){const buffer=original.call(this,desc);if(desc.label==='fullscreen-quad'||desc.label==='gel-canvas-blit-pass'){tracked.add(buffer);const destroy=buffer.destroy.bind(buffer);buffer.destroy=()=>{tracked.delete(buffer);destroy();};}return buffer;};
  }
  for(const [create,remove] of [['createBuffer','deleteBuffer'],['createProgram','deleteProgram']] as const){
   const proto=WebGL2RenderingContext.prototype,original=proto[create],destroy=proto[remove];
   (proto as any)[create]=function(){const resource=original.call(this);if((this.canvas as HTMLCanvasElement).dataset.renderMode==='effects')tracked.add(resource);return resource;};
   (proto as any)[remove]=function(resource:any){tracked.delete(resource);return (destroy as any).call(this,resource);};
  }
 });
 await page.reload();
 await expect.poll(()=>page.evaluate(()=>(window as any).liveEffectResources.size)).toBeGreaterThan(info.project.name.endsWith('webgl2')?3:1);
 await page.getByTestId('gel-canvas').screenshot();
 await page.keyboard.press('Meta+r');await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode','direct');
 expect(await page.evaluate(()=>(window as any).liveEffectResources.size)).toBe(0);
});

test('mode switches retire unused contexts without disrupting a persistent loupe',async({page},info)=>{
 test.setTimeout(60000);
 await page.evaluate(()=>{(window as any).__molsimFreezeAfterTicks=60;});
 const band=(await page.getByTestId('band-0').boundingBox())!;
 await page.keyboard.down('Meta');await page.mouse.click(band.x+band.width/2,band.y+band.height/2);await page.keyboard.up('Meta');await page.mouse.move(0,0);
 const loupe=page.getByTestId('loupe-canvas-1');await expect(loupe).toHaveAttribute('data-frozen','1');
 const before=await loupe.screenshot();
 const gl=info.project.name.endsWith('webgl2');
 for(let i=0;i<50;i++){
  if(gl)await page.getByTestId('gel-canvas').evaluate((canvas:HTMLCanvasElement)=>{(window as any).retiredCanvas=canvas;(window as any).retiredContext=canvas.getContext('webgl2');});
  await page.keyboard.press('Meta+r');
  await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode',i%2===0?'direct':'effects');
  await page.getByTestId('gel-canvas').screenshot();
  if(gl){
   // Retain a real context reference so garbage collection cannot hide leaks.
   await expect.poll(()=>page.evaluate(()=>!(window as any).retiredCanvas.isConnected&&(window as any).retiredContext.isContextLost())).toBe(true);
   expect(await loupe.evaluate((canvas:HTMLCanvasElement)=>canvas.getContext('webgl2')!.isContextLost())).toBe(false);
  }
  await expect(page.getByTestId('loupe-frame-1')).toBeFocused();
 }
 expect(await loupe.screenshot()).toEqual(before);
});
