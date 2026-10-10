import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const root='../reference/native/replay';
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
test('original-release palette drag retains focus for exact keyboard deletion',async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');
 await page.getByTestId('file-input').setInputFiles(path.resolve(root,'composed-move/moved-native.json'));
 await expect(page.getByTestId('microtube-3')).not.toHaveAttribute('data-empty','true');
 // Original-release window coordinates, minus the 56px title bar, at DPR 2.
 await page.mouse.click(403,182);
 await page.mouse.move(1231.5,210.5);await page.mouse.down();
 await page.mouse.move(1281.5,235,{steps:10});await page.mouse.up();
 await expect(page.getByTestId('fragment-palette-swatch-7')).toHaveAttribute('aria-pressed','true');
 await expect(page.getByTestId('sample-view')).toBeFocused();
 await page.screenshot({path:info.outputPath('palette-drag.png')});
 await page.keyboard.press('Delete');
 await expect(page.getByTestId('fragment-view')).toHaveCount(0);
 await expect(page.getByTestId('sample-view')).toBeFocused();
 await page.screenshot({path:info.outputPath('deleted.png')});
 await page.getByRole('button',{name:'Application settings'}).click();
 const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
 const saved=JSON.parse(await fs.readFile((await(await pending).path())!,'utf8'));
 expect(saved).toEqual(JSON.parse(await fs.readFile(path.resolve(root,'palette-focus/deleted-native.json'),'utf8')));
});
