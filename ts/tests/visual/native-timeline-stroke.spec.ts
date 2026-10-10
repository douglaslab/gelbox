import {test,expect} from '@playwright/test';
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
test('timeline track matches native half-covered Retina rows',async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');await expect(page.getByTestId('gel-well-0')).toBeVisible();
 await expect.poll(async()=>{
 const png=await page.screenshot();
 return await page.evaluate(async base64=>{
  const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
  const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);
  return Array.from({length:15},(_,i)=>[1340+i,ctx.getImageData(650,1340+i,1,1).data[0]]).filter(([,v])=>v<255);
 },png.toString('base64'));
 // Independent native framebuffer and user-supplied lossless screen capture agree.
 }).toEqual([[1346,203],[1347,203]]);
});
