import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';

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
 }finally{await app.close();}
});
