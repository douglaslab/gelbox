import {test,expect} from '@playwright/test';
for(const scale of [1,2])test.describe(`shared chrome DPR${scale}`,()=>{
 test.use({viewport:{width:1365,height:800},deviceScaleFactor:scale});
 test('application button, Help and inspector brace follow shared view order',async({page},info)=>{
  await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto('/#/gel');
  const app=page.getByRole('button',{name:'Application settings'}),help=page.getByRole('link',{name:'Help',exact:true});
  await expect(app).toHaveAttribute('data-shared-ready','1');await expect(help).toHaveAttribute('data-shared-ready','1');
  await page.getByTestId('settings-button').click();await expect(page.getByTestId('brace')).toHaveAttribute('data-shared-ready','1');
  for(const target of [app,help,page.getByTestId('brace')]){
   const r=(await target.boundingBox())!;const width=Math.ceil(r.width+48),height=Math.ceil(r.height+48);
   await page.evaluate(async({x,y,width,height})=>{
    const canvas=new OffscreenCanvas(width,height),ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,width,height);
    const data=new DataTransfer();data.items.add(new File([await canvas.convertToBlob()],'cover.png',{type:'image/png'}));
    document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:data,clientX:x,clientY:y}));
   },{x:r.x+r.width/2,y:r.y+r.height/2,width,height});
   const image=page.locator('[data-testid^="reference-image-canvas-"]');await expect(image).toHaveAttribute('data-shared-ready','1');await page.mouse.move(0,0);
   const png=await page.screenshot({clip:{x:r.x,y:r.y,width:r.width,height:r.height}});
   const nonWhite=await page.evaluate(async bytes=>{
    const b=await createImageBitmap(new Blob([new Uint8Array(bytes)])),c=new OffscreenCanvas(b.width,b.height),ctx=c.getContext('2d')!;ctx.drawImage(b,0,0);b.close();return [...ctx.getImageData(0,0,c.width,c.height).data].filter(v=>v!==255).length;
   },[...png]);expect(nonWhite).toBe(0);
   await page.keyboard.press('Delete');await expect(image).toHaveCount(0);
  }
  await app.click();await expect(page.getByTestId('save-gel-btn')).toBeVisible();
 });
});
