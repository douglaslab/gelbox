import {test,expect} from '@playwright/test';
for(const scale of [1,2])test.describe(`sample paint integration DPR${scale}`,()=>{
 test.use({viewport:{width:1365,height:800},deviceScaleFactor:scale});
 test('later image covers the sample border and new-species button, then creation still works',async({page},info)=>{
  await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto('/#/gel');await page.getByTestId('microtube-2').click();
  const panel=page.getByTestId('sample-view'),button=page.getByTestId('new-species');
  await expect(panel).toHaveAttribute('data-shared-frame-ready','1');await expect(button).toHaveAttribute('data-shared-ready','1');
  await panel.focus();await page.mouse.move(0,0);
  const r=(await panel.boundingBox())!,area={x:r.x+r.width-40,y:r.y+r.height-6,width:60,height:60};
  const before=await page.screenshot({clip:area});
  await page.evaluate(async({x,y})=>{
   const canvas=new OffscreenCanvas(100,100),ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,100,100);
   const blob=await canvas.convertToBlob(),data=new DataTransfer();data.items.add(new File([blob],'cover.png',{type:'image/png'}));
   document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:data,clientX:x,clientY:y}));
  },{x:area.x+30,y:area.y+30});
  await expect(page.getByTestId('reference-image-canvas-1')).toHaveAttribute('data-shared-ready','1');
  const png=await page.screenshot({clip:area});
  const nonWhite=await page.evaluate(async bytes=>{
   const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes)])),canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);bitmap.close();return [...ctx.getImageData(0,0,canvas.width,canvas.height).data].filter(v=>v!==255).length;
  },[...png]);expect(nonWhite).toBe(0);
  // Covered input must belong to the later image, not activate the button below.
  const b=(await button.boundingBox())!;await page.mouse.click(b.x+16,b.y+16);
  await expect(page.getByTestId('fragment-view')).toHaveCount(0);
  await page.keyboard.press('Delete');await expect(page.getByTestId('reference-image-1')).toHaveCount(0);
  await panel.focus();await page.mouse.move(0,0);expect(await page.screenshot({clip:area})).toEqual(before);
  // Release outside cancels the click; release inside creates exactly one species.
  await page.mouse.move(b.x+16,b.y+16);await page.mouse.down();await page.mouse.move(0,0);await page.mouse.up();
  await expect(page.getByTestId('fragment-view')).toHaveCount(0);
  await button.click();await expect(page.getByTestId('selection-info')).toContainText('lane 2 fragment 0:');
  await expect(panel).toBeFocused();await page.keyboard.press('Backspace');await expect(page.getByTestId('fragment-view')).toHaveCount(0);
 });
});
