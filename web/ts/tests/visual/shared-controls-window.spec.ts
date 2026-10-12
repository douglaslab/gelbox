import {menuButtonDifference} from '../helpers/menuButtonDifference';
import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root='../reference/native/modern/full-window-controls';
const manifest=JSON.parse(fs.readFileSync(`${root}/manifest.json`,'utf8'));
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
test('complete settings and menu windows follow native effects/direct transitions',async({page},info)=>{
 const bytes=fs.readFileSync(`${root}/startup.json`);
 expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.captures['startup.json']);
 const state=JSON.parse(bytes.toString());
 await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');
 const app=page.getByRole('button',{name:'Application settings'}),gear=page.getByTestId('settings-button');
 await app.click();
 await page.getByTestId('file-input').setInputFiles({name:'captured.gel.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({Gelbox:{type:'gel',version:'1.0'},Gel:state.gel}))});
 await expect(app).toHaveAttribute('aria-expanded','false');
 const capture=async(scene:string)=>{
  await page.mouse.move(0,0);
  await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-shared-ready','1');
  if(scene.startsWith('settings')){
   await expect(page.getByTestId('inspector-panel')).toHaveAttribute('data-view','gel-settings');
   await expect(page.getByTestId('gel-buffer-view')).toHaveAttribute('data-shared-ready','buffer-2');
   await expect(page.getByTestId('inspector-headings')).toHaveAttribute('data-shared-ready','gel-settings-2');
   for(const id of ['gel-lanes','gel-well-damage','gel-voltage','gel-rotate'])await expect(page.getByTestId(id)).toHaveAttribute('data-shared-ready','1');
  }
  if(scene.includes('menu'))await expect(page.locator('#application-file-menu')).toHaveAttribute('data-shared-ready','menu');
  await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
  await expect(page.getByRole('alert')).toHaveCount(0);
  const native=fs.readFileSync(`${root}/${scene}.png`);
  expect(createHash('sha256').update(native).digest('hex')).toBe(manifest.captures[`${scene}.png`]);
  const excluded=await menuButtonDifference(page);
  const actual=await page.screenshot();await fs.promises.writeFile(info.outputPath(`${scene}.png`),actual);
 const result=await page.evaluate(async({actual,native,excluded})=>{
  const decode=async(bytes:number[])=>{const im=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'})),canvas=new OffscreenCanvas(im.width,im.height),ctx=canvas.getContext('2d')!;ctx.drawImage(im,0,0);im.close();return {width:canvas.width,height:canvas.height,data:ctx.getImageData(0,0,canvas.width,canvas.height).data};};
  const a=await decode(actual),b=await decode(native);if(a.width!==b.width||a.height!==b.height)throw Error('Different window sizes');
  let different=0,max=0,minX=a.width,minY=a.height,maxX=-1,maxY=-1;const tiles:Record<string,number>={};
  for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++)for(let c=0;c<3;c++){
   if(excluded.some(r=>x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom))continue;
   const i=(y*a.width+x)*4+c,d=Math.abs(a.data[i]-b.data[i]);if(!d)continue;
   different++;max=Math.max(max,d);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   const tile=`${Math.floor(x/100)},${Math.floor(y/100)}`;tiles[tile]=(tiles[tile]??0)+1;
  }
  return {excluded,differentChannels:different,maxChannelDifference:max,bounds:{minX,minY,maxX,maxY},tiles};
 },{actual:[...actual],native:[...native],excluded});
 await fs.promises.writeFile(info.outputPath(`${scene}-comparison.json`),JSON.stringify(result,null,2));
 expect.soft(result.differentChannels,scene).toBe(0);
 };
 await gear.click();await capture('settings-effects');
 await app.click();await capture('settings-menu-effects');
 await page.getByRole('checkbox',{name:'Render',exact:true}).uncheck();await capture('settings-menu-direct');
 await gear.click();await expect(app).toHaveAttribute('aria-expanded','false');
 await app.click();await capture('menu-direct');
 await page.getByRole('checkbox',{name:'Render',exact:true}).check();await capture('menu-effects');
});
