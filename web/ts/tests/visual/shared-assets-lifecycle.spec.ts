import {test,expect} from '@playwright/test';
test('shared icon cache reuses decode and texture, survives loss, and disposes late decode',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 await page.addInitScript(backend=>{
  localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');
  const w=window as any;w.__assetLive=new Set();w.__assetDecoded=0;w.__assetClosed=0;w.__assetDevices=[];
  const context=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(...args:any[]){const result=context.apply(this,args as any);if(result)this.dataset.backend=args[0];return result;} as any;
  const decode=createImageBitmap.bind(window);window.createImageBitmap=(async(...args:any[])=>{
   const bitmap=await (decode as any)(...args);w.__assetDecoded++;const close=bitmap.close.bind(bitmap);bitmap.close=()=>{w.__assetClosed++;close();};
   if(w.__assetHold)await new Promise<void>(resolve=>w.__assetFinish=resolve);return bitmap;
  }) as any;
  const request=GPUAdapter.prototype.requestDevice;GPUAdapter.prototype.requestDevice=async function(...args){const device=await request.apply(this,args);w.__assetDevices.push(device);return device;};
  const allocate=GPUDevice.prototype.createTexture;GPUDevice.prototype.createTexture=function(desc){const t=allocate.call(this,desc);if(desc.label==='scene-asset'){w.__assetLive.add(t);const destroy=t.destroy.bind(t);t.destroy=()=>{w.__assetLive.delete(t);destroy();};}return t;};
  const gl=WebGL2RenderingContext.prototype,create=gl.createTexture,remove=gl.deleteTexture;
  gl.createTexture=function(){const t=create.call(this);if(/sceneAssets/.test(new Error().stack??'')){w.__assetLive.add(t);w.__assetGl=this;}return t;};
  gl.deleteTexture=function(t){w.__assetLive.delete(t);remove.call(this,t);};
 },backend);
 await page.goto('/#/dev');
 await page.evaluate(async()=>{
  const {default:React}=await import('/node_modules/.vite/deps/react.js');
  const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
  const {GelProvider}=await import('/src/components/gel/GelContext.tsx');
  const {SettingsButton}=await import('/src/components/gel/SettingsButton.tsx');
  const Fixture=()=>{const [count,setCount]=React.useState(2);(window as any).__assetCount=setCount;return React.createElement(React.Fragment,null,...Array.from({length:count},(_,i)=>React.createElement(SettingsButton,{key:i})));};
  const host=document.createElement('div');host.style.cssText='position:fixed;inset:0';document.body.append(host);
  const root=createRoot(host);root.render(React.createElement(GelProvider,null,React.createElement(Fixture)));(window as any).__assetUnmount=()=>root.unmount();
 });
 const stats=()=>page.evaluate(()=>{const w=window as any;return {live:w.__assetLive.size,decoded:w.__assetDecoded,closed:w.__assetClosed};});
 await expect(page.getByTestId('settings-button')).toHaveCount(2);
 await expect(page.getByTestId('settings-button').first()).toHaveAttribute('data-shared-ready','1');
 await expect.poll(stats).toEqual({live:1,decoded:1,closed:0});
 await page.evaluate(backend=>{const w=window as any;if(backend==='webgpu')w.__assetDevices.forEach((d:any)=>d.destroy());else w.__assetGl.getExtension('WEBGL_lose_context').loseContext();},backend);
 await expect(page.getByTestId('shared-scene')).toHaveAttribute('data-backend',backend==='webgpu'?'webgl2':'webgpu');
 await expect.poll(stats).toEqual({live:1,decoded:1,closed:0});
 await page.evaluate(()=>(window as any).__assetCount(1));await expect(page.getByTestId('settings-button')).toHaveCount(1);
 expect(await stats()).toEqual({live:1,decoded:1,closed:0});
 await page.evaluate(()=>(window as any).__assetCount(0));await expect.poll(stats).toEqual({live:0,decoded:1,closed:1});
 await page.evaluate(()=>{(window as any).__assetHold=true;(window as any).__assetCount(2);});
 await expect.poll(()=>page.evaluate(()=>typeof (window as any).__assetFinish)).toBe('function');
 await page.evaluate(()=>(window as any).__assetUnmount());await expect(page.getByTestId('settings-button')).toHaveCount(0);
 await page.evaluate(()=>(window as any).__assetFinish());await expect.poll(stats).toEqual({live:0,decoded:2,closed:2});
});
