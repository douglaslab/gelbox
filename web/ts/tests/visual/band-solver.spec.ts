import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const root = '../reference/native/';
for (const tied of [false,true]) for (const clone of [false,true]) test(`multimer drag preserves native tier and offset (clone=${clone}, tied=${tied})`, async ({ page }, info) => {
  await page.addInitScript(b => localStorage.setItem('gelBackend', b), info.project.name.includes('webgl2') ? 'webgl2' : 'webgpu');
  await page.setViewportSize({ width:1365,height:768 });await page.goto('/#/gel');
  const doc=JSON.parse(await readFile(root+'files/ladder-after-selection.gel.json','utf8'));
  doc.Gel.Samples[0].Fragments=[{Bases:tied?14000:3001,Mass:125,Degrade:0,AspectRatio:1,Aggregate:tied?[1,1,1]:[1,2,3],Color:[.2,.4,.8]}];
  await page.getByRole('button',{name:'Application settings'}).click();
  await page.getByTestId('file-input').setInputFiles({name:'multimer.gel.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(3);
  const native=JSON.parse(await readFile(root+'numerical/release-x86_64/outputs.json','utf8')).find((r:any)=>r.id===(tied?'tied-aggregate-tops':'aggregate-3'));
  const band=native.bands.find((b:any)=>b.aggregate===(clone ? 1 : 3));
  // Native picks the smallest UI height and first tie at the actual mouse point.
  const hitIndices=native.nativeMetadata.map((m:any,i:number)=>({r:m.uiRect,i}))
    .filter(({r}:any)=>27.85>=r.x1 && 27.85<=r.x2 && band.rect.y1+5>=r.y1 && band.rect.y1+5<=r.y2);
  const picked=native.bands[hitIndices.reduce((a:any,b:any)=>(b.r.y2-b.r.y1)<(a.r.y2-a.r.y1)?b:a).i];
  const reference=clone ? native.bands.reduce((a:any,b:any)=>b.rect.y1<a.rect.y1?b:a) : picked;
  const expected=native.solved.find((s:any)=>s.aggregate===reference.aggregate && s.targetY===250).bases;
  const gel=(await page.getByTestId('gel-overlay').boundingBox())!;
  if(clone) await page.keyboard.down('Alt');
  await page.mouse.move(gel.x+27.85,gel.y+band.rect.y1+5);await page.mouse.down();
  if(clone) await page.keyboard.up('Alt');
  await page.mouse.move(gel.x+27.85,gel.y+250+band.rect.y1+5-reference.rect.y1);await page.mouse.up();
  await page.getByRole('button',{name:'Application settings'}).click();
  const pending=page.waitForEvent('download');await page.getByTestId('save-sample-btn').click();
  const saved=JSON.parse(await readFile((await (await pending).path())!,'utf8'));
  expect(saved.Sample.Fragments[clone?1:0].Bases).toBe(expected);
  if(clone) expect(saved.Sample.Fragments[0].Bases).toBe(tied?14000:3001);
});
