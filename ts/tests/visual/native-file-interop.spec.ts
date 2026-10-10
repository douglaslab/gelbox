import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const root='../reference/native/files/interop';

test.beforeEach(async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');
});
async function saveSample(page:any){
 await page.getByRole('button',{name:'Application settings'}).click();
 const pending=page.waitForEvent('download');await page.getByTestId('save-sample-btn').click();
 const download=await pending;return JSON.parse(await fs.readFile((await download.path())!,'utf8'));
}
test('native empty sample imports and can be saved',async({page})=>{
 await page.getByTestId('file-input').setInputFiles(path.resolve(root,'empty-native.json'));
 await page.getByTestId('microtube-1').click();
 const exported=await saveSample(page);
 const native=JSON.parse(await fs.readFile(path.join(root,'empty-native.json'),'utf8'));
 expect(exported).toEqual({...native,Sample:{...native.Sample,Fragments:[]}});
});
test('native mixed sample preserves metadata, dyes and aggregates through an edit/save',async({page},info)=>{
 const native=JSON.parse(await fs.readFile(path.join(root,'mixed-native.json'),'utf8'));
 await page.getByTestId('file-input').setInputFiles(path.resolve(root,'mixed-native.json'));
 const band=page.locator('[data-lane-index="1"][data-fragment-index="0"]').first();
 await band.click();
 const track=page.getByTestId('frag-mass-track');await expect(track).toBeVisible();
 const box=(await track.boundingBox())!;
 await page.mouse.click(box.x+box.width*.67,box.y+box.height/2);
 const exported=await saveSample(page);
 const mass=exported.Sample.Fragments[0].Mass;
 expect(Number.isFinite(mass)).toBe(true);expect(mass).not.toBe(native.Sample.Fragments[0].Mass);
 expect({...exported,Sample:{...exported.Sample,Fragments:exported.Sample.Fragments.map((f:any,i:number)=>i===0?{...f,Mass:native.Sample.Fragments[0].Mass}:f)}}).toEqual(native);
 await fs.writeFile(info.outputPath('edited-native-sample.json'),JSON.stringify(exported,null,2));
});
