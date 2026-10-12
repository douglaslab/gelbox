import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';

test('zero-voltage downward band drag matches original native saved gel',async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
  const root=path.resolve('../reference/native/replay/zero-voltage');
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();await page.getByTestId('file-input').setInputFiles(path.join(root,'input.json'));
  await expect(menu).toHaveAttribute('aria-expanded','false');
  await expect(page.getByTestId('band-0')).toBeVisible();
  await page.mouse.click(236,144);
  await expect(page.getByTestId('fragment-view')).toBeVisible();
  const before=await page.getByTestId('band-0').boundingBox();
  await page.mouse.move(236,144);await page.mouse.down();await page.mouse.move(236,194);await page.mouse.up();
  expect(await page.getByTestId('band-0').boundingBox()).toEqual(before);
  await menu.click();const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
  const bytes=await readFile((await (await pending).path())!);
  expect(JSON.parse(bytes.toString())).toEqual(JSON.parse(await readFile(path.join(root,'native-down.json'),'utf8')));
  await writeFile(info.outputPath('web-down.json'),bytes);
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('after-down.png')});
 }finally{await app.close();}
});
