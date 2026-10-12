import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const root='../reference/native/files/interop/case-keys';
for(const [name,type] of [['sample-mixed','sample'],['gel-mixed','gel']] as const){
 test(`native case-insensitive ${type} fields survive Open and Save`,async({page},info)=>{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto('/#/gel');
  const settings=page.getByRole('button',{name:'Application settings'});
  await settings.click();
  await page.getByTestId('file-input').setInputFiles(path.resolve(root,name+'.input.json'));
  await expect(settings).toHaveAttribute('aria-expanded','false');
  if(type==='sample')await page.getByTestId('microtube-1').click();
  await settings.click();
  const pending=page.waitForEvent('download');await page.getByTestId(type==='sample'?'save-sample-btn':'save-gel-btn').click();
  const doc=JSON.parse(await fs.readFile((await(await pending).path())!,'utf8'));
  const expected=JSON.parse(await fs.readFile(path.resolve(root,name+'.native.json'),'utf8'));
  expected.Gelbox={version:'1.0',type};
  expect(doc).toEqual(expected);
 });
}
