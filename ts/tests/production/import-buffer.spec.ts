import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';

test('compiled import keeps the open gel buffer panel bound to the loaded document',async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  await page.getByTestId('settings-button').click();
  const panel=page.getByTestId('gel-buffer-view');
  await expect(panel.getByText('44.5 mM',{exact:true})).toHaveCount(2);
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();
  const fixture=path.resolve('../reference/native/files/interop/gel/webgpu-edited.json');
  const input=JSON.parse(await readFile(fixture,'utf8'));
  await page.getByTestId('file-input').setInputFiles(fixture);
  await expect(menu).toHaveAttribute('aria-expanded','false');
  await expect(panel.getByText('12.5 mM',{exact:true})).toHaveCount(1);
  await expect(panel.getByText('8.5 mM',{exact:true})).toHaveCount(1);
  await page.getByTestId('gel-buffer-view-preset-H2O').click();
  await expect(panel.getByText('0.0 mM',{exact:true})).toHaveCount(4);
  await menu.click();
  const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
  const output=JSON.parse(await readFile((await (await pending).path())!,'utf8'));
  expect(output).toEqual({...input,Gel:{...input.Gel,Buffer:{Tris:0,Borate:0,Acetate:0,EDTA:0}}});
  await info.attach('web-after-h2o.json',{body:JSON.stringify(output,null,2),contentType:'application/json'});
 }finally{await app.close();}
});
