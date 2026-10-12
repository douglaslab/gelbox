import {test,expect} from '@playwright/test';
for(const scale of [1,2])test(`native aggregate graph layout at ${scale}x`,async({browser},info)=>{
 const context=await browser.newContext({viewport:{width:1365,height:800},deviceScaleFactor:scale});
 const page=await context.newPage();
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 try {
  await page.goto('/#/gel');await page.getByTestId('band-0').click();await page.mouse.move(0,0);
  const first=(await page.getByTestId('frag-size').boundingBox())!;
  for(const [i,id] of ['size','mass','aspect','aggregate','degrade'].entries()){
   const row=(await page.getByTestId(`frag-${id}`).boundingBox())!;
   expect(row.y).toBe(first.y+56*i);expect(row.height).toBe(26);
  }
  const root=(await page.getByTestId('frag-aggregate').boundingBox())!;
  const column=page.getByTestId('frag-aggregate-col-0'),graph=column.locator('..');
  expect(await graph.boundingBox()).toEqual({x:root.x+42,y:root.y-3,width:133,height:32});
  const lo=page.getByTestId('frag-aggregate-icon-lo'),hi=page.getByTestId('frag-aggregate-icon-hi');
  await expect.poll(()=>lo.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
  await expect.poll(()=>hi.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
  expect(await lo.boundingBox()).toEqual({x:root.x+8,y:root.y+8,width:11,height:11});
  expect(await hi.boundingBox()).toEqual({x:root.x+190,y:root.y-3,width:28,height:32});
  expect((await column.boundingBox())!.height).toBe(32);
  expect(await column.evaluate(el=>getComputedStyle(el,'::after').bottom)).toBe('-0.5px');
  const zero=page.getByTestId('frag-aggregate-col-1');
  expect((await zero.boundingBox())!.height).toBe(0);
  expect(await zero.evaluate(el=>getComputedStyle(el,'::after').backgroundColor)).toBe('rgb(151, 151, 151)');
  await page.screenshot({path:info.outputPath(`species-controls-${scale}x.png`)});
 } finally {await context.close();}
});
