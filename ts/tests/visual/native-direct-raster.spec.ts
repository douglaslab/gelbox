import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const root='../reference/native/modern/direct-band-scenes/';
const cases=JSON.parse(fs.readFileSync('../reference/native/numerical/direct-bands-cases.json','utf8'));
const scenes=JSON.parse(fs.readFileSync(root+'manifest.json','utf8')).cases;
for(const scale of [1,2])test.describe(`native direct bands DPR${scale}`,()=>{
 test.use({viewport:{width:400,height:300},deviceScaleFactor:scale});
 test('complete component pixels match independently rasterized native meshes',async({page},info)=>{
  const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),backend);
  await page.goto('/#/dev');
  await page.evaluate(async()=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {DirectBandCanvas}=await import('/src/components/gel/DirectBandCanvas.tsx');
   const host=document.createElement('div');host.style.cssText='position:fixed;left:0;top:0;z-index:999';document.body.append(host);
   const root=createRoot(host);
   (window as any).__renderNativeDirect=(bands:any[],wells:boolean)=>root.render(React.createElement(DirectBandCanvas,{bands,gelSize:{width:96,height:64},wells:wells?[{x1:12.25,y1:29.75,x2:38.25,y2:34.25},{x1:.25,y1:2.75,x2:4.25,y2:5.25}]:[]}));
   (window as any).__renderNativeDirect([],false);
  });
  const canvas=page.locator('[data-render-mode="direct"]');await expect(canvas).toHaveAttribute('width',String(96*scale));
  const results=[];
  for(const scene of scenes.filter((s:any)=>s.scale===scale)){
   await page.evaluate(({bands,wells})=>(window as any).__renderNativeDirect(bands,wells),{bands:cases.find((c:any)=>c.id===scene.mesh).bands,wells:scene.wells});
   await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
   const png=await canvas.screenshot();await fs.promises.writeFile(info.outputPath(scene.id+'.png'),png);
   const native=fs.readFileSync(root+scene.id+'.png').toString('base64');
   const result=await page.evaluate(async({png,native,scale})=>{
    const decode=async(src:string)=>{const im=new Image();im.src='data:image/png;base64,'+src;await im.decode();if(im.width!==96*scale||im.height!==64*scale)throw Error('Wrong dimensions');const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};
    const [a,b]=await Promise.all([decode(native),decode(png)]);let different=0,max=0;const first=[];
    for(let i=0;i<a.length;i++){if(i%4===3)continue;const delta=Math.abs(a[i]-b[i]);if(delta){different++;max=Math.max(max,delta);if(first.length<8)first.push({x:Math.floor(i/4)%(96*scale),y:Math.floor(i/4/(96*scale)),channel:i%4,native:a[i],web:b[i]});}}
    return{different,max,first};
   },{png:png.toString('base64'),native,scale});
   results.push({id:scene.id,...result});
  }
  await fs.promises.writeFile(info.outputPath('comparison.json'),JSON.stringify(results,null,2));
  expect(results.filter(r=>r.different)).toEqual([]);
 });
});
