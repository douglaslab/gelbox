import {test,expect} from '@playwright/test';
for(const scale of [1,2])test.describe(`native slider handle ${scale}x`,()=>{
 test.use({deviceScaleFactor:scale,viewport:{width:1365,height:768}});
 test('snapped fill, solid shadow and translucent outline',async({page},info)=>{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto('/#/gel');await page.getByTestId('settings-button').click();
  for(const id of ['gel-voltage','gel-rotate','timeline-slider']){
   const handle=page.getByTestId(`${id}-handle`);
   await expect(handle.locator('svg')).toHaveCount(1);
   const box=(await handle.boundingBox())!;
   expect(box.width).toBe(16);expect(box.height).toBe(20);
   expect(box.x).toBe(Math.round(box.x));
   const fill=handle.locator('[data-part="fill"]');
   await expect(fill).toHaveAttribute('x','0.5');await expect(fill).toHaveAttribute('y','0.5');
   await expect(fill).toHaveAttribute('width','15');await expect(fill).toHaveAttribute('height','19');
   await expect(fill).toHaveAttribute('rx','4');
   const outline=handle.locator('[data-part="outline"]');
   await expect(outline).toHaveAttribute('stroke-opacity','0.5');
   await expect(outline).toHaveAttribute('stroke-width',String(1/scale));
   await expect(handle.locator('[data-part="shadow"]')).toHaveCount(id==='gel-rotate'?0:1);
   expect(await handle.evaluate(el=>getComputedStyle(el).boxShadow)).toBe('none');
  }
  await page.screenshot({path:info.outputPath('slider-handles.png')});
 });
});
