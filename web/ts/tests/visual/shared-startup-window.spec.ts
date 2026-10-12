import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const reference='../reference/native/modern/lossless-probe/startup.png';
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
test('complete shared startup window matches the native framebuffer',async({page},info)=>{
 const native=fs.readFileSync(reference);expect(createHash('sha256').update(native).digest('hex')).toBe('80693c47b37b9073beb319f66853b65d194aea8a024c32baea95b4d48b3e84d9');
 await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');await page.mouse.move(0,0);
 for(const target of [page.getByTestId('gel-canvas'),page.getByTestId('microtube-row'),page.getByTestId('settings-button'),page.getByRole('link',{name:'Help',exact:true}),page.getByRole('button',{name:'Application settings'})])await expect(target).toHaveAttribute('data-shared-ready','1');
 await expect(page.getByTestId('timeline-slider')).toHaveAttribute('data-shared-ready','1');
 await expect(page.getByRole('alert')).toHaveCount(0);
 const actual=await page.screenshot();await fs.promises.writeFile(info.outputPath('startup.png'),actual);
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
