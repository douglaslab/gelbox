import {test,expect} from '@playwright/test';
import {serveBuiltApp} from './built-app';
for(const button of ['left','right','middle'] as const)test(`compiled editing and ${button} loupe gestures survive mode changes and resize`,async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/'),errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.addInitScript(backend=>localStorage.setItem('gelBackend',backend),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  await page.getByTestId('microtube-0').click();
  await page.getByRole('button',{name:'New species',exact:true}).click();
  const color=page.getByRole('button',{name:'Color 1: #0066cc',exact:true});
  await color.click();await expect(color).toHaveAttribute('aria-pressed','true');
  await expect(page.getByTestId('fragment-representative')).toHaveAttribute('data-shared-ready','1');
  await page.getByTestId('settings-button').click();
  await page.getByRole('button',{name:'H2O',exact:true}).click();
  await expect(page.getByTestId('gel-buffer-view').getByText('0.0 mM',{exact:true})).toHaveCount(4);
  await page.getByRole('button',{name:'.5x TBE',exact:true}).click();
  await expect(page.getByTestId('gel-buffer-view').getByText('44.5 mM',{exact:true})).toHaveCount(2);
  await page.getByTestId('settings-button').click();
  const b=(await page.getByTestId('band-0').boundingBox())!,x=Math.floor(b.x+b.width/2),y=Math.floor(b.y+b.height/2);
  await page.keyboard.down('Meta');await page.mouse.click(x,y);await page.keyboard.up('Meta');
  const frame=page.getByTestId('loupe-frame-1'),canvas=page.getByTestId('loupe-canvas-1'),anchor=page.getByTestId('loupe-anchor-1');
  await expect(frame).toBeFocused();await expect(canvas).toHaveAttribute('data-shared-ready','1');
  await expect.poll(async()=>Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
  const f=(await frame.boundingBox())!;
  await page.mouse.move(f.x+10,f.y+155);await page.mouse.down({button});await page.mouse.move(f.x+40,f.y+175);await page.mouse.up({button});
  const moved=(await frame.boundingBox())!;expect(moved.x-f.x).toBeCloseTo(30,1);expect(moved.y-f.y).toBeCloseTo(20,1);
  await page.mouse.move(x,y);await page.mouse.down({button});await page.mouse.move(x+12,y+10);await page.mouse.up({button});
  let a=(await anchor.boundingBox())!;expect(a.x+a.width/2).toBeCloseTo(x+12,1);expect((await frame.boundingBox())!.x).toBeCloseTo(moved.x,1);
  const wx=Math.floor((x+12+moved.x)/2),wy=y+10;
  await page.mouse.move(wx,wy);await page.mouse.down({button});await page.mouse.move(wx+18,wy+9);await page.mouse.up({button});
  a=(await anchor.boundingBox())!;expect(a.x+a.width/2).toBeCloseTo(x+30,1);expect((await frame.boundingBox())!.x).toBeCloseTo(moved.x+18,1);
  const menu=page.getByRole('button',{name:'Application settings'});await menu.click();
  const render=page.getByRole('checkbox',{name:'Render',exact:true});
  await page.mouse.move(0,0);
  const gelPaint=()=>page.getByTestId('gel-overlay').screenshot();
  const effects=await gelPaint();
  await render.uncheck();await expect(render).not.toBeChecked();await expect(canvas).toHaveAttribute('data-shared-ready','1');
  await page.mouse.move(0,0);expect((await gelPaint()).equals(effects),'Render off must change gel pixels').toBe(false);
  await render.check();await expect(render).toBeChecked();
  await page.mouse.move(0,0);expect(await gelPaint(),'Render on must restore gel pixels').toEqual(effects);
  await menu.click();
  const gel=page.getByTestId('gel-overlay'),oldGel=(await gel.boundingBox())!,oldFrame=(await frame.boundingBox())!;
  await page.setViewportSize({width:1465,height:868});
  await expect.poll(async()=>(await gel.boundingBox())!.x).toBe(oldGel.x+40);
  const resized=(await frame.boundingBox())!;expect(resized.x-oldFrame.x).toBeCloseTo(40,1);
  await frame.focus();await page.keyboard.press('Delete');await expect(frame).toHaveCount(0);
  expect(errors).toEqual([]);await expect(page.getByRole('alert')).toHaveCount(0);
  expect(app.outside.filter(p=>p!=='/favicon.ico')).toEqual([]);
 }finally{await app.close();}
});

test('compiled macOS pointer gestures distinguish Control from Command',async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  expect(await page.evaluate(()=>navigator.platform)).toMatch(/Mac/);
  for(const target of ['microtube-0','band-0']){
   await page.keyboard.down('Control');
   try{await page.getByTestId(target).click();}finally{await page.keyboard.up('Control');}
   await expect(page.locator('[data-loupe-id]')).toHaveCount(0);
   await page.keyboard.down('Meta');
   try{await page.getByTestId(target).click();}finally{await page.keyboard.up('Meta');}
   await expect(page.locator('[data-loupe-id]')).toHaveCount(1);
   await page.locator('[data-testid^="loupe-frame-"]').focus();
   await page.keyboard.press('Delete');
   await expect(page.locator('[data-loupe-id]')).toHaveCount(0);
  }
  await expect(page.getByTestId('microtube-0')).not.toHaveAttribute('data-empty','true');
 }finally{await app.close();}
});

test('compiled Windows platform branch uses Control consistently for loupe and Render',async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>{
   localStorage.setItem('gelBackend',b);
   Object.defineProperty(navigator,'platform',{configurable:true,value:'Win32'});
  },info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const band=(await page.getByTestId('band-0').boundingBox())!;
  await page.mouse.move(band.x+band.width/2,band.y+band.height/2);
  await page.keyboard.down('Control');await expect(page.getByTestId('hover-loupe')).toBeVisible();
  await page.mouse.click(band.x+band.width/2,band.y+band.height/2);await page.keyboard.up('Control');
  await expect(page.locator('[data-loupe-id]')).toHaveCount(1);
  await page.locator('[data-testid^="loupe-frame-"]').focus();await page.keyboard.press('Delete');
  await expect(page.locator('[data-loupe-id]')).toHaveCount(0);
  // Re-establish gel rollover after removing the focused loupe/probe.
  await page.mouse.move(band.x+band.width/2+1,band.y+band.height/2);
  await page.keyboard.press('Control+l');await expect(page.getByTestId('hover-loupe')).toBeVisible();
  await page.keyboard.press('Control+l');await expect(page.getByTestId('hover-loupe')).toHaveCount(0);
  await page.getByRole('button',{name:'Application settings'}).click();
  const render=page.getByRole('checkbox',{name:'Render',exact:true});
  await page.keyboard.press('Control+r');await expect(render).not.toBeChecked();
  await page.keyboard.press('Control+r');await expect(render).toBeChecked();
 }finally{await app.close();}
});
