import {test,expect} from '@playwright/test';
import {serveBuiltApp} from './built-app';
import {readFile} from 'node:fs/promises';

test('compiled legacy imports normalize native geometry and reject malformed files without replacing the gel',async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const b={tris:44.5,borate:44.5,acetate:0,edta:1};
  const sample={name:'Legacy ladder',id:7,icon:'',iconScale:1,buffer:b,fragments:[{bases:3000,mass:50,degrade:0,aspectRatio:1,dye:-1,aggregate:[1],color:[.2,.4,.6]}]};
  const legacy={schema:'gel-state-v0',numLanes:1,samples:[sample],ctx:{time:.5,voltage:70,wellDamage:0,gelBuffer:b,sampleBuffer:b,ySpaceScale:12}};
  const native={Gelbox:{version:'1.0',type:'gel'},Gel:{Samples:[{name:sample.name,id:7,icon:'',iconScale:1,Buffer:{Tris:44.5,Borate:44.5,Acetate:0,EDTA:1},Fragments:[{Bases:3000,Mass:50,Degrade:0,AspectRatio:1,Aggregate:[1],Color:[.2,.4,.6]}]},null,null,null,null,null,null],Buffer:{Tris:44.5,Borate:44.5,Acetate:0,EDTA:1},Time:.5,Voltage:70,WellDamage:0}};
  const settings=page.getByRole('button',{name:'Application settings'});
  const open=async(doc:unknown)=>{
   if(await settings.getAttribute('aria-expanded')!=='true')await settings.click();
   await page.getByTestId('file-input').setInputFiles({name:'import.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});
  };
  const save=async()=>{
   if(await settings.getAttribute('aria-expanded')!=='true')await settings.click();
   const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
   return JSON.parse(await readFile((await (await pending).path())!,'utf8'));
  };
  await open(native);await expect(settings).toHaveAttribute('aria-expanded','false');
  const nativeBand=await page.getByTestId('band-0').boundingBox();
  await open(legacy);await expect(settings).toHaveAttribute('aria-expanded','false');
  await expect(page.getByTestId(/^microtube-\d+$/)).toHaveCount(7);
  expect(await page.getByTestId('band-0').boundingBox()).toEqual(nativeBand);
  expect(await save()).toEqual(native);
  for(const invalid of [{...legacy,ctx:{...legacy.ctx,time:'wrong'}},{schema:'gel-sample-v0',buffer:b,fragments:null}]){
   await open(invalid);await expect(page.getByTestId('file-error')).toContainText('Invalid legacy Gelbox field');
   expect(await save()).toEqual(native);
   expect(await page.getByTestId('band-0').boundingBox()).toEqual(nativeBand);
  }
  expect(errors).toEqual([]);
 }finally{await app.close();}
});
