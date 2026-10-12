import {expect,type Page,type TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
export async function compareNative(page:Page,info:TestInfo,native:Buffer,name:string){
 const actual=await page.screenshot();await writeFile(info.outputPath(`${name}.png`),actual);
 const comparison=await page.evaluate(async({actual,native})=>{
  const decode=async(bytes:number[])=>{const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));const canvas=new OffscreenCanvas(image.width,image.height),ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);image.close();return {width:canvas.width,height:canvas.height,data:ctx.getImageData(0,0,canvas.width,canvas.height).data};};
  const a=await decode(actual),b=await decode(native);if(a.width!==b.width||a.height!==b.height)throw Error('Native framebuffer dimensions differ');
  let differentChannels=0,maxChannelDifference=0;
  for(let i=0;i<a.data.length;i++)if(i%4!==3){const d=Math.abs(a.data[i]-b.data[i]);if(d){differentChannels++;maxChannelDifference=Math.max(maxChannelDifference,d);}}
  return {width:a.width,height:a.height,differentChannels,maxChannelDifference};
 },{actual:[...actual],native:[...native]});
 await writeFile(info.outputPath(`${name}-comparison.json`),JSON.stringify(comparison,null,2));
 expect.soft(comparison.differentChannels,name).toBe(0);
}
