import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {serveBuiltApp} from './built-app';

test('negative voltage reverses visible band curvature and positive voltage restores it',async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const buffer={Tris:44.5,Borate:44.5,Acetate:0,EDTA:1};
  // Time zero holds the band within the gel in both directions, isolating
  // curvature from migration and diffusion without changing the renderer.
  const doc={Gelbox:{version:'1.0',type:'gel'},Gel:{Time:0,Voltage:200,WellDamage:0,Buffer:buffer,Samples:[{Buffer:buffer,Fragments:[{Bases:1000,Mass:100,Degrade:0,AspectRatio:1,Color:[1,1,1],Aggregate:[1]}]},null,null,null,null,null,null]}};
  const menu=page.getByRole('button',{name:'Application settings'});
  await menu.click();await page.getByTestId('file-input').setInputFiles({name:'curvature.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});
  await expect(menu).toHaveAttribute('aria-expanded','false');
  await page.getByTestId('settings-button').click();
  const overlay=page.getByTestId('gel-overlay'),gel=(await overlay.boundingBox())!,band=(await page.getByTestId('band-0').boundingBox())!;
  const read=async(name:string)=>{
   await page.mouse.move(0,0);const png=await overlay.screenshot();await writeFile(info.outputPath(`${name}.png`),png);
   const bend=await page.evaluate(async({bytes,width,x1,bw})=>{
    const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
    const canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);bitmap.close();
    const data=ctx.getImageData(0,0,canvas.width,canvas.height).data,scale=canvas.width/width;
    const centroid=(x:number)=>{let weighted=0,total=0;const col=Math.round(x*scale);for(let y=Math.floor(10*scale);y<Math.ceil(32*scale);y++){
     const light=Math.max(0,data[(y*canvas.width+col)*4]-150);weighted+=(y+.5)/scale*light;total+=light;
    }if(total===0)throw Error('No bright band pixels');return weighted/total;};
    const center=centroid(x1+bw*.5),edge=(centroid(x1+bw*.12)+centroid(x1+bw*.88))/2;
    return {center,edge,delta:edge-center};
   },{bytes:[...png],width:gel.width,x1:band.x-gel.x,bw:band.width});
   return {png,bend};
  };
  const positive=await read('positive');expect(positive.bend.delta).toBeLessThan(-.25);
  await page.getByTestId('gel-voltage-icon-lo').click();
  const negative=await read('negative');expect(negative.bend.delta).toBeGreaterThan(.25);
  await page.getByTestId('gel-voltage-icon-hi').click();
  const restored=await read('restored');expect(restored.png).toEqual(positive.png);
  await writeFile(info.outputPath('curvature.json'),JSON.stringify({positive:positive.bend,negative:negative.bend,restored:restored.bend},null,2));
 }finally{await app.close();}
});
