import {test,expect} from '@playwright/test';

for(const scale of [1,2])test(`native slider icon sizes and pick slots at ${scale}x`,async({browser},info)=>{
 const context=await browser.newContext({viewport:{width:1365,height:768},deviceScaleFactor:scale});
 const page=await context.newPage();
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 try {
  await page.goto('/#/gel');
  await page.getByTestId('settings-button').click();
  const check=async(id:string,w:number,h:number,dx:number,dy:number)=>{
   const img=page.getByTestId(`${id}-icon-lo`),root=(await page.getByTestId(id).boundingBox())!;
   await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
   const rect=(await img.boundingBox())!;
   expect(rect).toEqual({x:root.x+dx,y:root.y+dy,width:w,height:h});
  };
  await check('gel-lanes',32,32,-3,-3);
  await check('gel-voltage',27,28,-1,-1);
  await check('timeline-slider',27,28,-1,-1);
  const gel=(await page.getByTestId('gel-canvas').boundingBox())!;
  expect(await page.getByTestId('timeline-slider').boundingBox()).toEqual({
   x:gel.x+16,y:gel.y+gel.height+16,width:gel.width-74,height:26,
  });
  await page.screenshot({path:info.outputPath(`gel-controls-${scale}x.png`)});
  await page.getByTestId('band-0').click();
  await page.mouse.move(0,0);
  await expect(page.getByTestId('fragment-view')).toBeVisible();
  await check('frag-size',8,8,9,9);
  // Native retains the full 26px slot when the visible image is only 8px.
  const slot=(await page.getByTestId('frag-size').boundingBox())!;
  await page.mouse.click(slot.x+2,slot.y+13);
  await expect(page.getByTestId('frag-size')).toContainText('100 bp');
 } finally {await context.close();}
});
