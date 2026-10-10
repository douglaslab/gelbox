import {test,expect} from '@playwright/test';
import {openSampleSettings} from './sample-helpers';
for(const scale of [1,2])for(const shared of [false,true])test.describe(`Buffer DPR${scale} shared:${shared}`,()=>{
 test.use({viewport:{width:1365,height:800},deviceScaleFactor:scale});
 test('presets apply on native mouse-down; concentration controls stay disabled and ordered',async({page},info)=>{
  await page.addInitScript(({backend,shared})=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation',shared?'1':'0');},{backend:info.project.name.endsWith('webgl2')?'webgl2':'webgpu',shared});
  await page.goto('/#/gel');
  for(const prefix of ['gel-buffer-view','sample-buffer-view']){
   if(prefix==='gel-buffer-view')await page.getByTestId('settings-button').click();
   else {await page.getByTestId('microtube-0').click();await openSampleSettings(page);}
   const buffer=page.getByTestId(prefix),presets=page.getByTestId(`${prefix}-presets`);
   if(shared)await expect(buffer).toHaveAttribute('data-shared-ready',`buffer-${scale}`);
   for(const [key,button] of [['TAE','left'],['H2O','right']] as const){
    const target=page.getByTestId(`${prefix}-preset-${key}`),r=(await target.boundingBox())!;
    await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down({button});
    await expect(target).toHaveAttribute('data-selected','true');
    await page.mouse.move(0,0);await page.mouse.up({button});
    await expect(target).toHaveAttribute('data-selected','true');
   }
   // Preserve the existing keyboard-accessible button action as well.
   await page.getByTestId(`${prefix}-preset-TBE`).focus();await page.keyboard.press('Enter');
   await expect(page.getByTestId(`${prefix}-preset-TBE`)).toHaveAttribute('data-selected','true');
   const tris=page.getByTestId(`${prefix}-tris`),track=page.getByTestId(`${prefix}-tris-track`);
   await expect(tris).toContainText('44.5 mM');await expect(tris).toHaveAttribute('aria-disabled','true');
   await page.getByTestId(`${prefix}-tris-icon-lo`).click();await page.getByTestId(`${prefix}-tris-icon-hi`).click();
   await track.click({position:{x:120,y:10}});await expect(tris).toContainText('44.5 mM');
   if(!shared)continue;
   for(const key of ['tris','borate','acetate','edta'])await expect(page.getByTestId(`${prefix}-${key}`)).toHaveAttribute('data-shared-ready','1');
   await page.mouse.move(0,0);
   const r=(await presets.boundingBox())!,area={x:r.x-60,y:r.y-3,width:240,height:165};
   const before=await page.screenshot({clip:area});
   await page.evaluate(async area=>{
    const w=Math.ceil(area.width+40),h=Math.ceil(area.height+40),canvas=new OffscreenCanvas(w,h),ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,w,h);
    const blob=await canvas.convertToBlob(),data=new DataTransfer();data.items.add(new File([blob],'cover.png',{type:'image/png'}));
    document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:data,clientX:area.x+area.width/2,clientY:area.y+area.height/2}));
   },area);
   await expect(page.getByTestId(/^reference-image-canvas-\d+$/)).toHaveAttribute('data-shared-ready','1');
   const png=await page.screenshot({clip:area});
   const nonWhite=await page.evaluate(async bytes=>{
    const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes)])),canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);bitmap.close();return [...ctx.getImageData(0,0,canvas.width,canvas.height).data].filter(v=>v!==255).length;
   },[...png]);expect(nonWhite).toBe(0);
   await page.keyboard.press('Delete');await expect(page.getByTestId(/^reference-image-\d+$/)).toHaveCount(0);
   expect(await page.screenshot({clip:area})).toEqual(before);
  }
 });
});
