import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';

for(const [name,y] of [['lower-edge',166],['upper-grab',156]] as const){
 test(`isolated trimer ${name} drag matches original native`,async({page},info)=>{
  const app=await serveBuiltApp('/gelbox/');
  try{
   const root=path.resolve('../reference/native/replay/isolated-tier');
   await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
   await page.goto(`${app.url}#/gel`);
   const menu=page.getByRole('button',{name:'Application settings'});
   await menu.click();await page.getByTestId('file-input').setInputFiles(path.join(root,'input.json'));
   await expect(menu).toHaveAttribute('aria-expanded','false');
   await expect(page.locator('[data-testid^="band-"]')).toHaveCount(1);
   const band=(await page.getByTestId('band-0').boundingBox())!;
   expect(y).toBeGreaterThan(band.y);expect(y).toBeLessThan(band.y+band.height);
   await page.mouse.move(236,y);await page.mouse.down();await page.mouse.move(236,y+50);await page.mouse.up();
   await expect(page.getByTestId('fragment-view')).toBeVisible();
   await menu.click();const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
   const bytes=await readFile((await (await pending).path())!);
   expect(JSON.parse(bytes.toString())).toEqual(JSON.parse(await readFile(path.join(root,`native-${name}.json`),'utf8')));
   await writeFile(info.outputPath(`web-${name}.json`),bytes);
   await page.mouse.move(0,0);await page.screenshot({path:info.outputPath(`${name}.png`)});
  }finally{await app.close();}
 });
}
