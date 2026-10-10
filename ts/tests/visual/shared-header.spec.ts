import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const ladder=JSON.parse(fs.readFileSync('fixtures/states/ladder-1kb.json','utf8'));
for(const scale of [1,2])test.describe(`sample header integration DPR${scale}`,()=>{
 test.use({viewport:{width:1365,height:800},deviceScaleFactor:scale});
 test('native text and icon are covered by a later image without removing the accessible heading',async({page},info)=>{
  await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto('/#/gel');await page.getByTestId('microtube-0').click();
  await expect(page.getByTestId('sample-header')).toHaveAttribute('data-shared-ready','1');
  await expect(page.getByRole('heading',{name:'Sample',exact:true})).toHaveCount(1);
  const r=(await page.getByTestId('sample-view').boundingBox())!;
  const area={x:r.x+2,y:r.y-64,width:140,height:54};
  const before=await page.screenshot({clip:area});
  const nonWhite=async(png:Buffer)=>page.evaluate(async bytes=>{
   const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes)])),canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);bitmap.close();return [...ctx.getImageData(0,0,canvas.width,canvas.height).data].filter(v=>v!==255).length;
  },[...png]);
  expect(await nonWhite(before)).toBeGreaterThan(1000);
  await page.evaluate(async({x,y})=>{
   const canvas=new OffscreenCanvas(180,100),ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,180,100);
   const blob=await canvas.convertToBlob(),data=new DataTransfer();data.items.add(new File([blob],'cover.png',{type:'image/png'}));
   document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:data,clientX:x,clientY:y}));
  },{x:area.x+70,y:area.y+27});
  await expect(page.getByTestId('reference-image-canvas-1')).toHaveAttribute('data-shared-ready','1');await page.mouse.move(0,0);
  expect(await nonWhite(await page.screenshot({clip:area}))).toBe(0);
  await expect(page.getByRole('heading',{name:'Sample',exact:true})).toHaveCount(1);
  await page.keyboard.press('Delete');await expect(page.getByTestId('reference-image-1')).toHaveCount(0);
  expect(await page.screenshot({clip:area})).toEqual(before);
  await page.getByTestId('new-species').click();await expect(page.getByTestId('selection-info')).toContainText(`fragment ${ladder.fragments.length}`);
 });
});
