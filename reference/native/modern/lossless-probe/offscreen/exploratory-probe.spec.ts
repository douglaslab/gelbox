import {test,expect} from '@playwright/test';
import fs from 'node:fs';
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
for(const linear of [false,true])test(`offscreen ${linear}`,async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('gelBackend','webgl2'));
 if(linear)await page.route('**/src/lib/gpu/gl/target.ts*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replaceAll('gl.SRGB8_ALPHA8','gl.RGBA8')});});
 await page.route('**/src/components/gel/GelCanvas.tsx*',async r=>{
 const response=await r.fetch();let body=await response.text();
 const marker='gl.bindFramebuffer(gl.FRAMEBUFFER, null);';
 expect(body).toContain(marker);
 body=body.replace(marker,`gl.bindFramebuffer(gl.FRAMEBUFFER, renderer.output.framebuffer);
 const raw = new Uint8Array(renderer.output.width*renderer.output.height*4);
 gl.readPixels(0,0,renderer.output.width,renderer.output.height,gl.RGBA,gl.UNSIGNED_BYTE,raw);
 window.__offscreen={width:renderer.output.width,height:renderer.output.height,rgba:Array.from(raw)};
 ${marker}`);
 await r.fulfill({response,body});
 });
 await page.goto('/#/gel');
 await expect.poll(()=>page.evaluate(()=>!!(window as any).__offscreen)).toBe(true);
 fs.writeFileSync(`/tmp/gel-native-lossless-probe/offscreen-web-${linear?'linear':'srgb'}.json`,JSON.stringify(await page.evaluate(()=>(window as any).__offscreen)));
});
