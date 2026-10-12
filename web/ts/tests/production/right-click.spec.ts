import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';

test('compiled right-click creation, explicit edits and deletion match original native',async({page},info)=>{
 const root=path.resolve('../reference/native/replay/right-click');
 const inputPath=path.resolve('../reference/native/replay/right-click/input.json');
 const input=JSON.parse(await readFile(inputPath,'utf8'));
 const native=async(name:string)=>JSON.parse(await readFile(path.join(root,name),'utf8'));
 // Cinder writes an empty fragment collection as null; web writes an array.
 // Compare sample semantics explicitly while retaining both original encodings.
 const normalize=(doc:any)=>({...doc,Sample:{...doc.Sample,Fragments:doc.Sample.Fragments??[]}});
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();await page.getByTestId('file-input').setInputFiles(inputPath);
  await expect(menu).toHaveAttribute('aria-expanded','false');
  await page.mouse.click(236,372,{button:'right'});
  const sample=page.getByTestId('sample-view');
  await expect(sample).toHaveAttribute('data-lane-index','0');await expect(sample).toBeFocused();
  await expect(page.getByTestId('fragment-view')).toBeVisible();
  const save=async(kind:'sample'|'gel',name:string)=>{
   await menu.click();const pending=page.waitForEvent('download');await page.getByTestId(`save-${kind}-btn`).click();
   const bytes=await readFile((await (await pending).path())!);await writeFile(info.outputPath(name),bytes);
   await expect(menu).toHaveAttribute('aria-expanded','false');return JSON.parse(bytes.toString());
  };
  await page.getByTestId('fragment-palette-swatch-0').click();
  await page.getByTestId('frag-size-icon-lo').click();await page.getByTestId('frag-mass-icon-hi').click();
  await page.getByTestId('frag-aggregate-icon-lo').click();
  expect(await save('sample','web-edited.json')).toEqual(await native('native-edited.json'));
  // Actual native Save Sample leaves the sample keyboard focus usable by Backspace.
  await page.keyboard.press('Backspace');
  await expect(page.getByTestId('fragment-view')).toHaveCount(0);
  await expect(sample).toBeVisible();await expect(sample).toHaveAttribute('data-lane-index','0');
  await expect(page.getByTestId('microtube-0')).not.toHaveAttribute('data-empty','true');
  const deleted=await save('sample','web-deleted-final.json');
  expect(deleted.Sample.Fragments).toEqual([]);
  expect(normalize(deleted)).toEqual(normalize(await native('native-deleted.json')));
  await page.keyboard.press('Escape');
  await page.evaluate(()=>new Promise<void>(resolve=>{let frames=5;const tick=()=>--frames?requestAnimationFrame(tick):resolve();requestAnimationFrame(tick);}));
  await expect(sample).toBeVisible();await expect(sample).toHaveAttribute('data-lane-index','0');
  const gel=await save('gel','web-gel-after-deletion.json');
  const expected=structuredClone(input);expected.Gel.Samples[0]=deleted.Sample;
  expect(gel).toEqual(expected);
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('empty-after-deletion.png')});
 }finally{await app.close();}
});
