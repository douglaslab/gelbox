import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const root='../reference/native/modern/shared-menu-scenes/';
for(const scale of [1,2])test.describe(`native menu DPR${scale}`,()=>{
 test.use({viewport:{width:400,height:240},deviceScaleFactor:scale});
 test('native menu styles, states and ordered paint',async({page},info)=>{
  const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
  await page.addInitScript(b=>{localStorage.setItem('gelBackend',b);localStorage.setItem('gelSharedPresentation','1');},backend);
  await page.goto('/#/dev');
  await page.evaluate(async({scale,cases})=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {GelProvider,useGelStore}=await import('/src/components/gel/GelContext.tsx');
   const {FileControlMenu}=await import('/src/components/chrome/FileControls.tsx');
   const {useSharedPresentation}=await import('/src/components/gel/ScenePresentation.tsx');
   const {solidSceneRect}=await import('/src/lib/gel/scenePresentation.ts');
   const Fixture=()=>{
    const store=useGelStore(),registry=useSharedPresentation(),[index,setIndex]=React.useState(0);
    React.useLayoutEffect(()=>{
     store.registerLayer('backdrop');store.registerLayer('triangle');store.registerLayer('app-settings');
     const a=registry.register('backdrop',()=>[solidSceneRect(0,0,400,240,[.1,.2,.35])]);
     const b=registry.register('triangle',()=>[{mesh:{data:new Float32Array([[100,15],[380,220],[15,210]].flatMap(p=>[...p,.8,.3,.1,.65])),vertexCount:3}}]);
     return()=>{a();b();};
    },[registry,store]);
    (window as any).__menuCase=setIndex;
    (window as any).__menuFront=(front:boolean)=>{store.raiseLayer('backdrop');store.raiseLayer(front?'app-settings':'triangle');store.raiseLayer(front?'triangle':'app-settings');};
    return React.createElement(FileControlMenu,{selected:cases[index].selected,hoverLoupe:cases[index].checked,render:cases[index].checked,onOpen:()=>{},onSaveGel:()=>{},onSaveSample:()=>{},onHoverLoupe:()=>{},onRender:()=>{}});
   };
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:999;background:white';document.body.append(host);
   createRoot(host).render(React.createElement(GelProvider,null,React.createElement(Fixture)));
  },{scale,cases:JSON.parse(fs.readFileSync(root+'cases.json','utf8'))});
  await expect(page.getByTestId('shared-scene')).toHaveAttribute('width',String(400*scale));
  await expect(page.locator('#application-file-menu')).toHaveAttribute('data-shared-ready','menu');
  await expect(page.getByTestId('application-menu-divider')).toHaveAttribute('data-shared-ready','1');
  const results=[];
  for(const [index,c] of JSON.parse(fs.readFileSync(root+'cases.json','utf8')).entries())for(const front of [false,true]){
   await page.evaluate(i=>(window as any).__menuCase(i),index);
   await page.evaluate(({front,c})=>{
    (window as any).__menuFront(front);
    const menu=document.getElementById('application-file-menu')!;menu.style.left='60.25px';menu.style.top='220.75px';menu.style.bottom='auto';
    menu.querySelectorAll('button,label').forEach(el=>{(el as HTMLElement).dataset.menuHover=String(c.hover);(el as HTMLElement).dataset.menuDown=String(c.down&&c.inside);});
   },{front,c});
   await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
   await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
   const key=c.id+(front?'-front-':'-behind-')+scale,png=await page.screenshot();await fs.promises.writeFile(info.outputPath(key+'.png'),png);
   const native=fs.readFileSync(root+key+'.png').toString('base64');
   const result=await page.evaluate(async({png,native})=>{
    const decode=async(src:string)=>{const im=new Image();im.src='data:image/png;base64,'+src;await im.decode();const canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(im,0,0);return ctx.getImageData(0,0,canvas.width,canvas.height).data;};
    const [a,b]=await Promise.all([decode(native),decode(png)]);let different=0,max=0;const first=[];
    for(let i=0;i<a.length;i++)if(i%4!==3){const d=Math.abs(a[i]-b[i]);if(d){different++;max=Math.max(max,d);if(first.length<6)first.push({pixel:Math.floor(i/4),channel:i%4,native:a[i],web:b[i]});}}
    return {different,max,first};
   },{native,png:png.toString('base64')});
   results.push({id:key,...result});
  }
  await fs.promises.writeFile(info.outputPath('comparison.json'),JSON.stringify(results,null,2));
  expect(results.filter(r=>r.different)).toEqual([]);
 });
});
