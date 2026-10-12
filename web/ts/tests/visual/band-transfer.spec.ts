import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function open(page: Page, backend: string, dye = false) {
  await page.addInitScript(b => localStorage.setItem('gelBackend',b),backend);
  await page.setViewportSize({width:1365,height:768});
  await page.goto('/#/gel');
  const doc = JSON.parse(await readFile('../reference/native/files/ladder-after-selection.gel.json','utf8'));
  const fragment = {Bases:3001,Mass:70,Degrade:0,AspectRatio:1,Aggregate:[1],Color:[.2,.4,.8], ...(dye?{Dye:'Xylene cyanol'}:{})};
  const source = {...doc.Gel.Samples[0],Fragments:[fragment,{...fragment,Bases:8000,...(dye?{Dye:''}:{})}]};
  doc.Gel.Samples=[source,{...source,Fragments:[{...fragment,Mass:80,Bases:1000}] }];
  await page.getByRole('button',{name:'Application settings'}).click();
  await page.getByTestId('file-input').setInputFiles({name:'drag.gel.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(3);
}
async function save(page: Page) {
  await page.getByRole('button',{name:'Application settings'}).click();
  const pending=page.waitForEvent('download');
  await page.getByTestId('save-gel-btn').click();
  return JSON.parse(await readFile((await (await pending).path())!,'utf8')).Gel;
}

test('continuous band transfer respects gutters, cleans temporary samples and preserves Shift bases',async({page},info)=>{
  await open(page,info.project.name.includes('webgl2')?'webgl2':'webgpu');
  const gel=(await page.getByTestId('gel-overlay').boundingBox())!;
  const band=page.locator('[data-testid^="band-"][data-lane-index="0"][data-fragment-index="0"]');
  const box=(await band.boundingBox())!;
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  await page.keyboard.down('Shift');
  await page.mouse.move(gel.x+56,gel.y+250);await expect(band).toBeVisible();
  await page.mouse.move(gel.x+83.57,gel.y+250);
  await expect(page.locator('[data-testid^="band-"][data-lane-index="1"][data-fragment-index="1"]')).toBeVisible();
  await page.mouse.move(gel.x+139.28,gel.y+250);
  await expect(page.locator('[data-testid^="band-"][data-lane-index="2"][data-fragment-index="0"]')).toBeVisible();
  await page.mouse.move(gel.x+195,gel.y+250);
  await expect(page.locator('[data-testid^="band-"][data-lane-index="2"]')).toHaveCount(0);
  await page.mouse.up();await page.keyboard.up('Shift');
  const samples=(await save(page)).Samples;
  expect(samples[0].Fragments.map((f:any)=>f.Bases)).toEqual([8000]);
  expect(samples[1].Fragments.map((f:any)=>f.Bases)).toEqual([1000]);
  expect(samples[2]).toBeNull();
  expect(samples[3].Fragments.map((f:any)=>f.Bases)).toEqual([3001]);
});

for(const clone of [false,true]) test(`dye drag merges on release (Alt clone=${clone})`,async({page},info)=>{
  await open(page,info.project.name.includes('webgl2')?'webgl2':'webgpu',true);
  const gel=(await page.getByTestId('gel-overlay').boundingBox())!;
  const band=page.locator('[data-testid^="band-"][data-lane-index="0"][data-fragment-index="0"]');
  const box=(await band.boundingBox())!;
  if(clone)await page.keyboard.down('Alt');
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  if(clone)await page.keyboard.up('Alt');
  await page.mouse.move(gel.x+83.57,gel.y+450);
  await expect(page.locator('[data-testid^="band-"][data-lane-index="1"]')).toHaveCount(2);
  await page.mouse.up();
  await expect(page.locator('[data-testid^="band-"][data-lane-index="1"]')).toHaveCount(1);
  const samples=(await save(page)).Samples;
  expect(samples[1].Fragments).toHaveLength(1);
  expect(samples[1].Fragments[0]).toMatchObject({Dye:'Xylene cyanol',Mass:125,Bases:1000});
  expect(samples[0].Fragments).toHaveLength(clone?2:1);
});

for (const ending of ['cancel','capture-loss']) test(`band ${ending} keeps placement and ends dragging`,async({page},info)=>{
  await open(page,info.project.name.includes('webgl2')?'webgl2':'webgpu');
  const gel=(await page.getByTestId('gel-overlay').boundingBox())!;
  const box=(await page.getByTestId('band-0').boundingBox())!;
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  await page.keyboard.down('Shift');
  await page.mouse.move(gel.x+139.28,gel.y+250);
  await expect(page.locator('[data-testid^="band-"][data-lane-index="2"]')).toHaveCount(1);
  if(ending==='cancel') await page.getByTestId('gel-overlay').dispatchEvent('pointercancel',{pointerId:1});
  else await page.getByTestId('gel-overlay').evaluate(el=>el.releasePointerCapture(1));
  await page.mouse.move(gel.x+195,gel.y+250);await page.mouse.up();await page.keyboard.up('Shift');
  const samples=(await save(page)).Samples;
  expect(samples[2].Fragments).toHaveLength(1);
  expect(samples[3]).toBeNull();
});
