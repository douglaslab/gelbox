import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {serveBuiltApp} from './built-app';
import {compareNative} from './native-comparison';
for(const kind of ['edge','background'])for(const scale of [1,2])test.describe(`compiled native ${kind} DPR${scale}`,()=>{
 test.use({viewport:{width:303,height:520},deviceScaleFactor:scale});
 test('actual production well and representative preserve native composition',async({page},info)=>{
  const root=`../reference/native/modern/fragment-${kind}-scenes`,manifest=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8'));
  const bytes=readFileSync(`${root}/cases.json`);expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.casesSha256);
  const cases=JSON.parse(bytes.toString()),app=await serveBuiltApp(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','0');(window as any).__molsimFreezeAfterTicks=0;},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
   await page.goto(`${app.url}#/gel`);
   // Open the real production sample and species UI before isolating its paint.
   await page.getByTestId('band-0').click();
   const representative=page.getByTestId('fragment-representative');
   await expect(representative).toHaveAttribute('data-shared-ready','1');
   const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
   await representative.evaluate((canvas,{kind,backend})=>{
    // Read the existing providers in pinned React18; no product hook or altered bundle.
    const key=Object.keys(canvas).find(k=>k.startsWith('__reactFiber$'));if(!key)throw Error('Missing React18 DOM fiber');
    let store:any,registry:any;
    for(let fiber=(canvas as any)[key];fiber;fiber=fiber.return){const value=fiber.memoizedProps?.value;if(value&&typeof value.getMolecularView==='function')store=value;if(value&&typeof value.collect==='function'&&typeof value.getGraphics==='function')registry=value;}
    if(!store||!registry)throw Error('Missing production store/registry providers');
    if(registry.getGraphics()?.backend!==backend)throw Error('Unexpected production graphics backend');
    const view=store.getMolecularView('sample');if(!view)throw Error('Missing production molecular view');
    const entries=[...registry.entries.values()].filter((e:any)=>e.key==='inspector-fragment'&&e.order===0);
    if(entries.length!==1)throw Error(`Expected one production representative contribution, got ${entries.length}`);
    Object.assign((canvas as HTMLElement).style,{position:'fixed',left:'0px',top:'0px'});
    const tint=[217/255,45/255,81/255,1],triangle={mesh:{data:new Float32Array([[0,0],[303,0],[303,303]].flatMap(p=>[...p,...tint])),vertexCount:3}};
    let background=[1,1,1];
    // Fixture isolation only: keep the compiled component's generated well/particle
    // commands and the real production presentation loop/backend unchanged.
    registry.collect=(_order:any,frame:any)=>({background,commands:[...(kind==='edge'?[triangle]:[]),...entries[0].read(frame)]});
    (window as any).__setComposition=(part:any,color:number[])=>{view.sim.parts=[part];background=color.map(v=>v/255);};
   },{kind,backend});
   const scenes=manifest.cases.filter((s:any)=>s.scale===scale&&s.mesh!=='underlay');
   expect(scenes).toHaveLength(kind==='edge'?3:45);
   for(const scene of scenes){
    const input=cases.find((c:any)=>c.id===scene.mesh);expect(input).toBeTruthy();
    await page.evaluate(({part,background})=>(window as any).__setComposition(part,background),{part:input.part,background:scene.background});
    await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
    const native=readFileSync(`${root}/${scene.id}.png`);expect(createHash('sha256').update(native).digest('hex')).toBe(scene.sha256);
    await compareNative(page,info,native,scene.id);
   }
   expect(errors).toEqual([]);await expect(page.getByRole('alert')).toHaveCount(0);
  }finally{await app.close();}
 });
});
