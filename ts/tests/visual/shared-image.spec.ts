import {test,expect,type Page,type TestInfo} from '@playwright/test';
import fs from 'node:fs';
async function setup(page:Page,info:TestInfo){
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 await page.addInitScript(backend=>{
  localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');
  (window as any).__imageDevices=[];const request=GPUAdapter.prototype.requestDevice;GPUAdapter.prototype.requestDevice=async function(...args){const device=await request.apply(this,args);(window as any).__imageDevices.push(device);return device;};
  const decode=window.createImageBitmap.bind(window);(window as any).__imageCloses=0;window.createImageBitmap=(async(...args:any[])=>{const bitmap=await (decode as any)(...args);if(!(args[0] instanceof File))return bitmap;const close=bitmap.close.bind(bitmap);bitmap.close=()=>{(window as any).__imageCloses++;close();};if((window as any).__holdImageDecode)await new Promise<void>(r=>{(window as any).__finishImageDecode=r;});return bitmap;}) as any;
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(...args:any[]){const context=original.apply(this,args as any);if(context){this.dataset.context=args[0];if(this.dataset.testid==='shared-scene')(window as any).__imageContext=context;}return context;} as any;
  (window as any).__imageLive=new Set();const live=(window as any).__imageLive;
  const copy=GPUQueue.prototype.copyExternalImageToTexture;GPUQueue.prototype.copyExternalImageToTexture=function(...args){if((window as any).__imageFail)throw Error('Injected image upload failure');return copy.apply(this,args);};
  const upload=WebGL2RenderingContext.prototype.texImage2D;WebGL2RenderingContext.prototype.texImage2D=function(...args:any[]){if((window as any).__imageFail&&/sceneImageTexture/.test(new Error().stack??'')&&!/sceneAssets/.test(new Error().stack??''))throw Error('Injected image upload failure');return (upload as any).apply(this,args);};
  const create=GPUDevice.prototype.createTexture;
  GPUDevice.prototype.createTexture=function(desc){const t=create.call(this,desc);if(desc.label==='scene-image'){live.add(t);const destroy=t.destroy.bind(t);t.destroy=()=>{live.delete(t);destroy();};}return t;};
  const gl=WebGL2RenderingContext.prototype,allocate=gl.createTexture,remove=gl.deleteTexture;
  gl.createTexture=function(){const t=allocate.call(this);if(t&&/sceneImageTexture/.test(new Error().stack??'')&&!/sceneAssets/.test(new Error().stack??''))live.add(t);return t;};
  gl.deleteTexture=function(t){live.delete(t);remove.call(this,t);};
 },backend);
 await page.setViewportSize({width:1365,height:768});await page.goto('/#/gel');
 return backend;
}
async function drop(page:Page){
 const bytes=[...fs.readFileSync('../reference/native/modern/shared-image-scenes/alpha.png')];
 await page.evaluate(bytes=>{const data=new DataTransfer();data.items.add(new File([new Uint8Array(bytes)],'alpha.png',{type:'image/png'}));document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:data,clientX:300,clientY:200}));},bytes);
}
test('reference image uses shared graphics and releases its texture on removal',async({page},info)=>{
 await setup(page,info);await drop(page);
 const image=page.getByTestId('reference-image-1'),canvas=page.getByTestId('reference-image-canvas-1');
 await expect(image).toBeFocused();await expect(canvas).toHaveAttribute('data-shared-ready','1');
 expect(await canvas.getAttribute('data-context')).toBeNull();
 await expect(page.getByTestId('shared-scene')).toHaveAttribute('data-view-keys',/image-1/);
 await expect.poll(()=>page.evaluate(()=>(window as any).__imageLive.size)).toBe(1);
 await page.keyboard.press('Delete');await expect(image).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>(window as any).__imageLive.size)).toBe(0);
});

