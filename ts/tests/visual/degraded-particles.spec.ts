import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('degraded ellipses and multimers render through the application GPU path',async({page},info)=>{
 const backend=info.project.name.includes('webgl2')?'webgl2':'webgpu';
 await page.addInitScript(b=>{
  localStorage.setItem('gelBackend',b);
  (window as any).__molsimFreezeAfterTicks=90;
 },backend);
 await page.setViewportSize({width:1365,height:768});
 await page.goto('/#/gel');
 const doc=JSON.parse(await readFile('../reference/native/files/ladder-after-selection.gel.json','utf8'));
 doc.Gel.Samples[0].Fragments=[
  {Bases:5000,Mass:220,Degrade:1.5,AspectRatio:3,Aggregate:[1],Color:[.2,.4,.8]},
  {Bases:3000,Mass:160,Degrade:1.75,AspectRatio:2,Aggregate:[0,1],Color:[.8,.2,.1]},
  {Bases:1500,Mass:100,Degrade:2,AspectRatio:1,Aggregate:[1],Color:[.1,.6,.2]},
 ];
 await page.getByRole('button',{name:'Application settings'}).click();
 await page.getByTestId('file-input').setInputFiles({name:'degraded.gel.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});
 await page.getByTestId('microtube-0').click();
 const canvas=page.getByTestId('molecular-sim-canvas');
 await expect(canvas).toHaveAttribute('data-frozen','1');
 expect(await canvas.evaluate((el,type)=>(el as HTMLCanvasElement).getContext(type)!==null,backend)).toBe(true);
 await page.mouse.move(0,0);
 const png=await canvas.screenshot();
 const colored=await page.evaluate(async bytes=>{
  const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
  const c=new OffscreenCanvas(image.width,image.height),ctx=c.getContext('2d')!;
  ctx.drawImage(image,0,0);image.close();
  const pixels=ctx.getImageData(0,0,c.width,c.height).data;
  let count=0;for(let i=0;i<pixels.length;i+=4)if(Math.max(pixels[i],pixels[i+1],pixels[i+2])-Math.min(pixels[i],pixels[i+1],pixels[i+2])>30)count++;
  return count;
 },[...png]);
 expect(colored,'degraded molecules must actually render').toBeGreaterThan(100);
 await expect(canvas).toHaveScreenshot('degraded-particles.png',{maxDiffPixels:20});
});
