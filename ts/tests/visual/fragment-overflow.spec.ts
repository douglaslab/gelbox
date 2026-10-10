import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const input=JSON.parse(fs.readFileSync('../reference/native/modern/fragment-well-scenes/cases.json','utf8'))[0];
for(const scale of [1,2])test.describe(`fragment overflow DPR${scale}`,()=>{
 test.use({viewport:{width:800,height:900},deviceScaleFactor:scale});
 test('representative extends beyond panel while the heading stays above it',async({page},info)=>{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto('/#/dev');
  await page.evaluate(async part=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {GelProvider,useGelStore}=await import('/src/components/gel/GelContext.tsx');
   const {FragmentView}=await import('/src/components/inspector/FragmentView.tsx');
   const {MolecularView}=await import('/src/lib/gel/molecularRuntime.ts');
   const {CinderRand}=await import('/src/lib/sim/rng.ts');
   const view=new MolecularView('reference',new CinderRand(1),{bounds:{x1:0,y1:0,x2:303,y2:520}});
   view.sim.parts=[{...part,radius:{x:190,y:190},fade:1,color:[.2,.4,.6]}];
   const Fixture=()=>{
    const store=useGelStore();
    (window as any).__overflowStore=store;
    store.getMolecularView=()=>view;
    return React.createElement(FragmentView);
   };
   const host=document.createElement('div');host.style.cssText='position:absolute;left:200px;top:200px;width:303px;height:520px;background:white;z-index:999';
   const workspace=document.createElement('div');workspace.dataset.testid='overflow-workspace';
   workspace.style.cssText='height:100dvh;overflow:auto;position:relative;background:white';
   document.body.style.margin='0';workspace.append(host);document.body.replaceChildren(workspace);
   createRoot(host).render(React.createElement(GelProvider,null,React.createElement(Fixture)));
   (window as any).__overflowView=view;
  },input.part);
  // Use the real command store to select the startup ladder's first species.
  await expect.poll(()=>page.evaluate(()=>!!(window as any).__overflowStore)).toBe(true);
  await page.evaluate(()=>{
   const store=(window as any).__overflowStore;
   store.dispatch({type:'SET_SELECTED',laneIndex:0,index:0});
  });
  const preview=page.getByTestId('fragment-representative');await expect(preview).toBeVisible();
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  expect(await page.getByTestId('overflow-workspace').evaluate(e=>[e.scrollWidth,e.scrollHeight,e.clientWidth,e.clientHeight])).toEqual([800,900,800,900]);
  const bounds=await preview.boundingBox();
  expect(bounds!.x).toBeLessThan(150);expect(bounds!.y).toBeLessThan(140);
  // Inspect rendered pixels outside the original panel (its origin is200,200).
  const shot=await page.screenshot();
  const colors=await page.evaluate(async({png,scale})=>{
   const im=new Image();im.src='data:image/png;base64,'+png;await im.decode();
   const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);
   return [[160,311],[317,140]].map(([x,y])=>Array.from(ctx.getImageData(x*scale,y*scale,1,1).data));
  },{png:shot.toString('base64'),scale});
  expect(colors).toEqual([[51,102,153,255],[51,102,153,255]]);
  // Native FragmentView draws the heading after the representative. The actual
  // heading must win paint order where this oversized molecule overlaps it.
  const heading=page.getByRole('heading',{name:'Species'});await expect(heading).toBeVisible();
  const headingPng=await heading.screenshot();
  const ink=await page.evaluate(async png=>{
   const im=new Image();im.src='data:image/png;base64,'+png;await im.decode();
   const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);
   const pixels=ctx.getImageData(0,0,c.width,c.height).data;let ink=0;
   for(let i=0;i<pixels.length;i+=4)if(Math.abs(pixels[i]-127)<3&&Math.abs(pixels[i+1]-148)<3&&Math.abs(pixels[i+2]-172)<3)ink++;
   return ink;
  },headingPng.toString('base64'));
  expect(ink).toBeGreaterThan(10);
  const dimensions=await preview.evaluate(c=>[c.width,c.height]);
  for(const radius of [220,1000000]){
   await page.evaluate(radius=>{(window as any).__overflowView.sim.parts[0].radius={x:radius,y:radius};},radius);
   await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
   expect(await preview.evaluate(c=>[c.width,c.height])).toEqual(dimensions);
   expect(dimensions[0]).toBeLessThanOrEqual(800*scale+2);expect(dimensions[1]).toBeLessThanOrEqual(900*scale+2);
  }
  const node=await preview.elementHandle();
  const cdp=await page.context().newCDPSession(page);
  for(const dpr of [3-scale,scale]){
   await cdp.send('Emulation.setDeviceMetricsOverride',{width:800,height:900,deviceScaleFactor:dpr,mobile:false});
   await expect.poll(()=>preview.evaluate(c=>[c.width,c.height])).toEqual([800*dpr,900*dpr]);
   expect(await node!.evaluate(c=>c.isConnected)).toBe(true);
  }
  // Retain the expanded surface, restore the native reference particle, and
  // compare the well crop after its translated origin and live DPR changes.
  await page.evaluate(part=>{(window as any).__overflowView.sim.parts=[part];},input.part);
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  const crop=await page.screenshot({clip:{x:270,y:265,width:95,height:100}});
  const native=fs.readFileSync(`../reference/native/modern/fragment-well-scenes/${input.id}-${scale}.png`).toString('base64');
  const maxDifference=await page.evaluate(async({png,native,scale})=>{
   const decode=async(src:string,native=false)=>{
    const im=new Image();im.src='data:image/png;base64,'+src;await im.decode();
    const c=document.createElement('canvas');c.width=95*scale;c.height=100*scale;const ctx=c.getContext('2d')!;
    ctx.drawImage(im,native?-70*scale:0,native?-65*scale:0);return ctx.getImageData(0,0,c.width,c.height).data;
   };
   const [a,b]=await Promise.all([decode(png),decode(native,true)]);let maxDifference=0;
   for(let i=0;i<a.length;i++)if(i%4!==3)maxDifference=Math.max(maxDifference,Math.abs(a[i]-b[i]));
   return maxDifference;
  },{png:crop.toString('base64'),native,scale});
  // Separate transparent RGBA8 composition adds at most one level in this scene.
  // The dedicated audit still reports exact native differences.
  expect(maxDifference).toBeLessThanOrEqual(1);
  await expect(page.getByRole('alert')).toHaveCount(0);

 });
});
