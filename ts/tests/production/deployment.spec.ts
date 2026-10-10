import {test,expect} from '@playwright/test';
import {serveBuiltApp} from './built-app';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
for(const prefix of ['/','/gelbox/'])test(`built app at ${prefix} loads controls and roundtrips native files`,async({page},info)=>{
 const app=await serveBuiltApp(prefix);
 try {
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
  await page.addInitScript(b=>{
   localStorage.setItem('gelBackend',b);
   localStorage.setItem('gelSharedPresentation','0'); // Production must ignore the retired-compositor preference.
   const get=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type:any,options:any){const c=get.call(this,type,options);if(c)this.setAttribute('data-test-context',type);return c;} as typeof get;
  },backend);
  await page.goto(`${app.url}#/gel`);
  await expect(page.getByTestId('band-0')).toBeVisible();
  await expect(page.getByTestId('shared-scene')).toHaveAttribute('data-test-context',backend);
  await expect(page.getByTestId('gel-canvas')).not.toHaveAttribute('data-test-context',/./);
  const checkImages=async()=>{
   await expect.poll(()=>page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src')))).toEqual([]);
  };
  await checkImages();
  await page.getByTestId('settings-button').click();await checkImages();
  await page.getByTestId('band-0').click();await checkImages();
  await expect(page.getByTestId('molecular-sim-canvas')).toHaveAttribute('data-shared-ready','1');
  await expect(page.getByTestId('fragment-representative')).toHaveAttribute('data-shared-ready','1');
  await expect(page.locator('canvas[data-test-context=webgpu],canvas[data-test-context=webgl2]')).toHaveCount(1);
  const settings=page.getByRole('button',{name:'Application settings'});
  await settings.click();
  const fixture=path.resolve('../reference/native/files/ladder-after-selection.gel.json');
  await page.getByTestId('file-input').setInputFiles(fixture);
  await expect(settings).toHaveAttribute('aria-expanded','false');
  await settings.click();
  await page.getByTestId('file-input').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
  await expect(page.getByTestId('file-error')).toContainText('Open failed');
  const downloading=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
  const download=await downloading;
  expect(JSON.parse(await readFile((await download.path())!,'utf8'))).toEqual(JSON.parse(await readFile(fixture,'utf8')));
  expect(app.outside.filter(p=>p!=='/favicon.ico')).toEqual([]);expect(errors).toEqual([]);
 }finally{await app.close();}
});
