import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root='../reference/native/modern/full-window-overlap';
const manifest=JSON.parse(fs.readFileSync(`${root}/manifest.json`,'utf8'));
const asset=fs.readFileSync(`${root}/${manifest.image.file}`);
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const readState=(scene:string)=>{const bytes=fs.readFileSync(`${root}/${scene}.json`);expect(sha(bytes)).toBe(manifest.captures[`${scene}.json`]);return JSON.parse(bytes.toString());};
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
test('complete overlapping image, species and loupe windows follow native ordering',async({page},info)=>{
 expect(sha(asset)).toBe(manifest.image.sha256);
 const initial=readState('image-before-species');
 await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');(window as any).__molsimFreezeAfterTicks=0;},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.route('**/src/components/sample/SampleSimCanvas.tsx*',async route=>{const response=await route.fetch(),body=await response.text();expect(body).toContain('const store = useGelStore();');await route.fulfill({response,body:body.replace('const store = useGelStore();','const store = useGelStore(); globalThis.__windowStore=store;')});});
 await page.goto('/#/gel');
 await page.getByRole('button',{name:'Application settings'}).click();
 await page.getByTestId('file-input').setInputFiles({name:'captured.gel.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({Gelbox:{type:'gel',version:'1.0'},Gel:initial.gel}))});
 await expect(page.getByRole('button',{name:'Application settings'})).toHaveAttribute('aria-expanded','false');
 await page.getByTestId('microtube-0').click();await page.mouse.move(0,0);
 let imageCount=0;
 const drop=async(x:number,y:number,resize=false)=>{
  await page.evaluate(({bytes,x,y})=>{const data=new DataTransfer();data.items.add(new File([new Uint8Array(bytes)],'alpha.png',{type:'image/png'}));document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:data,clientX:Math.trunc(x),clientY:Math.trunc(y)}));},{bytes:[...asset],x,y});
  const image=page.getByTestId(`reference-image-${++imageCount}`);await expect(image).toBeFocused();
  await expect(page.getByTestId(`reference-image-canvas-${imageCount}`)).toHaveAttribute('data-shared-ready','1');
  if(resize){const r=(await image.boundingBox())!;await page.mouse.move(r.x+r.width-1,r.y+r.height-1);await page.mouse.down();await page.mouse.move(r.x+r.width-1+256,r.y+r.height-1+128);await page.mouse.up();expect(await image.boundingBox()).toEqual({x:916,y:193,width:384,height:192});}
  await page.mouse.move(0,0);
 };
 const capture=async(scene:string)=>{
  const state=readState(scene);
  await page.mouse.move(0,0);
  for(const [key,v] of Object.entries(state.views) as [string,any][]){
   const canvas=page.getByTestId(key==='sample'?'molecular-sim-canvas':'loupe-canvas-1');
   if(v.active){await expect(canvas).toHaveAttribute('data-frozen','1');await expect(canvas).toHaveAttribute('data-shared-ready','1');}
   else await expect(canvas).toHaveCount(0);
  }
  await page.evaluate(views=>{const store=(window as any).__windowStore;for(const [key,v] of Object.entries(views) as [string,any][]){const view=store.getMolecularView(key);if(v.active){if(!view)throw Error(`Missing ${key}`);view.sim.parts=v.parts;}}},state.views);
  for(const [key,v] of Object.entries(state.views) as [string,any][]){if(key==='sample'&&v.active)expect(await page.evaluate(()=>{const s=(window as any).__windowStore;return s.getMolecularHighlights(s.getMolecularView('sample')).selected??-1;})).toBe(v.selectedFragment);}
  await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
  await expect(page.getByRole('alert')).toHaveCount(0);
  const native=fs.readFileSync(`${root}/${scene}.png`);expect(sha(native)).toBe(manifest.captures[`${scene}.png`]);
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
 await fs.promises.writeFile(info.outputPath(`${scene}-comparison.json`),JSON.stringify(result,null,2));
 expect.soft(result.differentChannels,scene).toBe(0);
 };
 await drop(980,225,true);await capture('image-before-species');
 await page.evaluate(()=>{(window as any).__windowStore.dispatch({type:'SET_SELECTED',laneIndex:0,index:0});});
 await expect(page.getByTestId('fragment-representative')).toHaveAttribute('data-shared-ready','1');
 await capture('species-above-image');
 await drop(980,225,true);await capture('image-above-species');
 await page.keyboard.down('Meta');await page.mouse.click(236,300);await page.keyboard.up('Meta');await page.mouse.move(0,0);
 const loupe=page.getByTestId('loupe-frame-1');await expect(loupe).toBeFocused();await capture('loupe-created');
 const r=(await loupe.boundingBox())!;expect(r).toEqual({x:321.5,y:214.5,width:171,height:171});
 await drop(r.x+115,r.y+55);await capture('image-above-loupe');
 await page.mouse.click(Math.trunc(r.x+2),Math.trunc(r.y+145));await page.mouse.move(0,0);await expect(loupe).toBeFocused();
 await capture('loupe-raised');
});
