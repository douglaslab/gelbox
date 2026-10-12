import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';

test('compiled dye transfer matches native capped merge and retained source DNA',async({page},info)=>{
 const root=path.resolve('../reference/native/replay/dye-transfer');
 const native=async(name:string)=>JSON.parse(await readFile(path.join(root,name),'utf8'));
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();await page.getByTestId('file-input').setInputFiles(path.join(root,'input.json'));
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(3);
  await page.mouse.click(582,206);
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','11');
  await expect(page.getByTestId('dye-row-0-slider')).toContainText('70 mM');
  await expect(page.getByTestId('sample-buffer-view-tris')).toHaveAttribute('aria-disabled','true');
  await page.mouse.move(582,206);await page.mouse.down();await page.mouse.move(224,272);await page.mouse.up();
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','0');
  await expect(page.getByTestId('dye-row-0-slider')).toContainText('125 mM');
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(2);
  const save=async(kind:'sample'|'gel',name:string)=>{
   await menu.click();const pending=page.waitForEvent('download');await page.getByTestId(`save-${kind}-btn`).click();
   const bytes=await readFile((await (await pending).path())!);await writeFile(info.outputPath(name),bytes);return JSON.parse(bytes.toString());
  };
  const destination=await native('native-destination.json');
  expect(await save('sample','web-destination.json')).toEqual(destination);
  const retained=await native('native-after-transfer.json');
  const expected=await native('input.json');
  // Native's keyed gel writer omits the destination. Reconstruct the accepted
  // lane-preserving document from its independent source and destination saves.
  expected.Gel={...retained.Gel,Samples:expected.Gel.Samples};
  expected.Gel.Samples[0]=destination.Sample;
  expected.Gel.Samples[11]=retained.Gel.Samples.Sample;
  expect(await save('gel','web-after-transfer.json')).toEqual(expected);
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('after-transfer.png')});
 }finally{await app.close();}
});
