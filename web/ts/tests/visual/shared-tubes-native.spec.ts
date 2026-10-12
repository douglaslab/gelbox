import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const root='../reference/native/modern/shared-tube-scenes/';
const cases=JSON.parse(fs.readFileSync(root+'cases.json','utf8'));
for(const scale of [1,2])test.describe(`shared tubes DPR${scale}`,()=>{
 test.use({viewport:{width:500,height:680},deviceScaleFactor:scale});
 test('native loaded lanes and floating drag tube',async({page},info)=>{
  const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
  await page.addInitScript(b=>{localStorage.setItem('gelBackend',b);localStorage.setItem('gelSharedPresentation','1');},backend);
  await page.goto('/#/dev');
  await page.evaluate(async()=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {GelProvider,useGelStore}=await import('/src/components/gel/GelContext.tsx');
   const {useSharedPresentation}=await import('/src/components/gel/ScenePresentation.tsx');
   const {MicrotubeRow}=await import('/src/components/gel/MicrotubeRow.tsx');
   const {solidSceneRect}=await import('/src/lib/gel/scenePresentation.ts');
   const Fixture=()=>{
    const store=useGelStore(),registry=useSharedPresentation();
    React.useLayoutEffect(()=>registry.register('gel',()=>[solidSceneRect(50,90,440,610,[0,0,0])]),[registry]);
    (window as any).__renderTubes=(scene:any)=>{
     const state=store.getSnapshot().gel,loaded=scene.initial??scene.loaded;
     store.dispatch({type:'LOAD_GEL_STATE',numLanes:scene.lanes,ctx:state.ctx,samples:Array.from({length:scene.lanes},(_,i)=>loaded.includes(i)?{fragments:[],buffer:state.ctx.gelBuffer}:null)});
     if(scene.selected>=0)store.dispatch({type:'SET_SELECTED_LANE',laneIndex:scene.selected});
    };
    return React.createElement('div',{style:{position:'absolute',left:50,top:90,width:390,height:520}},React.createElement(MicrotubeRow));
   };
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:999;background:white';document.body.append(host);
   createRoot(host).render(React.createElement(GelProvider,null,React.createElement(Fixture)));
  });
  await expect(page.getByTestId('shared-scene')).toHaveAttribute('width',String(500*scale));
  const results=[];
  for(const scene of cases){
   await page.evaluate(scene=>(window as any).__renderTubes(scene),scene);
   await expect(page.getByTestId('microtube-row')).toHaveAttribute('data-shared-ready','1');
   await expect(page.locator('[data-testid^="microtube-"][data-lane-index]')).toHaveCount(scene.lanes);
   if(scene.mouse){await page.mouse.move(50+scene.down[0],90+scene.down[1]);await page.mouse.down();await page.mouse.move(50+scene.mouse[0],90+scene.mouse[1]);}
   else await page.mouse.move(0,0);
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
   if(scene.mouse)await page.mouse.up();
  }
  await fs.promises.writeFile(info.outputPath('comparison.json'),JSON.stringify(results,null,2));
  expect(results.filter(r=>r.different)).toEqual([]);
 });
});
