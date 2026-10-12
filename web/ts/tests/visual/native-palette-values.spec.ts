import {test,expect} from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs/promises';
const root='../reference/native/replay/palette-values';
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
for(const shared of [false,true])test(`shared=${shared} all twelve palette colors save exactly like the original release`,async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.addInitScript(shared=>localStorage.setItem('gelSharedPresentation',shared?'1':'0'),shared);
 await page.goto('/#/gel');
 await page.getByTestId('file-input').setInputFiles(path.resolve(root,'capture-input.json'));
 await expect(page.getByTestId('band-0')).toBeVisible();
 await page.locator('[data-testid^="band-"][data-lane-index="0"][data-fragment-index="0"]').click();
 for(let i=0;i<12;i++){
  await expect(page.getByTestId('fragment-view')).toContainText(`${(500+i*1000).toLocaleString('en-US')} bp`);
  await page.getByTestId(`fragment-palette-swatch-${i}`).click();
  if(i<11)await page.keyboard.press('Tab');
 }
 await page.getByRole('button',{name:'Application settings'}).click();
 const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
 const saved=await fs.readFile((await(await pending).path())!,'utf8');
 await fs.writeFile(info.outputPath('web-output.json'),saved);
 expect(JSON.parse(saved)).toEqual(JSON.parse(await fs.readFile(path.resolve(root,'native-output.json'),'utf8')));
});
