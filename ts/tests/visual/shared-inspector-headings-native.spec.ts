import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const root='../reference/native/modern/shared-inspector-headings/';
for(const scale of [1,2])test.describe(`inspector headings DPR${scale}`,()=>{
 test.use({viewport:{width:400,height:460},deviceScaleFactor:scale});
 test('native inspector headings, subheading and rules in view order',async({page},info)=>{
  const metrics=JSON.parse(fs.readFileSync(root+'metrics.json','utf8'));
  expect(fs.readFileSync('src/lib/layout/nativeInspectorText.json','utf8')).toBe(fs.readFileSync(root+'metrics.json','utf8'));
  for(const scene of Object.values(metrics) as any[])for(const t of scene[scale].textures)expect(fs.readFileSync(`public/assets/native-text/${t.id}${scale===2?'@2x':''}.png`)).toEqual(fs.readFileSync(root+`${t.id}-${scale}.png`));
  const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
  await page.addInitScript(b=>{localStorage.setItem('gelBackend',b);localStorage.setItem('gelSharedPresentation','1');},backend);
  await page.goto('/#/dev');
  await page.evaluate(async()=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {GelProvider,useGelStore}=await import('/src/components/gel/GelContext.tsx');
   const {InspectorHeadings}=await import('/src/components/inspector/InspectorHeadings.tsx');
   const {useSharedPresentation}=await import('/src/components/gel/ScenePresentation.tsx');
   const {solidSceneRect}=await import('/src/lib/gel/scenePresentation.ts');
   const Fixture=()=>{
    const store=useGelStore(),registry=useSharedPresentation(),[kind,setKind]=React.useState('gel-settings');
    React.useLayoutEffect(()=>{
     store.registerLayer('backdrop');store.registerLayer('triangle');
     const a=registry.register('backdrop',()=>[solidSceneRect(0,0,400,460,[.1,.2,.35])]);
     const b=registry.register('triangle',()=>[{mesh:{data:new Float32Array([[150,15],[380,450],[20,430]].flatMap(p=>[...p,.8,.3,.1,.65])),vertexCount:3}}]);
     return()=>{a();b();};
    },[registry,store]);
    (window as any).__headings=(kind:string,front:boolean)=>{
     if(kind==='fragment')store.dispatch({type:'SET_SELECTED',laneIndex:0,index:0});
     else {if(kind==='sample-settings')store.dispatch({type:'SET_SELECTED_LANE',laneIndex:0});store.dispatch({type:'SET_INSPECTOR_MODE',mode:kind});}
     setKind(kind);store.raiseLayer('backdrop');store.raiseLayer(front?'inspector-'+kind:'triangle');store.raiseLayer(front?'triangle':'inspector-'+kind);
    };
    return React.createElement('div',{style:{position:'absolute',left:40.25,top:80.75,width:303,height:520}},React.createElement(InspectorHeadings,{kind}));
   };
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:999;background:white';document.body.append(host);
   createRoot(host).render(React.createElement(GelProvider,null,React.createElement(Fixture)));
  });
  await expect(page.getByTestId('shared-scene')).toHaveAttribute('width',String(400*scale));
  const results=[];
  for(const kind of ['gel-settings','sample-settings','fragment'])for(const front of [false,true]){
   await page.evaluate(({kind,front})=>(window as any).__headings(kind,front),{kind,front});
   await expect(page.getByTestId('inspector-headings').getByRole('heading')).toHaveText(kind==='gel-settings'?'Gel':kind==='sample-settings'?'Buffer + Dyes':'Species');
   await expect(page.getByTestId('inspector-headings')).toHaveAttribute('data-shared-ready',`${kind}-${scale}`);
   await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
   const key=kind+(front?'-front-':'-behind-')+scale,png=await page.screenshot();await fs.promises.writeFile(info.outputPath(key+'.png'),png);
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
