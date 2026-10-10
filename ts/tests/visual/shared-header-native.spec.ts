import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const root='../reference/native/modern/shared-header-scenes/';
for(const scale of [1,2])test.describe(`sample header DPR${scale}`,()=>{
 test.use({viewport:{width:320,height:160},deviceScaleFactor:scale});
 test('matches native header texture, geometry and baseline',async({page},info)=>{
  expect(fs.readFileSync(`public/assets/native-text/sample${scale===2?'@2x':''}.png`)).toEqual(fs.readFileSync(root+`sample-${scale}.png`));
  const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
  await page.addInitScript(b=>{localStorage.setItem('gelBackend',b);localStorage.setItem('gelSharedPresentation','1');},backend);
  await page.addInitScript(()=>{
   const w=window as any;w.__headerMipLevels=[];w.__headerGlMips=0;
   const create=GPUDevice.prototype.createTexture;GPUDevice.prototype.createTexture=function(desc){if(desc.label==='scene-asset')w.__headerMipLevels.push(desc.mipLevelCount);return create.call(this,desc);};
   const generate=WebGL2RenderingContext.prototype.generateMipmap;WebGL2RenderingContext.prototype.generateMipmap=function(target){if(/sceneAssets/.test(new Error().stack??''))w.__headerGlMips++;return generate.call(this,target);};
  });
  await page.goto('/#/dev');
  await page.evaluate(async()=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {GelProvider,useGelStore}=await import('/src/components/gel/GelContext.tsx');
   const {SampleHeader}=await import('/src/components/sample/SampleHeader.tsx');
   const Fixture=()=>{
    const store=useGelStore(),[fractional,setFractional]=React.useState(false);
    React.useLayoutEffect(()=>{store.dispatch({type:'SET_SELECTED_LANE',laneIndex:0});},[store]);
    (window as any).__headerPosition=setFractional;
    return React.createElement('div',{style:{position:'absolute',left:fractional?40.25:40,top:fractional?100.375:100,width:200,height:200}},React.createElement(SampleHeader));
   };
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:999;background:white';document.body.append(host);
   createRoot(host).render(React.createElement(GelProvider,null,React.createElement(Fixture)));
  });
  await expect(page.getByTestId('shared-scene')).toHaveAttribute('width',String(320*scale));
  await page.getByTestId('sample-header-tube').evaluate(async(img:HTMLImageElement)=>{await img.decode();});
  await expect(page.getByTestId('sample-header')).toHaveAttribute('data-shared-ready','1');
  if(backend==='webgpu')expect(await page.evaluate(()=>(window as any).__headerMipLevels.sort())).toEqual([1,7]);
  else expect(await page.evaluate(()=>(window as any).__headerGlMips)).toBe(1);
  const results=[];
  for(const fractional of [false,true]){
   await page.evaluate(f=>(window as any).__headerPosition(f),fractional);
   await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
   const key=(fractional?'fractional-':'integer-')+scale,png=await page.screenshot();await fs.promises.writeFile(info.outputPath(key+'.png'),png);
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
