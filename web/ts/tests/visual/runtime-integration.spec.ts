import {releasePaletteColor} from '../helpers/releasePalette';
import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {readFile} from 'node:fs/promises';

const captures=JSON.parse(readFileSync('../reference/native/runtime/outputs.json','utf8'));
const nativeSpecies=captures.find((c:any)=>c.id==='species').frames[2].views.a.fragments;

test.beforeEach(async({page},info)=>{
  await page.addInitScript(backend=>{
    localStorage.setItem('gelBackend',backend);
    (window as unknown as {__molsimFreezeAfterTicks:number}).__molsimFreezeAfterTicks=4;
  },info.project.name.includes('webgl2')?'webgl2':'webgpu');
  await page.setViewportSize({width:1365,height:800});
});

async function saveSample(page:Page) {
  await page.getByRole('button',{name:'Application settings'}).click();
  const download=page.waitForEvent('download');
  await page.getByTestId('save-sample-btn').click();
  return JSON.parse(await readFile((await (await download).path())!,'utf8')).Sample;
}

test('StrictMode app creates species from the native persistent view stream',async({page})=>{
  await page.goto('/#/gel');
  await page.getByTestId('microtube-2').click();
  await page.getByRole('button',{name:'New species'}).click();
  await page.getByRole('button',{name:'New species'}).click();
  const sample=await saveSample(page);
  expect(sample.Fragments).toHaveLength(2);
  for(let i=0;i<2;i++) {
    const expected=nativeSpecies[i];
    expect(sample.Fragments[i]).toMatchObject({Bases:expected.bases,Mass:expected.mass,
      AspectRatio:expected.aspectRatio,Degrade:expected.degrade,Color:releasePaletteColor(expected.color),Aggregate:expected.aggregate});
  }
});

test('molecular simulation advances while GPU module acquisition is held',async({page})=>{
  let release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  let requested=false;
  await page.route('**/src/lib/gpu/**/meshBatch.ts*',async route=>{
    requested=true;await gate;await route.continue();
  });
  await page.route('**/src/lib/gpu/meshBatch.ts*',async route=>{
    requested=true;await gate;await route.continue();
  });
  try {
    await page.goto('/#/gel');
    await page.getByTestId('microtube-0').click();
    await expect.poll(()=>requested).toBe(true);
    const canvas=page.getByTestId('molecular-sim-canvas');
    await expect(canvas).toHaveAttribute('data-frozen','1');
    await expect.poll(async()=>Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
  } finally {release();await page.unrouteAll({behavior:'wait'});}
});

test('right pointer-down creates a species before release and starts its drag',async({page})=>{
  await page.goto('/#/gel');
  const gel=(await page.getByTestId('gel-overlay').boundingBox())!;
  await page.mouse.move(gel.x+gel.width*.5,gel.y+250);
  await page.mouse.down({button:'right'});
  try {
    await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','3');
    await expect(page.getByTestId('fragment-view')).toBeVisible();
    await page.mouse.move(gel.x+gel.width*.66,gel.y+260,{steps:4});
    await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','4');
  } finally {await page.mouse.up({button:'right'});}
  expect((await saveSample(page)).Fragments).toHaveLength(1);
});

test('held sample gesture suspends rollover and release restores it without another move',async({page})=>{
  await page.goto('/#/gel');
  await page.evaluate(()=>{(window as unknown as {__molsimFreezeAfterTicks:number}).__molsimFreezeAfterTicks=90;});
  await page.getByTestId('microtube-0').click();
  const canvas=page.getByTestId('molecular-sim-canvas');
  await expect(canvas).toHaveAttribute('data-frozen','1');
  const png=await canvas.screenshot();
  const points=await page.evaluate(async bytes=>{
    const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
    const c=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=c.getContext('2d')!;
    ctx.drawImage(bitmap,0,0);bitmap.close();
    const pixels=ctx.getImageData(0,0,c.width,c.height).data;
    let background:{x:number;y:number}|undefined,particle:{x:number;y:number}|undefined;
    for(let y=12;y<c.height-12;y++)for(let x=12;x<c.width-12;x++) {
      const i=(y*c.width+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];
      if(!background&&r>230&&g>230&&b>230)background={x:x/c.width,y:y/c.height};
      const dark=(px:number,py:number)=>{const k=(py*c.width+px)*4;return Math.max(pixels[k],pixels[k+1],pixels[k+2])<100;};
      if(!particle&&dark(x,y)&&dark(x-4,y)&&dark(x+4,y)&&dark(x,y-4)&&dark(x,y+4))
        particle={x:x/c.width,y:y/c.height};
    }
    if(!background||!particle)throw new Error('Missing rendered background or particle probe');
    return{background,particle};
  },[...png]);
  const bounds=(await canvas.boundingBox())!;
  const move=async(p:{x:number;y:number})=>page.mouse.move(bounds.x+p.x*bounds.width,bounds.y+p.y*bounds.height);
  await move(points.particle);await expect(page.getByTestId('fragment-view')).toBeVisible();
  await move(points.background);await page.mouse.down();
  try {
    await move(points.particle);
    await page.evaluate(()=>new Promise<void>(resolve=>{let n=4;const tick=()=>--n?requestAnimationFrame(tick):resolve();requestAnimationFrame(tick);}));
    await expect(page.getByTestId('fragment-view')).toHaveCount(0);
  } finally {await page.mouse.up();}
  await expect(page.getByTestId('fragment-view')).toBeVisible();
});