test('late upload import and late image decode cannot allocate after removal',async({page},info)=>{
 await page.route('**/src/components/gel/SharedReferenceImage.tsx*',async route=>{
  const response=await route.fetch(),body=await response.text();
  const next=body.replace(/import\("[^"\n]*sceneImageTexture\.ts[^"\n]*"\)/,'import("/src/lib/gel/sceneImageTexture.ts?heldReferenceUpload=1")');
  expect(next).not.toBe(body);await route.fulfill({response,body:next});
 });
 await setup(page,info);let release!:()=>void,arrived!:()=>void;
 const held=new Promise<void>(r=>release=r),requested=new Promise<void>(r=>arrived=r);
 await page.route('**/src/lib/gel/sceneImageTexture.ts*',async route=>{if(route.request().url().includes('heldReferenceUpload')){arrived();await held;}await route.continue();});
 await drop(page);await requested;await expect(page.getByTestId('reference-image-1')).toBeFocused();
 await page.keyboard.press('Delete');await expect(page.getByTestId('reference-image-1')).toHaveCount(0);release();
 await page.evaluate(async()=>{await import('/src/lib/gel/sceneImageTexture.ts?heldReferenceUpload=1');await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));});
 expect(await page.evaluate(()=>(window as any).__imageLive.size)).toBe(0);expect(await page.evaluate(()=>(window as any).__imageCloses)).toBe(1);
 await page.evaluate(()=>{(window as any).__holdImageDecode=true;});await drop(page);
 await expect.poll(()=>page.evaluate(()=>typeof (window as any).__finishImageDecode)).toBe('function');
 await page.evaluate(()=>{location.hash='/dev';});await expect(page.getByTestId('gel-page')).toHaveCount(0);
 await page.evaluate(()=>(window as any).__finishImageDecode());
 await expect.poll(()=>page.evaluate(()=>(window as any).__imageCloses)).toBe(2);
 expect(await page.evaluate(()=>(window as any).__imageLive.size)).toBe(0);
});
test('image survives backend loss and failed upload rollback, then retry reuses its bitmap',async({page},info)=>{
 const backend=await setup(page,info);await drop(page);
 const image=page.getByTestId('reference-image-1'),canvas=page.getByTestId('reference-image-canvas-1');
 await expect(canvas).toHaveAttribute('data-shared-ready','1');const pixels=await image.screenshot();
 await page.evaluate(backend=>{if(backend==='webgpu')for(const d of (window as any).__imageDevices)d.destroy();else (window as any).__imageContext.getExtension('WEBGL_lose_context').loseContext();},backend);
 await expect(page.getByTestId('shared-scene')).toHaveAttribute('data-context',backend==='webgpu'?'webgl2':'webgpu');
 await expect(canvas).toHaveAttribute('data-shared-ready','1');expect(await image.screenshot()).toEqual(pixels);
 await expect.poll(()=>page.evaluate(()=>(window as any).__imageLive.size)).toBe(1);
 await page.evaluate(()=>{(window as any).__imageFail=true;const c=(window as any).__imageContext;if(c instanceof WebGL2RenderingContext)c.getExtension('WEBGL_lose_context').loseContext();else for(const d of (window as any).__imageDevices)d.destroy();});
 await expect(page.getByTestId('shared-scene-error')).toBeVisible();await expect.poll(()=>page.evaluate(()=>(window as any).__imageLive.size)).toBe(0);
 expect(await page.evaluate(()=>(window as any).__imageCloses)).toBe(0);
 await page.evaluate(()=>{(window as any).__imageFail=false;});await page.getByRole('button',{name:'Retry graphics'}).click();
 await expect(canvas).toHaveAttribute('data-shared-ready','1');await image.focus();expect(await image.screenshot()).toEqual(pixels);
 await expect.poll(()=>page.evaluate(()=>(window as any).__imageLive.size)).toBe(1);
 await page.evaluate(()=>{location.hash='/dev';});await expect(page.getByTestId('gel-page')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>(window as any).__imageLive.size)).toBe(0);expect(await page.evaluate(()=>(window as any).__imageCloses)).toBe(1);
});
