import {test,expect} from '@playwright/test';
for(const scale of [1,2])test.describe(`slider integration DPR${scale}`,()=>{
 test.use({viewport:{width:1365,height:800},deviceScaleFactor:scale});
 test('real slider paint and values follow later image overlap',async({page},info)=>{
  await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto('/#/gel');
  const low=page.getByTestId('timeline-slider-icon-lo'),timeline=page.getByTestId('timeline-slider');
  await expect(timeline).toHaveAttribute('data-shared-ready','1');
  const lowRect=(await low.boundingBox())!;
  await page.mouse.move(lowRect.x+lowRect.width/2,lowRect.y+lowRect.height/2);
  const idle=await page.screenshot({clip:lowRect});
  await page.mouse.down();await expect(low).toHaveAttribute('data-highlighted','true');
  expect(await page.screenshot({clip:lowRect})).not.toEqual(idle);
  await page.mouse.move(0,0);await page.mouse.up();
  await expect(low).toHaveAttribute('data-highlighted','false');
  await expect(timeline).toContainText('3:00');
  expect(await page.screenshot({clip:lowRect})).toEqual(idle);
  await low.click();await expect(timeline).toContainText('0:00');
  await page.getByTestId('timeline-slider-icon-hi').click();await expect(timeline).toContainText('3:00');
  for(const kind of ['timeline','gel-settings','fragment']){
   if(kind==='timeline'){}
   else if(kind==='gel-settings')await page.getByTestId('settings-button').click();
   else if(kind==='sample-settings'){
    await page.getByTestId('microtube-2').click();
    await page.getByTestId('molecular-sim-canvas').click({position:{x:10,y:10}});
   }else {await page.getByTestId('microtube-2').click();await page.getByTestId('new-species').click();}
   await page.mouse.move(0,0);
   const controls=kind==='timeline'?['timeline-slider']:kind==='gel-settings'?['gel-lanes','gel-well-damage','gel-voltage','gel-rotate']:['frag-size','frag-mass','frag-aspect','frag-aggregate','frag-degrade'];
   const areas=[];
   for(const id of controls){
    const control=page.getByTestId(id);await expect(control).toHaveAttribute('data-shared-ready','1');const r=(await control.boundingBox())!;
    areas.push({x:r.x-3,y:r.y-5,width:r.width+6,height:r.height+27});
   }
   for(const area of areas){
    const before=await page.screenshot({clip:area});
    await page.evaluate(async({area})=>{
     const w=Math.ceil(area.width+40),h=Math.ceil(area.height+40),canvas=new OffscreenCanvas(w,h),ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,w,h);
     const blob=await canvas.convertToBlob(),data=new DataTransfer();data.items.add(new File([blob],'cover.png',{type:'image/png'}));
     document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:data,clientX:area.x+area.width/2,clientY:area.y+area.height/2}));
    },{area});
    await expect(page.getByTestId(/^reference-image-canvas-\d+$/)).toHaveAttribute('data-shared-ready','1');
    const png=await page.screenshot({clip:area});
    const nonWhite=await page.evaluate(async bytes=>{
     const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes)])),canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);bitmap.close();return [...ctx.getImageData(0,0,canvas.width,canvas.height).data].filter(v=>v!==255).length;
    },[...png]);expect(nonWhite).toBe(0);
    await page.keyboard.press('Delete');await expect(page.getByTestId(/^reference-image-\d+$/)).toHaveCount(0);
    expect(await page.screenshot({clip:area})).toEqual(before);
   }
  }
 });
});
