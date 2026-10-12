import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {serveBuiltApp} from './built-app';
import {compareNative} from './native-comparison';
const root='../reference/native/modern/full-window-controls';
const manifest=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8'));
const readNative=(name:string)=>{const bytes=readFileSync(`${root}/${name}`);expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.captures[name]);return bytes;};
for(const prefix of ['/','/gelbox/'])test(`built shared window at ${prefix} matches native startup and control transitions`,async({page},info)=>{
 const app=await serveBuiltApp(prefix),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','0');},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);await page.mouse.move(0,0);
  const appButton=page.getByRole('button',{name:'Application settings'}),gear=page.getByTestId('settings-button');
  for(const target of [page.getByTestId('gel-canvas'),page.getByTestId('microtube-row'),gear,page.getByRole('link',{name:'Help',exact:true}),appButton,page.getByTestId('timeline-slider')])await expect(target).toHaveAttribute('data-shared-ready','1');
  await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
  await compareNative(page,info,readNative('startup.png'),'startup');
  const state=JSON.parse(readNative('startup.json').toString());
  await appButton.click();await page.getByTestId('file-input').setInputFiles({name:'native.gel.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({Gelbox:{type:'gel',version:'1.0'},Gel:state.gel}))});
  await expect(appButton).toHaveAttribute('aria-expanded','false');
  const capture=async(scene:string)=>{
   await page.mouse.move(0,0);await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-shared-ready','1');
   if(scene.startsWith('settings')){
    await expect(page.getByTestId('inspector-panel')).toHaveAttribute('data-view','gel-settings');
    await expect(page.getByTestId('gel-buffer-view')).toHaveAttribute('data-shared-ready','buffer-2');
    await expect(page.getByTestId('inspector-headings')).toHaveAttribute('data-shared-ready','gel-settings-2');
    for(const id of ['gel-lanes','gel-well-damage','gel-voltage','gel-rotate'])await expect(page.getByTestId(id)).toHaveAttribute('data-shared-ready','1');
   }
   if(scene.includes('menu'))await expect(page.locator('#application-file-menu')).toHaveAttribute('data-shared-ready','menu');
   await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
   await compareNative(page,info,readNative(`${scene}.png`),scene);
  };
  await gear.click();await capture('settings-effects');
  await appButton.click();await capture('settings-menu-effects');
  await page.getByRole('checkbox',{name:'Render',exact:true}).uncheck();await capture('settings-menu-direct');
  await gear.click();await expect(appButton).toHaveAttribute('aria-expanded','false');
  await appButton.click();await capture('menu-direct');
  await page.getByRole('checkbox',{name:'Render',exact:true}).check();await capture('menu-effects');
  expect(errors).toEqual([]);await expect(page.getByRole('alert')).toHaveCount(0);expect(app.outside.filter(p=>p!=='/favicon.ico')).toEqual([]);
 }finally{await app.close();}
});
