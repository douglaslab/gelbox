import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const root='../reference/native/files/interop/gel';

test.beforeEach(async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');
});
for(const name of ['mixed-twelve','short','over-limit','empty'])test(`native Gel loaded state: ${name}`,async({page})=>{
 const input=await fs.readFile(path.join(root,`${name}-input.json`),'utf8');
 const expected=JSON.parse(await fs.readFile(path.join(root,`${name}-state.json`),'utf8'));
 const actual=await page.evaluate(async input=>{
  const {deserializeFile,serializeGelState}=await import('/src/lib/gel/serialize.ts');
  const {nativeSample,nativeBuffer}=await import('/src/lib/gel/nativeFile.ts');
  const state=deserializeFile(input);if(state.kind!=='state')throw Error('Expected Gel');
  return {loaded:{visibleLanes:state.numLanes,samples:state.samples.map(s=>s?nativeSample(s):null),
   buffer:nativeBuffer(state.ctx.gelBuffer),time:state.ctx.time,voltage:state.ctx.voltage,wellDamage:state.ctx.wellDamage},
   saved:JSON.parse(serializeGelState(state))};
 },input);
 // These fixtures use exactly representable numbers. IDs remain signed integers.
 expect(actual.loaded).toEqual(expected);
 expect(actual.saved).toEqual({Gelbox:{version:'1.0',type:'gel'},Gel:{Samples:expected.samples.slice(0,expected.visibleLanes),
  Buffer:expected.buffer,Time:expected.time,Voltage:expected.voltage,WellDamage:expected.wellDamage}});
});
test('whole Gel edit/save preserves other lanes, metadata and simulation settings',async({page},info)=>{
 const input=JSON.parse(await fs.readFile(path.join(root,'mixed-twelve-input.json'),'utf8'));
 await page.getByTestId('file-input').setInputFiles(path.resolve(root,'mixed-twelve-input.json'));
 await page.locator('[data-lane-index="0"][data-fragment-index="0"]').first().click();
 const track=page.getByTestId('frag-mass-track');await expect(track).toBeVisible();
 const box=(await track.boundingBox())!;
 await page.mouse.click(box.x+box.width*.67,box.y+box.height/2);
 await page.getByRole('button',{name:'Application settings'}).click();
 const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
 const download=await pending;
 const exported=JSON.parse(await fs.readFile((await download.path())!,'utf8'));
 const mass=exported.Gel.Samples[0].Fragments[0].Mass;
 expect(Number.isFinite(mass)).toBe(true);expect(mass).not.toBe(input.Gel.Samples[0].Fragments[0].Mass);
 const restored=structuredClone(exported);restored.Gel.Samples[0].Fragments[0].Mass=input.Gel.Samples[0].Fragments[0].Mass;
 input.Gel.Samples[4].Fragments=[]; // Native empty array writer emits null.
 expect(restored).toEqual(input);
 await fs.writeFile(info.outputPath('edited-native-gel.json'),JSON.stringify(exported,null,2));
});
