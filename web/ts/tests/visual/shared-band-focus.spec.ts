import {test,expect} from '@playwright/test';
for(const scale of [1,2])test.describe(`gel focus composition DPR${scale}`,()=>{
 test.use({viewport:{width:1365,height:800},deviceScaleFactor:scale});
 test('selection and hover follow shared order in effects and direct rendering',async({page},info)=>{
  await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto('/#/gel');
  const band=page.getByTestId('band-0');await band.click();await page.mouse.move(0,0);
  for(const mode of ['effects','direct']){
   if(mode==='direct')await page.keyboard.press('Meta+r');
   await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode',mode);
   const r=(await band.boundingBox())!,area={x:r.x-3,y:r.y-3,width:r.width+6,height:r.height+6};
   const selected=await page.screenshot({clip:area});
   await band.hover();await expect(band).toHaveAttribute('stroke-opacity','1');
   expect(await page.screenshot({clip:area})).not.toEqual(selected);
   await page.mouse.move(0,0);await expect(band).toHaveAttribute('stroke-opacity','0.65');
   expect(await page.screenshot({clip:area})).toEqual(selected);
   await page.evaluate(async area=>{
    const w=Math.ceil(area.width+70),h=Math.ceil(area.height+70),canvas=new OffscreenCanvas(w,h),ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,w,h);
    const blob=await canvas.convertToBlob(),data=new DataTransfer();data.items.add(new File([blob],'cover.png',{type:'image/png'}));
    document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:data,clientX:area.x+area.width/2,clientY:area.y+area.height/2}));
   },area);
   await expect(page.getByTestId(/^reference-image-canvas-\d+$/)).toHaveAttribute('data-shared-ready','1');
   const png=await page.screenshot({clip:area});
   expect(await page.evaluate(async bytes=>{
    const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes)])),canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);bitmap.close();return [...ctx.getImageData(0,0,canvas.width,canvas.height).data].filter(v=>v!==255).length;
   },[...png])).toBe(0);
   await page.keyboard.press('Delete');await expect(page.getByTestId(/^reference-image-\d+$/)).toHaveCount(0);
   expect(await page.screenshot({clip:area})).toEqual(selected);
  }
 });
});
