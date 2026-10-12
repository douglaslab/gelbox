import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const root='../reference/native/numerical/background/';
const cases=JSON.parse(fs.readFileSync(root+'cases.json','utf8'));
const outputs=JSON.parse(fs.readFileSync(root+'outputs.json','utf8'));
const names=['Xylene cyanol','Cresol red','Bromphenol blue','Orange G'];
test.use({viewport:{width:1365,height:768}});
for(const id of ['999-0-0-0','duplicate','duplicate-over'])test(`imported dye tint follows native mass for ${id}`,async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';await page.addInitScript(b=>localStorage.setItem('gelBackend',b),backend);await page.goto('/#/gel');
 const source=cases.find((c:any)=>c.id==='h0-'+id);
 const fragments=source.fragments??source.dyes.flatMap((mass:number,dye:number)=>mass?[{mass,dye}]:[]);
 const sample={Gelbox:{version:'1.0',type:'sample'},Sample:{name:'Native dye reference',Fragments:fragments.map((f:any)=>({Dye:names[f.dye],Mass:f.mass}))}};
 await page.getByTestId('file-input').setInputFiles({name:'native-dye.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(sample))});
 await page.getByTestId('microtube-1').click();const canvas=page.getByTestId('molecular-sim-canvas');await expect(canvas).toBeVisible();
 const pixel=async()=>{
  const png=(await canvas.screenshot()).toString('base64');
  return page.evaluate(async src=>{const im=new Image();im.src='data:image/png;base64,'+src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);return Array.from(ctx.getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data).slice(0,3);},png);
 };
 for(const highlight of [0,1,2]){
  if(highlight===0)await page.mouse.move(0,0);
  else if(highlight===1)await canvas.hover({position:{x:100,y:100}});
  else await page.mouse.down();
  await expect.poll(pixel).toEqual(outputs.find((r:any)=>r.id===`h${highlight}-${id}`).rgb);
 }
 await page.mouse.up();await page.mouse.move(0,0);
 await page.getByRole('button',{name:'Application settings'}).click();const pending=page.waitForEvent('download');await page.getByTestId('save-sample-btn').click();
 const exported=JSON.parse(await fs.promises.readFile((await(await pending).path())!,'utf8'));
 expect(exported.Sample.Fragments.map((f:any)=>({Dye:f.Dye,Mass:f.Mass}))).toEqual(sample.Sample.Fragments);
});
