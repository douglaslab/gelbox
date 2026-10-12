import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';

test('native occupied DNA transfer and post-save deletion preserve destination sample',async({page},info)=>{
 const root=path.resolve('../reference/native/replay/occupied-dna');
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();await page.getByTestId('file-input').setInputFiles(path.join(root,'input.json'));
  await page.getByTestId('band-3').click();
  await page.keyboard.press('a');
  // Native screenshot /2 minus the 28-logical-pixel title bar.
  await page.mouse.move(459,392);await page.mouse.down();
  await page.mouse.move(347,392);await page.mouse.up();
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','2');
  await expect(page.getByTestId('fragment-view')).toBeVisible();
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(4);
  for(const lane of [3,4])await expect(page.getByTestId(`microtube-${lane}`)).not.toHaveAttribute('data-empty','true');
  const checkpoint=async(name:string)=>{
   await menu.click();const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
   const bytes=await readFile((await (await pending).path())!);
   const actual=JSON.parse(bytes.toString());
   const native=JSON.parse(await readFile(path.join(root,`native-after-${name}.json`),'utf8'));
   for(const lane of [3,4]){
    expect(native.Gel.Samples[lane].Fragments).toBeNull();
    expect(actual.Gel.Samples[lane].Fragments).toEqual([]);
    native.Gel.Samples[lane].Fragments=[];
   }
   expect(actual).toEqual(native);
   await writeFile(info.outputPath(`web-after-${name}.json`),bytes);
   if(await menu.getAttribute('aria-expanded')==='true')await menu.click();
   await page.mouse.move(0,0);await page.screenshot({path:info.outputPath(`after-${name}.png`)});
  };
  await checkpoint('transfer');
  await page.keyboard.press('Backspace');
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(3);
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','2');
  await expect(page.getByTestId('fragment-view')).toHaveCount(0);
  await checkpoint('delete');
 }finally{await app.close();}
});

test('native Shift band transfer preserves size despite downward pointer movement',async({page},info)=>{
 const root=path.resolve('../reference/native/replay/shift-band');
 const before=JSON.parse(await readFile(path.join(root,'native-before-shift.json'),'utf8'));
 const native=JSON.parse(await readFile(path.join(root,'native-after-shift.json'),'utf8'));
 expect(native.Gel.Samples[4].Fragments).toEqual(before.Gel.Samples[3].Fragments);
 expect(native.Gel.Samples[3].Fragments).toBeNull();
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();await page.getByTestId('file-input').setInputFiles(path.join(root,'native-before-shift.json'));
  await page.getByTestId('band-2').click();
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('before-shift.png')});
  const band=(await page.getByTestId('band-3').boundingBox())!;
  const target=(await page.getByTestId('microtube-4').boundingBox())!;
  await page.keyboard.down('Shift');
  await page.mouse.move(band.x+band.width/2,band.y+band.height/2);await page.mouse.down();
  await page.mouse.move(target.x+target.width/2,band.y+band.height/2+70,{steps:8});
  await page.mouse.up();await page.keyboard.up('Shift');
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(4);
  await expect(page.getByTestId('microtube-3')).not.toHaveAttribute('data-empty','true');
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','4');
  await expect(page.getByTestId('fragment-view')).toBeVisible();
  await menu.click();const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
  const bytes=await readFile((await (await pending).path())!);
  const actual=JSON.parse(bytes.toString());
  // Native encodes the retained empty source's Fragments as null; web uses [].
  expect(actual.Gel.Samples[3].Fragments).toEqual([]);
  const comparable=structuredClone(native);comparable.Gel.Samples[3].Fragments=[];
  expect(actual).toEqual(comparable);
  expect(actual.Gel.Samples[4].Fragments[0].Bases).toBe(719);
  await writeFile(info.outputPath('web-after-shift.json'),bytes);
  if(await menu.getAttribute('aria-expanded')==='true')await menu.click();
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('after-shift.png')});
 }finally{await app.close();}
});

test('native Option tube clone and destination click retain the complete sample',async({page},info)=>{
 const root=path.resolve('../reference/native/replay/option-clone');
 const native=async(name:string)=>JSON.parse(await readFile(path.join(root,name),'utf8'));
 const before=await native('native-after-clone.json');
 const after=await native('native-three-lanes.json');
 expect(after.Gel.Samples[2]).toEqual(before.Gel.Samples[1]);
 expect(after.Gel.Samples.slice(0,2)).toEqual(before.Gel.Samples.slice(0,2));
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();await page.getByTestId('file-input').setInputFiles(path.join(root,'native-after-clone.json'));
  await page.getByTestId('band-1').click();
  await expect(page.getByTestId('fragment-view')).toBeVisible();
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','1');
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('before-tube-clone.png')});
  const tube=(lane:number)=>page.getByTestId(`microtube-${lane}`);
  const from=(await tube(1).boundingBox())!,to=(await tube(2).boundingBox())!;
  await page.keyboard.down('Alt');
  await page.mouse.move(from.x+from.width/2,from.y+15);await page.mouse.down();
  await page.mouse.move(to.x+to.width/2,to.y+15,{steps:8});await page.mouse.up();
  await page.keyboard.up('Alt');
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(3);
  for(const lane of [0,1,2])await expect(tube(lane)).not.toHaveAttribute('data-empty','true');
  // The user confirmed clicking the clone afterward to inspect its color.
  // Native final selection therefore includes this explicit follow-up action.
  await page.getByTestId('band-2').click();
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','2');
  await expect(page.getByTestId('fragment-view')).toBeVisible();
  await menu.click();const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
  const bytes=await readFile((await (await pending).path())!);
  expect(JSON.parse(bytes.toString())).toEqual(after);
  await writeFile(info.outputPath('web-after-tube-clone.json'),bytes);
  if(await menu.getAttribute('aria-expanded')==='true')await menu.click();
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('after-tube-clone.png')});
 }finally{await app.close();}
});

