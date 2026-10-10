import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const part=JSON.parse(fs.readFileSync('../reference/native/modern/fragment-well-scenes/cases.json','utf8'))[0].part;
for(const scale of [1,2])test.describe(`inspector layers DPR${scale}`,()=>{
 test.use({viewport:{width:1365,height:768},deviceScaleFactor:scale});
 test('native brace paints before the representative',async({page},info)=>{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto('/#/dev');
  await page.evaluate(async part=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {GelProvider,useGelStore}=await import('/src/components/gel/GelContext.tsx');
   const {Stage}=await import('/src/components/stage/Stage.tsx');
   const {Brace}=await import('/src/components/stage/Brace.tsx');
   const {FragmentView}=await import('/src/components/inspector/FragmentView.tsx');
   const {MolecularView}=await import('/src/lib/gel/molecularRuntime.ts');
   const {CinderRand}=await import('/src/lib/sim/rng.ts');
   const view=new MolecularView('reference',new CinderRand(1),{bounds:{x1:0,y1:0,x2:303,y2:520}});
   view.sim.parts=[{...part,radius:{x:190,y:190},fade:0,color:[.2,.4,.6]}];
   const Fixture=()=>{
    const store=useGelStore();(window as any).__layerStore=store;store.getMolecularView=()=>view;
    return React.createElement(Stage,{left:null,middle:null,right:React.createElement(FragmentView),brace:React.createElement(Brace)});
   };
   const host=document.createElement('div');document.body.style.margin='0';document.body.replaceChildren(host);
   createRoot(host).render(React.createElement(GelProvider,null,React.createElement(Fixture)));
   (window as any).__layerView=view;
  },part);
  await expect.poll(()=>page.evaluate(()=>!!(window as any).__layerStore)).toBe(true);
  await page.evaluate(()=>(window as any).__layerStore.dispatch({type:'SET_SELECTED',laneIndex:0,index:0}));
  const brace=page.getByTestId('stage-brace');await expect(brace).toBeVisible();
  const bounds=(await brace.boundingBox())!,panel=(await page.getByTestId('fragment-view').boundingBox())!;
  const before=await brace.screenshot();
  const point=await page.evaluate(async({png,scale,bounds,panel})=>{
   const im=new Image();im.src='data:image/png;base64,'+png;await im.decode();
   const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);
   const d=ctx.getImageData(0,0,c.width,c.height).data;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const i=(y*c.width+x)*4,wx=bounds.x+(x+.5)/scale,wy=bounds.y+(y+.5)/scale;
    if(d[i]<230&&d[i+1]<230&&d[i+2]<230&&Math.hypot(wx-panel.x-117,wy-panel.y-111)<160)return {x:wx,y:wy,underlay:Array.from(d.slice(i,i+3))};
   }
   throw Error('No visible brace pixel within the molecule');
  },{png:before.toString('base64'),scale,bounds,panel});
  for (const fade of [.5,1]) {
  await page.evaluate(fade=>(window as any).__layerView.sim.parts[0].fade=fade,fade);
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  const after=await page.screenshot();
  const color=await page.evaluate(async({png,point,scale})=>{
   const im=new Image();im.src='data:image/png;base64,'+png;await im.decode();
   const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);
   return Array.from(ctx.getImageData(Math.floor(point.x*scale),Math.floor(point.y*scale),1,1).data);
  },{png:after.toString('base64'),point,scale});
  if(fade===1)expect(color).toEqual([51,102,153,255]);
  else {
   // Native source-over: earlier brace remains visible through the molecule.
   const expected=point.underlay.map((v,i)=>(v+[51,102,153][i])/2);
   color.slice(0,3).forEach((v,i)=>expect(Math.abs(v-expected[i])).toBeLessThanOrEqual(1));
   expect(color[3]).toBe(255);
  }
  }
 });
});
