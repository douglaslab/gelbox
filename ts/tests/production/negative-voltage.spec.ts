import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';

test('negative-voltage upward band drag matches original native saved gel',async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
  const root=path.resolve('../reference/native/replay/negative-voltage');
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();await page.getByTestId('file-input').setInputFiles(path.join(root,'input.json'));
  await expect(menu).toHaveAttribute('aria-expanded','false');
  await expect(page.getByTestId('band-0')).toBeVisible();
  await page.mouse.click(236,138);
  await expect(page.getByTestId('fragment-view')).toBeVisible();
  await page.mouse.move(236,138);await page.mouse.down();await page.mouse.move(236,128);await page.mouse.up();
  await menu.click();const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
  const bytes=await readFile((await (await pending).path())!);
  const actual=JSON.parse(bytes.toString());
  const native=JSON.parse(await readFile(path.join(root,'native-up.json'),'utf8'));
  // Preserve imported decimal text in web saves; native parses Time as float32.
  expect(actual.Gel.Time).toBe(0.01);
  expect(native.Gel.Time).toBe(Math.fround(actual.Gel.Time));
  expect({...actual,Gel:{...actual.Gel,Time:Math.fround(actual.Gel.Time)}}).toEqual(native);
  await writeFile(info.outputPath('web-up.json'),bytes);
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('after-up.png')});
 }finally{await app.close();}
});
