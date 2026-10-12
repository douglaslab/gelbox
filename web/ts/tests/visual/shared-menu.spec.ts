import {test,expect} from '@playwright/test';
for(const shared of [false,true])test(`shared=${shared} native menu press preview, release outside, secondary buttons and keyboard`,async({page},info)=>{
 await page.addInitScript(({backend,shared})=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation',shared?'1':'0');},{backend:info.project.name.endsWith('webgl2')?'webgl2':'webgpu',shared});
 await page.goto('/#/gel');await page.getByRole('button',{name:'Application settings'}).click();
 if(shared)await expect(page.locator('#application-file-menu')).toHaveAttribute('data-shared-ready','menu');
 const render=page.getByRole('checkbox',{name:'Render',exact:true}),label=render.locator('..');
 for(const button of ['left','right','middle'] as const){
  const old=await render.isChecked(),r=(await label.boundingBox())!;
  await page.mouse.move(r.x+r.width-2,r.y+8);
  const idle=await label.screenshot();
  await page.mouse.down({button});await expect(label).toHaveAttribute('data-menu-down','true');
  expect(await render.isChecked()).toBe(old);
  expect(await label.screenshot()).not.toEqual(idle);
  await page.mouse.move(300,780);await expect(label).toHaveAttribute('data-menu-down','false');
  await page.mouse.up({button});expect(await render.isChecked()).toBe(old);
  expect(await label.screenshot()).toEqual(idle);
  await page.mouse.move(r.x+r.width-2,r.y+8);await page.mouse.down({button});await page.mouse.up({button});
  expect(await render.isChecked()).toBe(!old);
 }
 const before=await render.isChecked();await render.focus();await page.keyboard.press('Space');expect(await render.isChecked()).toBe(!before);
 const save=page.getByTestId('save-gel-btn');const b=(await save.boundingBox())!;
 await page.mouse.move(b.x+4,b.y+4);await page.mouse.down({button:'right'});await expect(save).toHaveAttribute('data-menu-down','true');
 await page.mouse.move(300,780);await page.mouse.up({button:'right'});await expect(save).toBeVisible();
 const download=page.waitForEvent('download');await save.click({button:'right'});await download;await expect(save).toHaveCount(0);
 await page.getByRole('button',{name:'Application settings'}).click();await save.focus();
 const keyboard=page.waitForEvent('download');await page.keyboard.press('Enter');await keyboard;await expect(save).toHaveCount(0);
});
for(const scale of [1,2])test.describe(`menu composition DPR${scale}`,()=>{
 test.use({viewport:{width:1365,height:800},deviceScaleFactor:scale});
 test('later image covers and restores all application menu paint',async({page},info)=>{
  await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto('/#/gel');await page.getByTestId('microtube-0').click();await page.getByRole('button',{name:'Application settings'}).click();
  await expect(page.locator('#application-file-menu')).toHaveAttribute('data-shared-ready','menu');await expect(page.getByTestId('application-menu-divider')).toHaveAttribute('data-shared-ready','1');
  await page.mouse.move(0,0);
  const area={x:10,y:580,width:150,height:165},before=await page.screenshot({clip:area});
  await page.evaluate(async area=>{
   const canvas=new OffscreenCanvas(220,235),ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,220,235);
   const blob=await canvas.convertToBlob(),data=new DataTransfer();data.items.add(new File([blob],'cover.png',{type:'image/png'}));
   document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:data,clientX:area.x+area.width/2,clientY:area.y+area.height/2}));
  },area);
  await expect(page.getByTestId(/^reference-image-canvas-\d+$/)).toHaveAttribute('data-shared-ready','1');
  const png=await page.screenshot({clip:area,path:info.outputPath('covered.png')});
  expect(await page.evaluate(async bytes=>{
   const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes)])),canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);bitmap.close();return [...ctx.getImageData(0,0,canvas.width,canvas.height).data].filter(v=>v!==255).length;
  },[...png])).toBe(0);
  await page.keyboard.press('Delete');await expect(page.getByTestId(/^reference-image-\d+$/)).toHaveCount(0);
  expect(await page.screenshot({clip:area})).toEqual(before);
 });
});
