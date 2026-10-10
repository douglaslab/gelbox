import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';

test('compiled images retain native orientation and bounded codec pixel differences',async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 const root=path.resolve('../reference/native/image-decoding');
 const corpus=JSON.parse(await readFile(path.join(root,'native.json'),'utf8'));
 try{
  await page.addInitScript(backend=>{
   localStorage.setItem('gelBackend',backend);const w=window as any;w.__decodedImages=[];
   const decode=window.createImageBitmap.bind(window);
   window.createImageBitmap=(async(...args:any[])=>{
    const bitmap=await(decode as any)(...args);
    if(args[0] instanceof File){
     // Raw texture readback avoids 2D-canvas color conversion and alpha rounding.
     const canvas=new OffscreenCanvas(bitmap.width,bitmap.height),gl=canvas.getContext('webgl2')!;
     const texture=gl.createTexture()!,fbo=gl.createFramebuffer()!;
     gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);
     gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
     if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Readback framebuffer incomplete');
     const pixels=new Uint8Array(bitmap.width*bitmap.height*4);gl.readPixels(0,0,bitmap.width,bitmap.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
     w.__decodedImages.push({file:args[0].name,width:bitmap.width,height:bitmap.height,pixels:[...pixels]});
     gl.deleteFramebuffer(fbo);gl.deleteTexture(texture);gl.getExtension('WEBGL_lose_context')!.loseContext();
    }
    return bitmap;
   }) as typeof createImageBitmap;
  },info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const files=await Promise.all(corpus.map(async(c:any)=>({name:c.file,bytes:[...await readFile(path.join(root,'inputs',c.file))]})));
  await page.evaluate(files=>{
   const data=new DataTransfer();for(const f of files)data.items.add(new File([new Uint8Array(f.bytes)],f.name));
   document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,clientX:1100,clientY:650,dataTransfer:data}));
  },files);
  await expect(page.getByTestId(`reference-image-${files.length}`)).toBeVisible();
  const outputs=await page.evaluate(()=>(window as any).__decodedImages);
  expect(outputs).toHaveLength(corpus.length);
  const report=[];
  for(let i=0;i<corpus.length;i++){
   const native=corpus[i],web=outputs[i],bytes=await readFile(path.join(root,'decoded',native.file+'.rgba'));
   let max=0,different=0,maxVisible=0,maxComposite=0;for(let j=0;j<bytes.length;j++){const delta=Math.abs(bytes[j]-web.pixels[j]);max=Math.max(max,delta);if(delta)different++;
    const pixel=j-j%4,alpha=bytes[pixel+3],webAlpha=web.pixels[pixel+3];
    if(j%4===3||alpha>0||webAlpha>0)maxVisible=Math.max(maxVisible,delta);
    const composite=j%4===3?delta:Math.abs(Math.round(bytes[j]*alpha/255)-Math.round(web.pixels[j]*webAlpha/255));
    maxComposite=Math.max(maxComposite,composite);
   }
   await writeFile(info.outputPath(native.file+'.rgba'),Buffer.from(web.pixels));
   report.push({file:native.file,nativeSize:[native.width,native.height],webSize:[web.width,web.height],maxChannelError:max,differentChannels:different,maxVisibleChannelError:maxVisible,maxPremultipliedChannelError:maxComposite});
  }
  await writeFile(info.outputPath('decode-comparison.json'),JSON.stringify(report,null,2));
  for(const result of report){
   expect.soft(result.webSize,result.file+' dimensions').toEqual(result.nativeSize);
   // JPEG's measured one-level codec rounding difference remains an explicit
   // parity decision, not a claim of exact native JPEG pixels. WebKit rounds
   // unpremultiplied translucent RGB; these fixtures match after premultiplication.
   if(result.file==='alpha.png'){
    expect.soft(result.maxVisibleChannelError,result.file+' visible straight pixels').toBeLessThanOrEqual(1);
    expect.soft(result.maxPremultipliedChannelError,result.file+' premultiplied pixels').toBe(0);
   }else expect.soft(result.maxChannelError,result.file+' raw pixels').toBeLessThanOrEqual(result.file.endsWith('.jpg')?1:0);
  }
 }finally{await app.close();}
});

test('compiled image drops reject native-unsupported CMYK and continue the batch',async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);await expect(page.getByTestId('band-0')).toBeVisible();
  const save=async()=>{
   await page.getByRole('button',{name:'Application settings'}).click();
   const download=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
   const doc=JSON.parse(await readFile((await (await download).path())!,'utf8'));
   await expect(page.getByRole('button',{name:'Application settings'})).toHaveAttribute('aria-expanded','false');return doc;
  };
  const before=await save();
  const drop=async(files:{name:string;source:string}[])=>{
   const inputs=await Promise.all(files.map(async f=>({name:f.name,bytes:[...await readFile(path.resolve('../reference/native/image-decoding',f.source))]})));
   await page.evaluate(inputs=>{const data=new DataTransfer();for(const f of inputs)data.items.add(new File([new Uint8Array(f.bytes)],f.name));document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,clientX:1100,clientY:650,dataTransfer:data}));},inputs);
  };
  await drop([{name:'keep.png',source:'inputs/opaque.png'}]);await expect(page.getByTestId('reference-image-1')).toBeVisible();
  await drop([{name:'cmyk.jpg',source:'color-models/inputs/cmyk.jpg'},{name:'renamed.png',source:'color-models/inputs/cmyk-progressive.jpg'},{name:'gray.jpg',source:'color-models/inputs/gray.jpg'}]);
  await expect(page.getByTestId('drop-error')).toContainText('cmyk.jpg');
  await expect(page.getByTestId('drop-error')).toContainText('renamed.png');
  await expect(page.locator('[data-reference-image]')).toHaveCount(2);
  await expect(page.getByTestId('reference-image-1')).toBeVisible();
  await expect(page.getByTestId('reference-image-canvas-2')).toHaveAttribute('width','32');
  await expect(page.getByTestId('reference-image-canvas-2')).toHaveAttribute('height','24');
  expect(await save()).toEqual(before);
 }finally{await app.close();}
});
