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
 }finally{await app.close();}
});
