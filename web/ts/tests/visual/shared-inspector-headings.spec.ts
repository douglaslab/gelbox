import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const native=JSON.parse(fs.readFileSync('../reference/native/modern/shared-inspector-headings/metrics.json','utf8'));
for(const scale of [1,2])test.describe(`inspector heading integration DPR${scale}`,()=>{
 test.use({viewport:{width:1365,height:800},deviceScaleFactor:scale});
 test('real inspector headings and dividers follow image overlap through panel switches',async({page},info)=>{
  await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto('/#/gel');
  for(const kind of ['gel-settings','sample-settings','fragment']){
   if(kind==='gel-settings')await page.getByTestId('settings-button').click();
   else if(kind==='sample-settings'){
    await page.getByTestId('microtube-2').click();
    await page.getByTestId('molecular-sim-canvas').click({position:{x:10,y:10}});
   }else await page.getByTestId('new-species').click();
   const panel=page.getByTestId(kind==='fragment'?'fragment-view':`${kind}-view`);
   await expect(panel).toBeVisible();await expect(page.getByTestId('inspector-headings')).toHaveAttribute('data-shared-ready',`${kind}-${scale}`);
   await page.mouse.move(0,0);
   const r=(await panel.boundingBox())!,scene=native[kind][scale];
   const areas=scene.textures.map((t:any)=>{const [x1,y1,x2,y2]=t.rect;return {x:r.x+x1-2,y:r.y+y1-2,width:x2-x1+4,height:y2-y1+4};});
   if(scene.rule){const [x1,y1,x2]=scene.rule;areas.push({x:r.x+x1,y:r.y+y1-2,width:x2-x1,height:4});}
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
    await expect(panel.getByRole('heading',{level:2})).toHaveCount(1);
    await page.keyboard.press('Delete');await expect(page.getByTestId(/^reference-image-\d+$/)).toHaveCount(0);
    expect(await page.screenshot({clip:area})).toEqual(before);
   }
  }
 });
});
