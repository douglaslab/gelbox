import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const root='../reference/native/modern/shared-sample-scenes/';
const cases=JSON.parse(fs.readFileSync(root+'cases.json','utf8'));
for(const scale of [1,2])test.describe(`shared sample DPR${scale}`,()=>{
 test.use({viewport:{width:400,height:400},deviceScaleFactor:scale});
 test('native sample frame, focus and new-species button order',async({page},info)=>{
  const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
  await page.addInitScript(b=>{localStorage.setItem('gelBackend',b);localStorage.setItem('gelSharedPresentation','1');},backend);
  await page.goto('/#/dev');
  await page.evaluate(async()=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {GelProvider,useGelStore}=await import('/src/components/gel/GelContext.tsx');
   const {useSharedPresentation}=await import('/src/components/gel/ScenePresentation.tsx');
   const {SampleView}=await import('/src/components/sample/SampleView.tsx');
   const {solidSceneRect}=await import('/src/lib/gel/scenePresentation.ts');
   const Fixture=()=>{
    const store=useGelStore(),registry=useSharedPresentation();
    React.useLayoutEffect(()=>{
     const state=store.getSnapshot().gel;store.dispatch({type:'LOAD_GEL_STATE',numLanes:1,ctx:state.ctx,samples:[{fragments:[],buffer:state.ctx.gelBuffer}]});store.dispatch({type:'SET_SELECTED_LANE',laneIndex:0});
     store.registerLayer('triangle');store.registerLayer('backdrop');const a=registry.register('backdrop',()=>[solidSceneRect(0,0,400,400,[.1,.2,.35])]);
     const b=registry.register('triangle',()=>[{mesh:{data:new Float32Array([[240,20],[380,360],[40,330]].flatMap(p=>[...p,.8,.3,.1,.65])),vertexCount:3}}]);
     return()=>{a();b();store.unregisterLayer('triangle');};
    },[store,registry]);
    (window as any).__renderButton=(front:boolean)=>{
     store.raiseLayer('backdrop');store.raiseLayer(front?'sample':'triangle');store.raiseLayer(front?'triangle':'sample');
    };
    return React.createElement('div',{style:{position:'absolute',left:80.25,top:110.75,width:200,height:171}},React.createElement(SampleView));
   };
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:999;background:white';document.body.append(host);
   createRoot(host).render(React.createElement(GelProvider,null,React.createElement(Fixture)));
  });
  await expect(page.getByTestId('shared-scene')).toHaveAttribute('width',String(400*scale));
  const results=[];
  for(const scene of cases){
   await expect(page.getByTestId('new-species')).toHaveAttribute('data-shared-ready','1');
   await expect(page.getByTestId('sample-view')).toHaveAttribute('data-shared-frame-ready','1');
   await expect(page.getByTestId('sample-header')).toHaveAttribute('data-shared-ready','1');
   await expect(page.getByTestId('molecular-sim-canvas')).toHaveAttribute('data-shared-ready','1');
   await page.evaluate(front=>(window as any).__renderButton(front),scene.front);
   if(scene.hover)await page.mouse.move(130,160);else if(scene.buttonHover)await page.mouse.move(264,314);else await page.mouse.move(0,0);
   if(scene.focus)await page.getByTestId('sample-view').focus();else await page.getByTestId('sample-view').evaluate(el=>(el as HTMLElement).blur());
   if(scene.down||scene.buttonDown)await page.mouse.down();
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
   if(scene.down||scene.buttonDown){await page.mouse.move(0,0);await page.mouse.up();}
  }
  await fs.promises.writeFile(info.outputPath('comparison.json'),JSON.stringify(results,null,2));
  expect(results.filter(r=>r.different)).toEqual([]);
 });
});
