import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root='../reference/native/modern/full-window-scenes';
const manifest=JSON.parse(fs.readFileSync(`${root}/manifest.json`,'utf8'));
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
for(const scene of ['sample','species'])test(`complete shared ${scene} window matches native captured state`,async({page},info)=>{
 const native=fs.readFileSync(`${root}/${scene}.png`),stateBytes=fs.readFileSync(`${root}/${scene}.json`);
 for(const [name,bytes] of [[`${scene}.png`,native],[`${scene}.json`,stateBytes]] as const)expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.captures[name]);
 const state=JSON.parse(stateBytes.toString());
 await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');(window as any).__molsimFreezeAfterTicks=0;},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.route('**/src/components/sample/SampleSimCanvas.tsx*',async route=>{const response=await route.fetch(),body=await response.text();expect(body).toContain('const store = useGelStore();');await route.fulfill({response,body:body.replace('const store = useGelStore();','const store = useGelStore(); globalThis.__windowStore=store; globalThis.__windowMesh=()=>{const v=store.getMolecularView("sample"),h=store.getMolecularHighlights(v);return [...buildMoleculesMesh(v.sim.parts,h.selected,h.rollover,MESH_TUNING).data];};')});});
 await page.goto('/#/gel');
 // Modern Cinder's palette differs by a float32 step from the original release.
 // Replay the captured document as well as its particles; keep release defaults.
 await page.getByRole('button',{name:'Application settings'}).click();
 await page.getByTestId('file-input').setInputFiles({name:'captured.gel.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({Gelbox:{type:'gel',version:'1.0'},Gel:state.gel}))});
 await expect(page.getByRole('button',{name:'Application settings'})).toHaveAttribute('aria-expanded','false');
 await page.getByTestId('microtube-0').click();await page.mouse.move(0,0);
 await expect(page.getByTestId('molecular-sim-canvas')).toHaveAttribute('data-frozen','1');
 await page.evaluate(({parts,selectedFragment})=>{const store=(window as any).__windowStore;store.getMolecularView('sample').sim.parts=parts;if(selectedFragment>=0)store.dispatch({type:'SET_SELECTED',laneIndex:0,index:selectedFragment});},state);
 for(const target of [page.getByTestId('gel-canvas'),page.getByTestId('microtube-row'),page.getByTestId('settings-button'),page.getByRole('link',{name:'Help',exact:true}),page.getByRole('button',{name:'Application settings'}),page.getByTestId('timeline-slider'),page.getByTestId('molecular-sim-canvas')])await expect(target).toHaveAttribute('data-shared-ready','1');
 if(scene==='species')await expect(page.getByTestId('fragment-representative')).toHaveAttribute('data-shared-ready','1');
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 await expect(page.getByRole('alert')).toHaveCount(0);
 await fs.promises.writeFile(info.outputPath("mesh.json"),JSON.stringify(await page.evaluate(()=>(window as any).__windowMesh())));
 const actual=await page.screenshot();await fs.promises.writeFile(info.outputPath(`${scene}.png`),actual);
 const result=await page.evaluate(async({actual,native})=>{
  const decode=async(bytes:number[])=>{const im=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'})),canvas=new OffscreenCanvas(im.width,im.height),ctx=canvas.getContext('2d')!;ctx.drawImage(im,0,0);im.close();return {width:canvas.width,height:canvas.height,data:ctx.getImageData(0,0,canvas.width,canvas.height).data};};
  const a=await decode(actual),b=await decode(native);if(a.width!==b.width||a.height!==b.height)throw Error('Different window sizes');
  let different=0,max=0,minX=a.width,minY=a.height,maxX=-1,maxY=-1;const tiles:Record<string,number>={};
  for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++)for(let c=0;c<3;c++){
   const i=(y*a.width+x)*4+c,d=Math.abs(a.data[i]-b.data[i]);if(!d)continue;
   different++;max=Math.max(max,d);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   const tile=`${Math.floor(x/100)},${Math.floor(y/100)}`;tiles[tile]=(tiles[tile]??0)+1;
  }
  return {differentChannels:different,maxChannelDifference:max,bounds:{minX,minY,maxX,maxY},tiles};
 },{actual:[...actual],native:[...native]});
 await fs.promises.writeFile(info.outputPath('comparison.json'),JSON.stringify(result,null,2));
 expect(result.differentChannels).toBe(0);
});