test('compiled tube move and occupied drop match retained native documents',async({page},info)=>{
 const root=path.resolve('../reference/native/replay/tube-movement');
 const inputPath=path.resolve('../reference/native/replay/hidden-lanes/input-twelve.json');
 const native=async(name:string)=>JSON.parse(await readFile(path.join(root,name),'utf8'));
 const normalize=(doc:any)=>JSON.parse(JSON.stringify(doc,(key,value)=>key==='Fragments'&&value===null?[]:value));
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();await page.getByTestId('file-input').setInputFiles(inputPath);
  const tube=(lane:number)=>page.getByTestId(`microtube-${lane}`);
  const move=async(from:number,to:number)=>{
   const a=await tube(from).boundingBox();const b=await tube(to).boundingBox();
   expect(a).not.toBeNull();expect(b).not.toBeNull();
   await page.mouse.move(a!.x+a!.width/2,a!.y+15);await page.mouse.down();
   await page.mouse.move(b!.x+b!.width/2,b!.y+15,{steps:8});await page.mouse.up();
  };
  const save=async(kind:'sample'|'gel',name:string)=>{
   await menu.click();const pending=page.waitForEvent('download');await page.getByTestId(`save-${kind}-btn`).click();
   const bytes=await readFile((await (await pending).path())!);await writeFile(info.outputPath(name),bytes);
   return JSON.parse(bytes.toString());
  };
  await move(11,0);
  await expect(tube(11)).toHaveAttribute('data-empty','true');
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','0');
  expect(await save('sample','web-moved-sample.json')).toEqual(await native('native-moved-sample.json'));
  await tube(1).click();
  expect(normalize(await save('sample','web-destination-before.json'))).toEqual(normalize(await native('native-destination-before.json')));
  await move(0,1);
  await expect(tube(0)).toHaveAttribute('data-empty','true');
  await expect(tube(1)).not.toHaveAttribute('data-empty','true');
  await expect(page.getByTestId('sample-view')).toHaveCount(0);
  // Compare the entire lane array; only the native empty Fragments encoding differs.
  expect(normalize(await save('gel','web-after-occupied.json'))).toEqual(normalize(await native('native-after-occupied.json')));
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('after-occupied.png')});
  const remaining=(await tube(1).boundingBox())!;
  await page.mouse.move(remaining.x+remaining.width/2,remaining.y+15);await page.mouse.down();
  await page.mouse.move(remaining.x+remaining.width/2,remaining.y-55,{steps:8});await page.mouse.up();
  for(let lane=0;lane<12;lane++)await expect(tube(lane)).toHaveAttribute('data-empty','true');
  await expect(page.getByTestId('sample-view')).toHaveCount(0);
  expect(await save('gel','web-after-offgel.json')).toEqual(await native('native-after-offgel.json'));
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('after-offgel.png')});
 }finally{await app.close();}
});

test('compiled populated occupied and off-gel tube drops match original native documents',async({page},info)=>{
 const root=path.resolve('../reference/native/replay/populated-tubes');
 const native=async(name:string)=>JSON.parse(await readFile(path.join(root,name),'utf8'));
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();await page.getByTestId('file-input').setInputFiles(path.resolve('../reference/native/replay/hidden-lanes/input-twelve.json'));
  await expect(page.getByTestId('band-0')).toHaveAttribute('data-lane-index','11');
  await menu.click();await page.getByTestId('file-input').setInputFiles(path.resolve('../reference/native/replay/multimer-drag/native-quantized-controls.json'));
  const tube=(lane:number)=>page.getByTestId(`microtube-${lane}`);
  await expect(tube(0)).not.toHaveAttribute('data-empty','true');
  await expect(tube(11)).not.toHaveAttribute('data-empty','true');
  const drag=async(x:number,y:number,tx:number,ty:number)=>{
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(tx,ty);await page.mouse.up();
  };
  const save=async(name:string)=>{
   await menu.click();const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
   const bytes=await readFile((await (await pending).path())!);await writeFile(info.outputPath(name),bytes);return JSON.parse(bytes.toString());
  };
  // Original screenshot / 2 minus the 28px title bar: lane12 -> occupied lane1.
  await drag(582,102,224,102);
  await expect(tube(11)).toHaveAttribute('data-empty','true');
  await expect(tube(0)).not.toHaveAttribute('data-empty','true');
  await expect(page.getByTestId('sample-view')).toHaveCount(0);
  expect(await save('web-populated-occupied.json')).toEqual(await native('native-populated-occupied.json'));
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('populated-occupied.png')});
  await drag(224,102,224,32);
  for(let lane=0;lane<12;lane++)await expect(tube(lane)).toHaveAttribute('data-empty','true');
  await expect(page.getByTestId('sample-view')).toHaveCount(0);
  expect(await save('web-populated-offgel.json')).toEqual(await native('native-populated-offgel.json'));
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('populated-offgel.png')});
 }finally{await app.close();}
});
