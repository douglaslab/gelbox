import {test,expect} from '@playwright/test';
import fs from 'node:fs';

test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
// Run using the temporary-copy command in README.md. This is a diagnostic,
// not a passing acceptance test: every measured error is retained in the report.
test('measure complete native well outlines',async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),backend);
 await page.goto('/#/gel');
 await expect(page.getByTestId('gel-well-6')).toBeVisible();
 const paths=['startup.png','user-startup.png'];
 const references=paths.map(path=>fs.readFileSync('../reference/native/modern/lossless-probe/'+path).toString('base64'));
 const variants=[];
 for(const rendering of ['crispEdges','geometricPrecision']){
  await page.locator('[data-testid^="gel-well-"]').evaluateAll((elements,value)=>elements.forEach(e=>e.setAttribute('shape-rendering',value)),rendering);
  const capture=await page.screenshot({path:info.outputPath(rendering+'.png')});
  const comparison=await page.evaluate(async({references,capture})=>{
   const decode=async(png:string,offset:number)=>{
    const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=780;canvas.height=50;
    const ctx=canvas.getContext('2d')!;ctx.drawImage(image,416,260+offset,780,50,0,0,780,50);
    return ctx.getImageData(0,0,780,50).data;
   };
   const [native,user,web]=await Promise.all([decode(references[0],0),decode(references[1],64),decode(capture,0)]);
   const diff=(a:Uint8ClampedArray,b:Uint8ClampedArray)=>{
    let differentPixels=0,maximumChannelError=0;const rows:Record<string,number>={};
    for(let i=0;i<a.length;i+=4){let different=false;
     for(let c=0;c<3;c++){const error=Math.abs(a[i+c]-b[i+c]);maximumChannelError=Math.max(maximumChannelError,error);different ||= error!==0;}
     if(different){differentPixels++;const y=260+Math.floor(i/4/780);rows[y]=(rows[y]??0)+1;}
    }
    return {differentPixels,maximumChannelError,rows};
   };
   return {nativeVsUser:diff(native,user),nativeVsWeb:diff(native,web)};
  },{references,capture:capture.toString('base64')});
  expect(comparison.nativeVsUser.differentPixels).toBe(0);
  variants.push({rendering,...comparison});
 }
 const report={backend,viewport:{width:1365,height:768,dpr:2},crop:[416,260,780,50],variants};
 fs.writeFileSync(info.outputPath('comparison.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
});
