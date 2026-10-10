import {test,expect} from '@playwright/test';
import {openSampleSettings} from './sample-helpers';
for(const scale of [1,2])for(const shared of [false,true])test.describe(`dye controls DPR${scale} shared:${shared}`,()=>{
 test.use({viewport:{width:1365,height:800},deviceScaleFactor:scale});
 test('native bar geometry, label and molecule endpoint actions, and image covering',async({page},info)=>{
  await page.addInitScript(({backend,shared})=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation',shared?'1':'0');},{backend:info.project.name.endsWith('webgl2')?'webgl2':'webgpu',shared});
  await page.goto('/#/gel');await page.getByTestId('microtube-0').click();await openSampleSettings(page);
  for(let dye=0;dye<4;dye++){
   const slider=page.getByTestId(`dye-row-${dye}-slider`),track=page.getByTestId(`dye-row-${dye}-slider-track`),low=page.getByTestId(`dye-row-${dye}-slider-icon-lo`),high=page.getByTestId(`dye-row-${dye}-slider-icon-hi`);
   if(shared)await expect(slider).toHaveAttribute('data-shared-ready','1');
   await expect.poll(()=>high.evaluate((im:HTMLImageElement)=>im.naturalWidth>0)).toBe(true);
   const r=(await track.boundingBox())!;
   expect(r.width).toBe(135);expect(r.height).toBe(23);
   const hi=(await high.boundingBox())!,lo=(await low.boundingBox())!;
   expect(hi.x).toBe(r.x+135+13);expect(lo.x+lo.width).toBe(r.x-13);
   await high.click();await expect(slider).toContainText('125 mM');
   await low.click();await expect(slider).toContainText('0 mM');
   await page.mouse.click(r.x+r.width/2,r.y+r.height/2);await expect(slider).toContainText('63 mM');
   await expect(slider.getByText('63 mM',{exact:true})).toHaveCSS('color','rgb(0, 0, 0)');
   if(!shared)continue;
   await page.mouse.move(0,0);
   const area={x:lo.x-2,y:Math.min(lo.y,hi.y,r.y)-2,width:hi.x+hi.width-lo.x+4,height:Math.max(lo.y+lo.height,hi.y+hi.height,r.y+r.height)-Math.min(lo.y,hi.y,r.y)+4};
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
