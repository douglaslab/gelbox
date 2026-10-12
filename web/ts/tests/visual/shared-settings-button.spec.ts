import {test,expect} from '@playwright/test';
import fs from 'node:fs';
for(const scale of [1,2])test.describe(`shared settings button DPR${scale}`,()=>{
 test.use({viewport:{width:1365,height:800},deviceScaleFactor:scale});
 test('icon belongs to gel order and can be covered by a later image',async({page},info)=>{
  await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto('/#/gel');const button=page.getByTestId('settings-button');
  await expect(button).toHaveAttribute('data-shared-ready','1');
  await button.click();await expect(page.getByTestId('gel-settings-view')).toBeVisible();
  await button.click();await expect(page.getByTestId('gel-settings-view')).toHaveCount(0);
  const r=(await button.boundingBox())!;
  // Opaque white image must cover the icon even though its DOM input remains.
  await page.evaluate(async({x,y})=>{
   const canvas=new OffscreenCanvas(64,64),ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,64,64);
   const blob=await canvas.convertToBlob(),data=new DataTransfer();data.items.add(new File([blob],'cover.png',{type:'image/png'}));
   document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:data,clientX:x,clientY:y}));
  },{x:r.x+16,y:r.y+16});
  await expect(page.getByTestId('reference-image-canvas-1')).toHaveAttribute('data-shared-ready','1');await page.mouse.move(0,0);
  const png=await page.screenshot({clip:{x:r.x+4,y:r.y+4,width:24,height:24}});
  await fs.promises.writeFile(info.outputPath('covered.png'),png);
  const nonWhite=await page.evaluate(async bytes=>{
   const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes)])),canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);bitmap.close();return [...ctx.getImageData(0,0,canvas.width,canvas.height).data].filter(v=>v!==255).length;
  },[...png]);expect(nonWhite).toBe(0);
  await page.keyboard.press('Delete');await expect(page.getByTestId('reference-image-1')).toHaveCount(0);
  await button.click();await expect(page.getByTestId('gel-settings-view')).toBeVisible();
 });
});
