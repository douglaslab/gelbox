import {test,expect} from '@playwright/test';
import fs from 'node:fs';
for(const scale of [1,2])test.describe(`shared gel DPR${scale}`,()=>{
 test.use({viewport:{width:1365,height:768},deviceScaleFactor:scale});
 test('gel uses the shared context and preserves native startup pixels',async({page},info)=>{
  const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
  await page.addInitScript(b=>{
   localStorage.setItem('gelBackend',b);(window as any).__gelRenders=0;const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(...args:any[]){const context=original.apply(this,args as any);if(context)this.dataset.context=args[0];return context;} as any;
  },backend);
  await page.route(`**/src/lib/gel/render${backend==='webgl2'?'-gl':''}.ts*`,async route=>{const response=await route.fetch(),source=await response.text();await route.fulfill({response,body:source.replace('function render() {','function render() { globalThis.__gelRenders++;')});});
  await page.goto('/#/gel');const gel=page.getByTestId('gel-canvas');
  await expect(gel).toHaveAttribute('data-context',backend);await expect.poll(()=>page.evaluate(()=>(window as any).__gelRenders)).toBeGreaterThan(0);
  await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
  const before=await gel.screenshot();await fs.promises.writeFile(info.outputPath('legacy-startup.png'),before);
  await page.evaluate(()=>localStorage.setItem('gelSharedPresentation','1'));await page.reload();
  await expect(gel).toHaveAttribute('data-shared-ready','1');expect(await gel.getAttribute('data-context')).toBeNull();
  await expect(page.getByTestId('shared-scene')).toHaveAttribute('data-context',backend);
  expect(await gel.boundingBox()).toEqual({x:208,y:124,width:390,height:520});
  const png=await gel.screenshot();await fs.promises.writeFile(info.outputPath('shared-startup.png'),png);
  expect.soft(png.equals(before)).toBe(true);
  if(scale===2){
   const native=fs.readFileSync('../reference/native/modern/lossless-probe/startup.png').toString('base64');
   const tube=await page.screenshot({clip:{x:264,y:80,width:334,height:44}});
   await fs.promises.writeFile(info.outputPath('shared-tube-backgrounds.png'),tube);
   const result=await page.evaluate(async({native,actual,tube})=>{
    const decode=async(s:string)=>{const im=new Image();im.src='data:image/png;base64,'+s;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);return ctx;};
    const a=(await decode(actual)).getImageData(0,0,780,1040).data,b=(await decode(native)).getImageData(416,248,780,1040).data;
    const compare=(a:Uint8ClampedArray,b:Uint8ClampedArray)=>{let different=0,max=0;for(let i=0;i<a.length;i++)if(i%4!==3){const d=Math.abs(a[i]-b[i]);if(d)different++;max=Math.max(max,d);}return {different,max};};
    return {gel:compare(a,b),tubes:compare((await decode(tube)).getImageData(0,0,668,88).data,(await decode(native)).getImageData(528,160,668,88).data)};
   },{native,actual:png.toString('base64'),tube:tube.toString('base64')});
   await fs.promises.writeFile(info.outputPath('native-comparison.json'),JSON.stringify(result,null,2));expect(result).toEqual({gel:{different:0,max:0},tubes:{different:0,max:0}});
  }
 });
});
