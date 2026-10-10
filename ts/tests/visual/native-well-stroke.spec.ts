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

import fs from 'node:fs';
const nativeWindow=fs.readFileSync('../reference/native/modern/lossless-probe/user-startup.png').toString('base64');
for(const mode of ['effects','direct'])test(`complete well outlines match native in ${mode} mode`,async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');
 if(mode==='direct')await page.keyboard.press('Meta+r');
 await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode',mode);
 await expect(async()=>{
  const screenshot=(await page.screenshot()).toString('base64');
  const count=await page.evaluate(async({nativeWindow,screenshot})=>{
   const decode=async(png:string,titlebar:number)=>{const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();const canvas=document.createElement('canvas');canvas.width=780;canvas.height=50;const ctx=canvas.getContext('2d')!;ctx.drawImage(image,416,260+titlebar,780,50,0,0,780,50);return ctx.getImageData(0,0,780,50).data;};
   const [native,web]=await Promise.all([decode(nativeWindow,64),decode(screenshot,0)]);let count=0;for(let i=0;i<native.length;i++)if(native[i]!==web[i])count++;return count;
  },{nativeWindow,screenshot});
  expect(count).toBe(0);
 }).toPass({timeout:5000});
 await expect(page.getByTestId('gel-well-0')).toHaveAttribute('stroke','none');
 await expect(page.getByTestId('gel-canvas')).toHaveAttribute('width','780');
 await page.screenshot({path:info.outputPath(`wells-${mode}.png`)});
});
