import {test,expect} from '@playwright/test';
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
test('record startup for native framebuffer comparison',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),backend);
 await page.goto('/#/gel');
 await expect(page.getByTestId('band-0')).toBeVisible();
 await page.evaluate(()=>document.fonts.ready);
 await expect.poll(()=>page.getByTestId('gel-canvas').evaluate(c=>c.width)).toBeGreaterThan(0);
 await page.waitForTimeout(500);
 await page.getByTestId('gel-canvas').evaluate(c=>c.style.imageRendering='auto');
 await page.screenshot({path:`/tmp/gel-native-lossless-probe/scaling-auto-${backend}.png`});
});
