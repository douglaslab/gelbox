import {test,expect} from '@playwright/test';
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
test('startup wells match native one-physical-pixel horizontal strokes',async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');await expect(page.getByTestId('gel-well-0')).toBeVisible();
 await expect.poll(async()=>{
 const png=await page.screenshot();
 return await page.evaluate(async base64=>{
  const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
  const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);
  return Array.from({length:50},(_,i)=>[260+i,ctx.getImageData(470,260+i,1,1).data[0]]).filter(([,v])=>v>0);
 },png.toString('base64'));
 // Independent native framebuffer and user-supplied lossless screen capture agree.
 }).toEqual([[282,163],[293,163]]);
});
