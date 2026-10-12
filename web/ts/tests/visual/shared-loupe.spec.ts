import {test,expect} from '@playwright/test';
test('shared loupe keeps its engine through drag, resize, mode switches and removal',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 await page.addInitScript(backend=>{
  localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(...args:any[]){const result=original.apply(this,args as any);if(result)this.dataset.probeContext=args[0];return result;} as any;
 },backend);
 await page.route('**/src/components/sample/SampleSimCanvas.tsx*',async route=>{
  const response=await route.fetch(),body=await response.text();
  const patched=body.replace('const sim = view.sim;','const sim = view.sim; globalThis.__loupeViews ??= new Map(); globalThis.__loupeViews.set(viewKey,view);');
  expect(patched).not.toBe(body);await route.fulfill({response,body:patched});
 });
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');
 const band=(await page.getByTestId('band-0').boundingBox())!;
 await page.keyboard.down('Meta');await page.mouse.click(Math.floor(band.x+band.width/2),Math.floor(band.y+band.height/2));await page.keyboard.up('Meta');await page.mouse.move(0,0);
 const canvas=page.getByTestId('loupe-canvas-1'),frame=page.getByTestId('loupe-frame-1');
 await expect(canvas).toHaveAttribute('data-shared-ready','1');expect(await canvas.getAttribute('data-probe-context')).toBeNull();
 await expect(page.getByTestId('shared-scene')).toHaveAttribute('data-view-keys',/loupe-1/);
 await page.evaluate(()=>{const view=(window as any).__loupeViews.get('loupe-1');(window as any).__savedLoupe={view,parts:JSON.stringify(view.sim.parts),seed:view.sim.seed};});
 const r=(await frame.boundingBox())!;await page.mouse.move(r.x+10,r.y+155);await page.mouse.down();await page.mouse.move(r.x+40,r.y+175);await page.mouse.up();await page.mouse.move(0,0);
 expect((await frame.boundingBox())!.x-r.x).toBeCloseTo(30,1);
 await page.setViewportSize({width:1465,height:900});
 for(let i=0;i<4;i++)await page.keyboard.press('Meta+r');
 expect(await page.evaluate(()=>{const saved=(window as any).__savedLoupe,view=(window as any).__loupeViews.get('loupe-1');return view===saved.view&&JSON.stringify(view.sim.parts)===saved.parts&&view.sim.seed===saved.seed;})).toBe(true);
 await frame.focus();await page.keyboard.press('Escape');await expect(frame).toHaveCount(0);
 await expect(page.getByTestId('shared-scene')).not.toHaveAttribute('data-view-keys',/loupe-1/);
 expect(await page.evaluate(()=>(window as any).__savedLoupe.view.alive)).toBe(false);
});
