import {test,expect} from '@playwright/test';
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
for(const linear of [false,true])test(`native format probe ${linear?'linear':'srgb'}`,async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),backend);
 let replaced=0;
 if(linear){
  await page.route('**/src/lib/gpu/gl/target.ts*',async route=>{const r=await route.fetch();replaced++;await route.fulfill({response:r,body:(await r.text()).replaceAll('gl.SRGB8_ALPHA8','gl.RGBA8')});});
  await page.route('**/src/lib/gel/render.ts*',async route=>{const r=await route.fetch();replaced++;await route.fulfill({response:r,body:(await r.text()).replaceAll('rgba8unorm-srgb','rgba8unorm')});});
 }
 await page.goto('/#/gel');
 await expect(page.getByTestId('band-0')).toBeVisible();
 await page.evaluate(()=>document.fonts.ready);
 await expect.poll(()=>page.getByTestId('gel-canvas').evaluate((c:HTMLCanvasElement)=>c.width)).toBeGreaterThan(0);
 await page.waitForTimeout(700);
 await expect(page.getByRole('alert')).toHaveCount(0);
 if(linear)expect(replaced).toBe(1);
 await page.screenshot({path:`/tmp/gel-native-lossless-probe/format-${linear?'linear':'srgb'}-${backend}.png`});
});
