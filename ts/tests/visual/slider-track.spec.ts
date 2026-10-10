import {test,expect} from '@playwright/test';
for(const scale of [1,2])test.describe(`native track ${scale}x`,()=>{
 test.use({deviceScaleFactor:scale,viewport:{width:1365,height:768}});
 test('track stroke and snapped opaque notch dots',async({page},info)=>{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto('/#/gel');await page.getByTestId('settings-button').click();
  for(const id of ['gel-voltage','gel-rotate']){
   const track=page.getByTestId(`${id}-track`);
   const rect=(await track.boundingBox())!;
   const line=track.locator(':scope > div').first();
   const bounds=(await line.boundingBox())!;
   expect(bounds.height).toBe(1/scale);
   expect(bounds.y).toBe(rect.y+10+.5-.5/scale);
   const dots=track.locator('[data-part="notch"]');
   expect(await dots.count()).toBeGreaterThan(0);
   for(const dot of await dots.all()){
    const box=(await dot.boundingBox())!;
    expect(box.width).toBe(5);expect(box.height).toBe(5);
    expect(box.x+2.5).toBe(Math.round(box.x+2.5));
    const color=await dot.evaluate(el=>getComputedStyle(el).backgroundColor);
    expect(color).toBe(id==='gel-voltage'?'rgb(76, 76, 76)':'rgb(210, 210, 210)');
   }
  }
  await page.screenshot({path:info.outputPath('slider-tracks.png')});
 });
});
