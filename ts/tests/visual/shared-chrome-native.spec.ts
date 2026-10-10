import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const root='../reference/native/modern/shared-chrome-scenes/';
const cases=JSON.parse(fs.readFileSync(root+'cases.json','utf8'));
for(const scale of [1,2])test.describe(`shared chrome asset DPR${scale}`,()=>{
 test.use({viewport:{width:400,height:600},deviceScaleFactor:scale});
 test('native Help, application button and brace textures in shared order',async({page},info)=>{
  const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
  await page.addInitScript(b=>{localStorage.setItem('gelBackend',b);localStorage.setItem('gelSharedPresentation','1');},backend);
  await page.goto('/#/dev');
  await page.evaluate(async()=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {GelProvider,useGelStore}=await import('/src/components/gel/GelContext.tsx');
   const {useSharedPresentation}=await import('/src/components/gel/ScenePresentation.tsx');
   const {FileControls}=await import('/src/components/chrome/FileControls.tsx');
   const {HelpButton}=await import('/src/components/chrome/HelpButton.tsx');
   const {Brace}=await import('/src/components/stage/Brace.tsx');
   const {solidSceneRect}=await import('/src/lib/gel/scenePresentation.ts');
   const Fixture=()=>{
    const store=useGelStore(),registry=useSharedPresentation(),[asset,setAsset]=React.useState('help');
    React.useLayoutEffect(()=>{
     store.dispatch({type:'SET_SELECTED',laneIndex:0,index:0});store.registerLayer('triangle');store.registerLayer('backdrop');const a=registry.register('backdrop',()=>[solidSceneRect(0,0,400,600,[.1,.2,.35])]);
     const b=registry.register('triangle',()=>[{mesh:{data:new Float32Array([[70,30],[260,210],[40,220]].flatMap(p=>[...p,.8,.3,.1,.65])),vertexCount:3}}]);
     return()=>{a();b();store.unregisterLayer('triangle');};
    },[store,registry]);
    (window as any).__renderButton=(front:boolean,asset:string)=>{
     setAsset(asset);const key=asset==='help'?'help-button':asset==='settings'?'app-button':'inspector-fragment';
     store.raiseLayer('backdrop');store.raiseLayer(front?key:'triangle');store.raiseLayer(front?'triangle':key);
    };
    return React.createElement('div',{style:{position:'absolute',left:80.25,top:50.75}},React.createElement(asset==='help'?HelpButton:asset==='settings'?FileControls:Brace));
   };
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:999;background:white';document.body.append(host);
   const style=document.createElement('style');style.textContent='a[aria-label="Help"],button[aria-label="Application settings"] {position:absolute !important;left:0px !important;top:0px !important;right:auto !important;bottom:auto !important;}';document.head.append(style);
   host.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();},true);
   createRoot(host).render(React.createElement(GelProvider,null,React.createElement(Fixture)));
  });
  await expect(page.getByTestId('shared-scene')).toHaveAttribute('width',String(400*scale));
  const results=[];
  for(const scene of cases){
   await page.evaluate(scene=>(window as any).__renderButton(scene.front,scene.asset),scene);
   const element=scene.asset==='help'?page.getByRole('link',{name:'Help'}):scene.asset==='settings'?page.getByRole('button',{name:'Application settings'}):page.getByTestId('brace');
   await expect(element).toHaveAttribute('data-shared-ready','1');
   expect(await element.boundingBox()).toEqual({x:80.25,y:50.75,width:scene.asset==='brace'?44:32,height:scene.asset==='brace'?465:32});
   if(scene.hover)await page.mouse.move(96,66);else await page.mouse.move(0,0);
   if(scene.down)await page.mouse.down();
   await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
   const key=scene.id+'-'+scale,png=await page.screenshot();await fs.promises.writeFile(info.outputPath(key+'.png'),png);
   const native=fs.readFileSync(root+key+'.png').toString('base64');
   const result=await page.evaluate(async({png,native})=>{
    const decode=async(src:string)=>{const im=new Image();im.src='data:image/png;base64,'+src;await im.decode();const canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(im,0,0);return ctx.getImageData(0,0,canvas.width,canvas.height).data;};
    const [a,b]=await Promise.all([decode(native),decode(png)]);let different=0,max=0;const first=[];
    for(let i=0;i<a.length;i++)if(i%4!==3){const d=Math.abs(a[i]-b[i]);if(d){different++;max=Math.max(max,d);if(first.length<6)first.push({pixel:Math.floor(i/4),channel:i%4,native:a[i],web:b[i]});}}
    return {different,max,first};
   },{native,png:png.toString('base64')});
   results.push({id:key,...result});
   if(scene.down)await page.mouse.up();
  }
  await fs.promises.writeFile(info.outputPath('comparison.json'),JSON.stringify(results,null,2));
  expect(results.filter(r=>r.different)).toEqual([]);
 });
});
