import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';

for(const [name,y,hits] of [['overlap-drag',149,2],['overlap-356',150,2],['overlap-358',151,2],['trimer-only',147,1],['dimer-only',154,1]] as const){
 test(`overlapping aggregate tiers ${name} drag matches original native`,async({page},info)=>{
  const app=await serveBuiltApp('/gelbox/');
  try{
   const root=path.resolve('../reference/native/replay/overlapping-tiers');
   await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
   await page.goto(`${app.url}#/gel`);
   const menu=page.getByRole('button',{name:'Application settings'});
   await menu.click();await page.getByTestId('file-input').setInputFiles(path.join(root,'input.json'));
   await expect(menu).toHaveAttribute('aria-expanded','false');
   await expect(page.locator('[data-testid^="band-"]')).toHaveCount(3);
   const boxes=await Promise.all([0,1,2].map(i=>page.getByTestId(`band-${i}`).boundingBox()));
   expect(boxes.filter(b=>b && 236>=b.x && 236<=b.x+b.width && y>=b.y && y<=b.y+b.height).length).toBe(hits);
   await page.mouse.move(236,y);await page.mouse.down();await page.mouse.move(236,y+20);await page.mouse.up();
   await expect(page.getByTestId('fragment-view')).toBeVisible();
   await menu.click();const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
   const bytes=await readFile((await (await pending).path())!);
   await writeFile(info.outputPath(`web-${name}.json`),bytes);
   const actual=JSON.parse(bytes.toString());
   const native=JSON.parse(await readFile(path.join(root,`native-${name}.json`),'utf8'));
   // Existing interchange boundary: web preserves imported decimals; native
   // parses Time as float32. Assert both encodings before comparing the rest.
   expect(actual.Gel.Time).toBe(0.1);
   expect(native.Gel.Time).toBe(Math.fround(actual.Gel.Time));
   expect({...actual,Gel:{...actual.Gel,Time:Math.fround(actual.Gel.Time)}}).toEqual(native);
   await page.mouse.move(0,0);await page.screenshot({path:info.outputPath(`${name}.png`)});
  }finally{await app.close();}
 });
}

// Original-app right-click checkpoints isolate integer solver boundaries.
// Randomly generated color/mass are excluded; all deterministic sample fields
// and the pre-existing fragment are compared exactly.
for(const [id,target] of [['boundary-bp1001-y233',233],['boundary-bp1001-y254',254],['boundary-bp1001-y310',310],['boundary-bp1001-y352',352],['boundary-bp2001-y156',156],['boundary-bp2001-y240',240],['boundary-bp3001-y135',135],['boundary-bp3001-y177',177],['boundary-bp3001-y219',219]] as const){
 test(`original GUI solver boundary ${id}`,async({page},info)=>{
  const app=await serveBuiltApp('/gelbox/');
  try{
   const root=path.resolve('../reference/native/replay/overlapping-tiers/boundaries');
   await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
   await page.goto(`${app.url}#/gel`);
   const menu=page.getByRole('button',{name:'Application settings'});
   await menu.click();await page.getByTestId('file-input').setInputFiles(path.join(root,`${id}-input.json`));
   await expect(menu).toHaveAttribute('aria-expanded','false');
   await page.mouse.click(236,124+target,{button:'right'});
   await expect(page.getByTestId('fragment-view')).toBeVisible();
   await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','0');
   await menu.click();const pending=page.waitForEvent('download');await page.getByTestId('save-sample-btn').click();
   const bytes=await readFile((await (await pending).path())!);
   await writeFile(info.outputPath(`${id}-web.json`),bytes);
   const actual=JSON.parse(bytes.toString());
   const native=JSON.parse(await readFile(path.join(root,`${id}-native.json`),'utf8'));
   expect(actual.Sample.Fragments).toHaveLength(2);
   const deterministic=(doc:any)=>({...doc,Sample:{...doc.Sample,Fragments:doc.Sample.Fragments.map((f:any,i:number)=>{
    if(i===0)return f;const {Color,Mass,...rest}=f;return rest;
   })}});
   expect(deterministic(actual)).toEqual(deterministic(native));
  }finally{await app.close();}
 });
}

for(const [target,startY,delta] of [[61,176.5,12],[63,178,13],[69,182.5,14]] as const){
 test(`original GUI fractional boundary y${target}`,async({page},info)=>{
  const app=await serveBuiltApp('/gelbox/');
  try{
   const root=path.resolve('../reference/native/replay/overlapping-tiers/fractional-boundaries');
   const id=`shape-boundary-y${target}`;
   await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
   await page.goto(`${app.url}#/gel`);
   const menu=page.getByRole('button',{name:'Application settings'});
   await menu.click();await page.getByTestId('file-input').setInputFiles(path.join(root,`${id}-input.json`));
   await expect(menu).toHaveAttribute('aria-expanded','false');
   await page.mouse.move(236,startY);await page.mouse.down();await page.mouse.move(236,startY+delta);await page.mouse.up();
   await expect(page.getByTestId('fragment-view')).toBeVisible();
   await menu.click();const pending=page.waitForEvent('download');await page.getByTestId('save-sample-btn').click();
   const bytes=await readFile((await (await pending).path())!);await writeFile(info.outputPath(`${id}-web.json`),bytes);
   const actual=JSON.parse(bytes.toString());
   const native=JSON.parse(await readFile(path.join(root,`${id}-native.json`),'utf8'));
   expect(actual.Sample.Fragments).toHaveLength(1);
   expect(actual.Sample.Fragments[0].AspectRatio).toBe(1.2);
   expect(native.Sample.Fragments[0].AspectRatio).toBe(Math.fround(1.2));
   actual.Sample.Fragments[0].AspectRatio=Math.fround(actual.Sample.Fragments[0].AspectRatio);
   expect(actual).toEqual(native);
  }finally{await app.close();}
 });
}
