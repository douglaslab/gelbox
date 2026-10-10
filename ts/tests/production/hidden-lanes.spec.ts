import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';

for(const withLoupe of [false,true])test(`compiled lane controls retain hidden data and reset selection (loupe:${withLoupe})`,async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const root=path.resolve('../reference/native/replay/hidden-lanes');
  const input=JSON.parse(await readFile(path.join(root,'input-twelve.json'),'utf8'));
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();await page.getByTestId('file-input').setInputFiles(path.join(root,'input-twelve.json'));
  await expect(menu).toHaveAttribute('aria-expanded','false');
  const pick=async()=>{const b=(await page.locator('[data-lane-index="11"][data-fragment-index="0"]').first().boundingBox())!;await page.mouse.click(b.x+b.width/2,b.y+b.height/2);return b;};
  const band=await pick();await expect(page.getByTestId('fragment-view')).toBeVisible();
  if(withLoupe){
   await page.keyboard.down('Meta');await page.mouse.click(band.x+band.width/2,band.y+band.height/2);await page.keyboard.up('Meta');
   await expect(page.getByTestId('loupe-canvas-1')).toHaveAttribute('data-shared-ready','1');
  }
  const save=async()=>{
   await menu.click();await expect(page.getByTestId('save-sample-btn')).toHaveCount(0);
   const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
   const doc=JSON.parse(await readFile((await (await pending).path())!,'utf8'));await menu.click();return doc;
  };
  await page.getByTestId('settings-button').click();
  await expect(page.getByTestId('sample-view')).toHaveCount(0);await expect(page.getByTestId('fragment-view')).toHaveCount(0);
  await page.getByTestId('gel-lanes-icon-lo').click();
  await expect(page.getByTestId(/^microtube-\d+$/)).toHaveCount(7);
  const seven=await save();expect(seven).toEqual(JSON.parse(await readFile(path.join(root,'native-seven.json'),'utf8')));
  if(withLoupe)await expect(page.getByTestId('loupe-frame-1')).toBeVisible();
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('hidden-seven.png')});
  const track=(await page.getByTestId('gel-lanes-track').boundingBox())!;
  await page.mouse.click(track.x+track.width*5/13,track.y+track.height/2);
  await expect(page.getByTestId(/^microtube-\d+$/)).toHaveCount(12);
  await expect(page.getByTestId('microtube-11')).not.toHaveAttribute('data-empty','true');
  const restored=await save();expect(restored).toEqual(input);
  const native=JSON.parse(await readFile(path.join(root,'native-restored-twelve.json'),'utf8'));
  expect(restored.Gel.Samples[11]).toEqual(native.Gel.Samples.Sample);
  if(withLoupe){
   await expect(page.getByTestId('loupe-frame-1')).toBeVisible();
   await page.getByTestId('loupe-frame-1').click();await page.keyboard.press('Escape');
   await expect(page.getByTestId('loupe-frame-1')).toHaveCount(0);
  }
  // The native writer's keyed collection loses lane indices; web arrays retain them.
  await page.getByTestId('settings-button').click();await pick();
  await page.getByTestId('frag-mass-icon-hi').click();
  await menu.click();const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
  const edited=JSON.parse(await readFile((await (await pending).path())!,'utf8'));
  const nativeEdited=JSON.parse(await readFile(path.join(root,'native-restored-edited.json'),'utf8'));
  expect(edited.Gel.Samples[11]).toEqual(nativeEdited.Gel.Samples.Sample);
  const expected=structuredClone(input);expected.Gel.Samples[11].Fragments[0].Mass=175;
  expect(edited).toEqual(expected);
  await writeFile(info.outputPath('web-restored-edited.json'),JSON.stringify(edited,null,2)+'\n');
 }finally{await app.close();}
});
