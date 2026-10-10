import {test,expect} from '@playwright/test';
test('loupe hover and selection resolve to the source species in the open sample',async({page},info)=>{
 await page.addInitScript(b=>{localStorage.setItem('gelBackend',b);(window as any).__molsimFreezeAfterTicks=60;},info.project.name.includes('webgl2')?'webgl2':'webgpu');
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');
 await page.getByTestId('microtube-0').click();
 const band=page.getByTestId('band-0'),box=(await band.boundingBox())!;
 await page.keyboard.down('Meta');await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await page.keyboard.up('Meta');
 const canvas=page.getByTestId('loupe-canvas-1');await expect(canvas).toHaveAttribute('data-frozen','1');
 const png=await canvas.screenshot();
 const point=await page.evaluate(async bytes=>{
  const im=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
  const c=new OffscreenCanvas(im.width,im.height),ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);im.close();
  const d=ctx.getImageData(0,0,c.width,c.height).data;
  let sx=0,sy=0,n=0;
  for(let y=10;y<c.height-10;y++)for(let x=10;x<c.width-10;x++)if(d[(y*c.width+x)*4]<100){sx+=x+.5;sy+=y+.5;n++;}
  if(!n)throw new Error('No dark source molecule in loupe');
  return{x:sx/n/c.width,y:sy/n/c.height};
 },[...png]);
 const bounds=(await canvas.boundingBox())!;
 const x=bounds.x+point.x*bounds.width,y=bounds.y+point.y*bounds.height;
 await page.mouse.move(0,0);await expect(page.getByTestId('fragment-view')).toHaveCount(0);
 await page.mouse.move(x,y);
 await expect(page.getByTestId('fragment-view')).toBeVisible();
 await expect(band).not.toHaveAttribute('stroke','transparent');
 await page.mouse.click(x,y);await page.mouse.move(0,0);
 await expect(page.getByTestId('selection-info')).toContainText('lane 0 fragment 0');
 await expect(page.getByTestId('fragment-view')).toBeVisible();
 await expect(band).not.toHaveAttribute('stroke','transparent');
 // Empty loupe space clears source selection without changing the open panel.
 await page.mouse.click(bounds.x+10,bounds.y+bounds.height-10);await page.mouse.move(0,0);
 await expect(page.getByTestId('fragment-view')).toHaveCount(0);
 await expect(page.getByTestId('selection-info')).not.toContainText('fragment 0');
 await expect(page.getByTestId('molecular-sim-canvas')).toBeVisible();
 await page.mouse.click(x,y);await page.mouse.move(0,0);
 await expect(page.getByTestId('fragment-view')).toBeVisible();
 const gel=(await page.getByTestId('gel-overlay').boundingBox())!;
 await page.mouse.click(gel.x+gel.width*.95,gel.y+gel.height*.95);
 await expect(page.getByTestId('fragment-view')).toHaveCount(0);
 await expect(page.getByTestId('selection-info')).not.toContainText('fragment 0');
});

test('selecting a loupe molecule opens its source panel on the next native frame',async({page},info)=>{
 await page.addInitScript(b=>{localStorage.setItem('gelBackend',b);(window as any).__molsimFreezeAfterTicks=60;},info.project.name.includes('webgl2')?'webgl2':'webgpu');
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');
 const band=page.getByTestId('band-0'),box=(await band.boundingBox())!;
 await page.keyboard.down('Meta');await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await page.keyboard.up('Meta');
 const canvas=page.getByTestId('loupe-canvas-1');await expect(canvas).toHaveAttribute('data-frozen','1');
 const png=await canvas.screenshot();
 const point=await page.evaluate(async bytes=>{
  const im=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
  const c=new OffscreenCanvas(im.width,im.height),ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);im.close();
  const d=ctx.getImageData(0,0,c.width,c.height).data;
  let sx=0,sy=0,n=0;
  for(let y=10;y<c.height-10;y++)for(let x=10;x<c.width-10;x++)if(d[(y*c.width+x)*4]<100){sx+=x+.5;sy+=y+.5;n++;}
  if(!n)throw new Error('No dark source molecule in loupe');
  return{x:sx/n/c.width,y:sy/n/c.height};
 },[...png]);
 const bounds=(await canvas.boundingBox())!;
 await expect(page.getByTestId('sample-view')).toHaveCount(0);
 await page.mouse.click(bounds.x+point.x*bounds.width,bounds.y+point.y*bounds.height);
 await page.mouse.move(0,0);
 await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','0');
 await expect(page.getByTestId('selection-info')).toContainText('lane 0 fragment 0');
 await expect(page.getByTestId('fragment-view')).toBeVisible();
 await expect(page.getByTestId('loupe-frame-1')).toBeFocused();
});
