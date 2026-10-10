import {test,expect} from '@playwright/test';
import {openSampleSettings} from './sample-helpers';
for(const shared of [false,true])test.describe(`shared:${shared}`,()=>{
for(const scale of [1,2])test(`buffer preset notch positions at ${scale}x`,async({browser},info)=>{
 const context=await browser.newContext({viewport:{width:1365,height:800},deviceScaleFactor:scale});
 const page=await context.newPage();
 await page.addInitScript(s=>localStorage.setItem('gelSharedPresentation',s?'1':'0'),shared);
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 try {
  await page.goto('/#/gel');await page.getByTestId('settings-button').click();
  for(const [preset,offsets] of [['TBE',[30,30,0,14]],['TAE',[27,0,14,14]],['H2O',[0,0,0,0]]] as const){
   await page.getByTestId(`gel-buffer-view-preset-${preset}`).click();
   for(const [i,key] of ['tris','borate','acetate','edta'].entries()){
    const bar=(await page.getByTestId(`gel-buffer-view-${key}-track`).boundingBox())!;
    const notch=page.getByTestId(`gel-buffer-view-${key}-notch`);
    await expect(notch).toBeVisible();
    expect(await notch.boundingBox()).toEqual({x:bar.x+offsets[i]-1,y:bar.y,width:1,height:23});
    await expect(notch).toHaveCSS('pointer-events','none');
   }
  }
 } finally {await context.close();}
});
test('custom composition retains prior preset notches only for the existing buffer view',async({page},info)=>{
 await page.addInitScript(s=>localStorage.setItem('gelSharedPresentation',s?'1':'0'),shared);
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.route('**/src/components/sample/SampleSimCanvas.tsx*',async route=>{
  const response=await route.fetch(),body=await response.text();
  expect(body).toContain('const store = useGelStore();');
  await route.fulfill({response,body:body.replace('const store = useGelStore();','const store = useGelStore(); globalThis.__bufferStore = store;')});
 });
 await page.goto('/#/gel');await page.getByTestId('microtube-0').click();await openSampleSettings(page);
 const notch=page.getByTestId('sample-buffer-view-tris-notch');
 await expect(notch).toBeVisible();const before=await notch.boundingBox();
 // Observe a model update on this same view, as native syncPresetToModel does.
 await page.evaluate(()=>{(window as any).__bufferStore.dispatch({type:'SET_SAMPLE_BUFFER',laneIndex:0,buffer:{tris:13.25,borate:7,acetate:2,edta:3}});});
 // Native float32 normalization maps 13.25 to 13.249999 before half-step rounding.
 await expect(page.getByTestId('sample-buffer-view-tris')).toContainText('13.0 mM');
 expect(await page.evaluate(()=>(window as any).__bufferStore.getSnapshot().gel.samples[0].buffer.tris)).toBe(13.25);
 expect(await notch.boundingBox()).toEqual(before);
 await expect(page.locator('[data-testid^="sample-buffer-view-preset-"][data-selected]')).toHaveCount(0);
 // Closing/recreating the view with a custom buffer starts with no notches.
 await page.keyboard.press('Escape');await page.getByTestId('microtube-0').click();await openSampleSettings(page);
 await expect(notch).toHaveCount(0);
});

});
