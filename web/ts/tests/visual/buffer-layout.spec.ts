import {test,expect} from '@playwright/test';
import {openSampleSettings} from './sample-helpers';
for(const scale of [1,2])test(`native buffer bar and molecule bounds at ${scale}x`,async({browser},info)=>{
 const context=await browser.newContext({viewport:{width:1365,height:800},deviceScaleFactor:scale});
 const page=await context.newPage();
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 try {
  await page.goto('/#/gel');
  for(const mode of ['gel','sample']) {
   if(mode==='gel')await page.getByTestId('settings-button').click();
   else {await page.getByTestId('microtube-0').click();await openSampleSettings(page);}
   const panel=(await page.getByTestId(`${mode}-settings-view`).boundingBox())!;
   const x=panel.x+(mode==='gel'?127:139),y=panel.y+(mode==='gel'?56:106);
   for(const [i,key] of ['tris','borate','acetate','edta'].entries()) {
    const id=`${mode}-buffer-view-${key}`,bar=page.getByTestId(`${id}-track`),img=page.getByTestId(`${id}-icon-hi`);
    expect(await bar.boundingBox()).toEqual({x,y:y+31*i,width:135,height:23});
    await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
    expect(await img.boundingBox()).toEqual({x:x+148,y:y+31*i-2,width:28,height:26});
    await expect(page.getByTestId(id)).toHaveAttribute('aria-disabled','true');
   }
   await page.screenshot({path:info.outputPath(`${mode}-buffer-${scale}x.png`)});
  }
 } finally {await context.close();}
});
