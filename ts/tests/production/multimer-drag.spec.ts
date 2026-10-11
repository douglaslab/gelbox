import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';

test('compiled degraded multimer transfer and vertical drag match original native sample',async({page},info)=>{
 const root=path.resolve('../reference/native/replay/multimer-drag');
 const native=async(name:string)=>JSON.parse(await readFile(path.join(root,name),'utf8'));
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();await page.getByTestId('file-input').setInputFiles(path.resolve('../reference/native/replay/hidden-lanes/input-twelve.json'));
  // Native screenshot coordinates / 2, subtracting its 28 logical pixel title bar.
  await page.mouse.click(582,231);
  await expect(page.getByTestId('fragment-view')).toContainText('2,500 bp');
  const drag=async(x:number,y:number,tx:number,ty:number)=>{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(tx,ty,{steps:10});await page.mouse.up();};
  const save=async(kind:'sample'|'gel',name:string)=>{
   await menu.click();const pending=page.waitForEvent('download');await page.getByTestId(`save-${kind}-btn`).click();
   const bytes=await readFile((await (await pending).path())!);await writeFile(info.outputPath(name),bytes);return JSON.parse(bytes.toString());
  };
  await drag(582,231,549,231);
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','10');
  await expect(page.getByTestId('fragment-view')).toContainText('2,500 bp');
  const horizontal=await save('gel','web-horizontal.json');
  // Native keyed writer loses the destination; its surviving source remains an independent checkpoint.
  expect(horizontal.Gel.Samples[11]).toEqual((await native('native-horizontal.json')).Gel.Samples.Sample);
  await drag(549,231,549,281);
  await expect(page.getByTestId('fragment-view')).toContainText('1,600 bp');
  const selected=await save('sample','web-vertical-sample.json');
  expect(selected).toEqual(await native('native-vertical-sample.json'));
  const vertical=await save('gel','web-vertical.json');
  const expected=structuredClone(horizontal);expected.Gel.Samples[10]=selected.Sample;
  expect(vertical).toEqual(expected);
  expect(vertical.Gel.Samples[11]).toEqual((await native('native-vertical.json')).Gel.Samples.Sample);
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('vertical.png')});
 }finally{await app.close();}
});
