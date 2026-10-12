import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';

test('compiled backward selection through deselection and last dye matches native deletion',async({page},info)=>{
 const root=path.resolve('../reference/native/replay/keyboard-selection');
 const inputPath=path.join(root,'input.json');
 const input=JSON.parse(await readFile(inputPath,'utf8'));
 const expected=JSON.parse(await readFile(path.join(root,'native-last-dye-deleted.json'),'utf8'));
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();await page.getByTestId('file-input').setInputFiles(inputPath);
  await expect(menu).toHaveAttribute('aria-expanded','false');
  await page.getByTestId('microtube-1').click();
  const sample=page.getByTestId('sample-view');
  const species=page.getByTestId('fragment-view');
  const settings=page.getByTestId('sample-settings-view');
  await expect(sample).toHaveAttribute('data-lane-index','1');
  await expect(sample).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(species).toHaveCount(0);await expect(settings).toHaveCount(0);
  await page.mouse.click(292,181);
  await expect(species).toContainText('2,500 bp');
  // Native automation left no rollover outline. Browser mouse.click emits a
  // pointer move and establishes rollover; move away before comparing the
  // keyboard-only inspector sequence. Hover takes precedence in both sources.
  await page.mouse.move(0,0);
  await page.keyboard.press('Shift+Tab');
  await expect(species).toHaveCount(0);await expect(settings).toHaveCount(0);
  await page.keyboard.press('Shift+Tab');
  await expect(settings).toBeVisible();
  await page.keyboard.press('Backspace');
  await expect(sample).toBeVisible();await expect(species).toHaveCount(0);
  const save=async(kind:'sample'|'gel',name:string)=>{
   await menu.click();const pending=page.waitForEvent('download');
   await page.getByTestId(`save-${kind}-btn`).click();
   const bytes=await readFile((await (await pending).path())!);
   await writeFile(info.outputPath(name),bytes);return JSON.parse(bytes.toString());
  };
  expect(await save('sample','web-last-dye-deleted.json')).toEqual(expected);
  const expectedGel=structuredClone(input);expectedGel.Gel.Samples[1]=expected.Sample;
  expect(await save('gel','web-gel-after-deletion.json')).toEqual(expectedGel);
 }finally{await app.close();}
});
