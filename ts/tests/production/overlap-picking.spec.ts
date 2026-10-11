import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';

test('native tied-band deletion and persistent loupe tube move-return',async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
  const root=path.resolve('../reference/native/replay/overlap-picking');
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();await page.getByTestId('file-input').setInputFiles(path.join(root,'input.json'));
  await expect(menu).toHaveAttribute('aria-expanded','false');
  await expect(page.getByTestId('band-0')).toBeVisible();
  await page.mouse.click(236,400);
  await expect(page.getByTestId('fragment-view')).toBeVisible();
  await page.keyboard.press('Backspace');
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(1);
  await menu.click();const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
  const bytes=await readFile((await (await pending).path())!);
  expect(JSON.parse(bytes.toString())).toEqual(JSON.parse(await readFile(path.join(root,'native-after-delete.json'),'utf8')));
  await writeFile(info.outputPath('web-after-delete.json'),bytes);
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('after-delete.png')});
  if(await menu.getAttribute('aria-expanded')==='true')await menu.click();
  // The native manual Command-click used this slightly offset band position.
  await page.keyboard.down('Meta');await page.mouse.click(239,401);await page.keyboard.up('Meta');
  const frame=page.getByTestId('loupe-frame-1'),canvas=page.getByTestId('loupe-canvas-1');
  const anchor=page.getByTestId('loupe-anchor-1');
  await expect.poll(async()=>Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
  const initialFrame=await frame.boundingBox();
  const anchorCenter=()=>anchor.evaluate(el=>[el.getAttribute('cx'),el.getAttribute('cy')]);
  const initialAnchor=await anchorCenter();
  const originalFrame=await frame.elementHandle(),originalCanvas=await canvas.elementHandle();
  // Reproduce the observed extra-loupe gesture explicitly. The native app
  // appeared to retain Command across the manual/automation handoff; its cause
  // is not established, and this test does not assert a browser sticky modifier.
  await page.mouse.click(700,22);
  await page.keyboard.down('Meta');await page.mouse.move(236,92);await page.mouse.down();
  await page.mouse.move(292,92);await page.mouse.up();await page.keyboard.up('Meta');
  await expect(page.getByTestId('loupe-frame-2')).toBeVisible();
  await page.keyboard.press('a');
  await page.mouse.move(236,92);await page.mouse.down();await page.mouse.move(292,92);await page.mouse.up();
  await page.mouse.click(460,52);await page.keyboard.press('Escape');
  await expect(page.getByTestId('loupe-frame-2')).toHaveCount(0);
  const checkpoint=async(name:string)=>{
   // Focus changes the SVG circle stroke width, not its center.
   expect(await frame.boundingBox()).toEqual(initialFrame);expect(await anchorCenter()).toEqual(initialAnchor);
   expect(await originalFrame!.evaluate(el=>el===document.querySelector('[data-testid="loupe-frame-1"]'))).toBe(true);
   expect(await originalCanvas!.evaluate(el=>el===document.querySelector('[data-testid="loupe-canvas-1"]'))).toBe(true);
   await menu.click();const download=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
   const saved=await readFile((await (await download).path())!);
   expect(JSON.parse(saved.toString())).toEqual(JSON.parse(await readFile(path.join(root,`native-loupe-${name}.json`),'utf8')));
   await writeFile(info.outputPath(`web-loupe-${name}.json`),saved);
   if(await menu.getAttribute('aria-expanded')==='true')await menu.click();
   await page.mouse.move(0,0);await page.screenshot({path:info.outputPath(`loupe-${name}.png`)});
  };
  await expect(canvas).toHaveAttribute('data-alive-count','0');await checkpoint('away');
  await page.keyboard.press('a');await page.mouse.move(292,92);await page.mouse.down();await page.mouse.move(236,92);await page.mouse.up();
  await expect.poll(async()=>Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
  await checkpoint('return');
  // Continue the original-native left-button frame, probe and wedge trace.
  const drag=async(x:number,y:number,toX:number,toY:number)=>{
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(toX,toY);await page.mouse.up();
  };
  await drag(350,467,380,487);
  await expect(page.getByTestId('sample-view')).toHaveCount(0);
  expect(await frame.boundingBox()).toEqual({...initialFrame!,x:initialFrame!.x+30,y:initialFrame!.y+20});
  expect(await anchorCenter()).toEqual(initialAnchor);
  await expect.poll(async()=>Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
  await drag(239,401,295,401);
  expect(await frame.boundingBox()).toEqual({...initialFrame!,x:initialFrame!.x+30,y:initialFrame!.y+20});
  expect(await anchorCenter()).toEqual([String(Number(initialAnchor[0])+56),initialAnchor[1]]);
  await expect(canvas).toHaveAttribute('data-alive-count','0');
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('loupe-probe-empty.png')});
  await drag(325,401,269,401);
  expect(await frame.boundingBox()).toEqual({...initialFrame!,x:initialFrame!.x-26,y:initialFrame!.y+20});
  expect(await anchorCenter()).toEqual([String(Number(initialAnchor[0])+56-56),initialAnchor[1]]);
  await expect.poll(async()=>Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
  // Pick the visible molecule, as in the native trace. Particle positions are
  // not asserted identical between independently running applications.
  await page.mouse.move(0,0);
  const pixels=await canvas.screenshot();
  const point=await page.evaluate(async bytes=>{
   const im=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
   const c=new OffscreenCanvas(im.width,im.height),ctx=c.getContext('2d')!;
   ctx.drawImage(im,0,0);im.close();const data=ctx.getImageData(0,0,c.width,c.height).data;
   let xSum=0,ySum=0,count=0;
   for(let y=5;y<c.height-5;y++)for(let x=5;x<c.width-5;x++){
    const i=(y*c.width+x)*4;
    if(data[i]<80&&data[i+1]>60&&data[i+1]>data[i]*2&&data[i+2]<100){xSum+=x+.5;ySum+=y+.5;count++;}
   }
   if(!count)throw new Error('No visible green molecule in loupe');
   return{x:xSum/count/c.width,y:ySum/count/c.height};
  },[...pixels]);
  const bounds=(await canvas.boundingBox())!;
  await page.mouse.click(bounds.x+point.x*bounds.width,bounds.y+point.y*bounds.height);
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','0');
  await expect(page.getByTestId('fragment-view')).toBeVisible();
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('loupe-source-selected.png')});
  await page.mouse.click(320,492);await page.mouse.move(0,0);
  await expect(page.getByTestId('sample-view')).toHaveCount(0);
  await expect(page.getByTestId('fragment-view')).toHaveCount(0);
  expect(await originalCanvas!.evaluate(el=>el===document.querySelector('[data-testid="loupe-canvas-1"]'))).toBe(true);
  await menu.click();const finalDownload=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
  const finalBytes=await readFile((await (await finalDownload).path())!);
  expect(JSON.parse(finalBytes.toString())).toEqual(JSON.parse(await readFile(path.join(root,'native-loupe-gestures.json'),'utf8')));
  await writeFile(info.outputPath('web-loupe-gestures.json'),finalBytes);
  if(await menu.getAttribute('aria-expanded')==='true')await menu.click();
  await page.getByTestId('settings-button').click();
  const bufferFrame=await frame.boundingBox(),bufferAnchor=await anchorCenter();
  let waterGel:Buffer|undefined;
  for(const preset of ['H2O','TBE']){
   await page.getByTestId(`gel-buffer-view-preset-${preset}`).click();await page.mouse.move(0,0);
   await expect(page.getByTestId('sample-view')).toHaveCount(0);
   await expect.poll(async()=>Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
   expect(await frame.boundingBox()).toEqual(bufferFrame);expect(await anchorCenter()).toEqual(bufferAnchor);
   expect(await originalCanvas!.evaluate(el=>el===document.querySelector('[data-testid="loupe-canvas-1"]'))).toBe(true);
   const gelPixels=await page.getByTestId('gel-overlay').screenshot();
   if(preset==='H2O')waterGel=gelPixels;else expect(gelPixels).not.toEqual(waterGel);
   await page.screenshot({path:info.outputPath(`loupe-buffer-${preset.toLowerCase()}.png`)});
   await menu.click();const pendingBuffer=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
   const savedBuffer=await readFile((await (await pendingBuffer).path())!);
   expect(JSON.parse(savedBuffer.toString())).toEqual(JSON.parse(await readFile(path.join(root,`native-loupe-${preset.toLowerCase()}.json`),'utf8')));
   await writeFile(info.outputPath(`web-loupe-${preset.toLowerCase()}.json`),savedBuffer);
   if(await menu.getAttribute('aria-expanded')==='true')await menu.click();
  }
  await page.mouse.click(805,383);await expect(page.getByTestId(/^microtube-\d+$/)).toHaveCount(12);
  await page.getByTestId('settings-button').click();await page.keyboard.press('a');
  await drag(224,101,582,101);await drag(239,401,582,401);
  await page.getByTestId('settings-button').click();
  await expect.poll(async()=>Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
  const hiddenFrame=await frame.boundingBox(),hiddenAnchor=await anchorCenter();
  for(const lanes of [7,12]){
   await page.mouse.click(lanes===7?725:805,383);
   await expect(page.getByTestId(/^microtube-\d+$/)).toHaveCount(lanes);
   await expect(page.getByTestId('sample-view')).toHaveCount(0);
   if(lanes===7)await expect(canvas).toHaveAttribute('data-alive-count','0');
   else await expect.poll(async()=>Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
   expect(await frame.boundingBox()).toEqual(hiddenFrame);expect(await anchorCenter()).toEqual(hiddenAnchor);
   expect(await originalCanvas!.evaluate(el=>el===document.querySelector('[data-testid="loupe-canvas-1"]'))).toBe(true);
   await page.mouse.move(0,0);await page.screenshot({path:info.outputPath(`loupe-lanes-${lanes}.png`)});
   await menu.click();const pendingLanes=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
   const laneBytes=await readFile((await (await pendingLanes).path())!);
   const native=JSON.parse(await readFile(path.join(root,lanes===7?'native-loupe-hidden-seven.json':'native-loupe-restored-twelve.json'),'utf8'));
   // D01: native keyed Samples loses positions. Preserve the observed lane12
   // layout and compare every native sample/gel field without numeric changes.
   if(lanes===12)native.Gel.Samples=[...Array(11).fill(null),native.Gel.Samples.Sample];
   expect(JSON.parse(laneBytes.toString())).toEqual(native);
   await writeFile(info.outputPath(`web-loupe-lanes-${lanes}.json`),laneBytes);
   if(await menu.getAttribute('aria-expanded')==='true')await menu.click();
  }
 }finally{await app.close();}
});
