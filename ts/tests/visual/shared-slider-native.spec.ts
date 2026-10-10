import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const root='../reference/native/modern/shared-slider-scenes/';
for(const scale of [1,2])test.describe(`native Slider DPR${scale}`,()=>{
 test.use({viewport:{width:400,height:170},deviceScaleFactor:scale});
 test('native Slider styles, states and ordered paint',async({page},info)=>{
  const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
  await page.addInitScript(b=>{localStorage.setItem('gelBackend',b);localStorage.setItem('gelSharedPresentation','1');},backend);
  await page.goto('/#/dev');
  await page.evaluate(async({scale,cases})=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {GelProvider,useGelStore}=await import('/src/components/gel/GelContext.tsx');
   const {sliderPaint}=await import('/src/lib/gel/sliderPaint.ts');
   const {acquireSceneAsset}=await import('/src/lib/gel/sceneAssets.ts');
   const {resolveAssetUrl}=await import('/src/lib/layout/assets.ts');
   const {useSharedPresentation}=await import('/src/components/gel/ScenePresentation.tsx');
   const {solidSceneRect}=await import('/src/lib/gel/scenePresentation.ts');
   const Fixture=()=>{
    const store=useGelStore(),registry=useSharedPresentation(),ready=React.useRef<HTMLDivElement>(null);
    React.useLayoutEffect(()=>{
     store.registerLayer('backdrop');store.registerLayer('triangle');store.registerLayer('text');
     const icons=['clock-lo','clock-hi'].map(name=>acquireSceneAsset(registry,resolveAssetUrl(`/assets/slider-icons/${name}.png`)));
     const assets=[acquireSceneAsset(registry,resolveAssetUrl('/assets/native-text/ui-font-0.png'),false)];
     const a=registry.register('backdrop',()=>[solidSceneRect(0,0,400,170,[.1,.2,.35])]);
     const b=registry.register('triangle',()=>[{mesh:{data:new Float32Array([[80,15],[340,155],[30,150]].flatMap(p=>[...p,.8,.3,.1,.65])),vertexCount:3}}]);
     const c=registry.register('text',()=>{
      const textures=assets.map(a=>a.texture(registry.getGraphics())),iconTextures=icons.map(a=>a.texture(registry.getGraphics()));if([...textures,...iconTextures].some(t=>!t))return [];
      ready.current!.dataset.ready='1';
      return sliderPaint({...cases[(window as any).__sliderCase??0],width:217,iconGutter:16,iconSize:{x:26,y:26},naturalIcons:[{x:27,y:28},{x:27,y:28}],barSize:{x:120,y:23},barGutter:8,fill:[.3,.6,.8,1],empty:[.85,.9,.95,1],textColor:[.2,.2,.2,1],barRadius:4},iconTextures,textures,scale).map(command=>({...command,transform:[1,0,0,1,60.25,50.75]}));
     });
     return()=>{a();b();c();[...assets,...icons].forEach(a=>a.release());};
    },[registry,store]);
    (window as any).__fontFront=(front:boolean)=>{store.raiseLayer('backdrop');store.raiseLayer(front?'text':'triangle');store.raiseLayer(front?'triangle':'text');};
    return React.createElement('div',{ref:ready,'data-testid':'font-ready'});
   };
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:999;background:white';document.body.append(host);
   createRoot(host).render(React.createElement(GelProvider,null,React.createElement(Fixture)));
  },{scale,cases:JSON.parse(fs.readFileSync(root+'cases.json','utf8'))});
  await expect(page.getByTestId('shared-scene')).toHaveAttribute('width',String(400*scale));
  await expect(page.getByTestId('font-ready')).toHaveAttribute('data-ready','1');
  const results=[];
  for(const [index,c] of JSON.parse(fs.readFileSync(root+'cases.json','utf8')).entries())for(const front of [false,true]){
   await page.evaluate(i=>(window as any).__sliderCase=i,index);
   await page.evaluate(f=>(window as any).__fontFront(f),front);
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
