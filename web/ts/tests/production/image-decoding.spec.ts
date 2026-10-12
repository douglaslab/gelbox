import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {PNG} from 'pngjs';
import {serveBuiltApp} from './built-app';

test('original-release visible image open move resize and gel replacement sequence',async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 const root=path.resolve('../reference/native/replay');
 const images=path.resolve('../reference/native/image-decoding/inputs');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const menu=page.getByRole('button',{name:'Application settings'});
  const open=async(file:string)=>{
   await menu.click();await page.getByTestId('file-input').setInputFiles(file);
   await expect(menu).toHaveAttribute('aria-expanded','false');
  };
  const save=async(name:string)=>{
   await menu.click();const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
   const bytes=await readFile((await (await pending).path())!);
   expect(JSON.parse(bytes.toString())).toEqual(JSON.parse(await readFile(path.join(root,'visible-images',`native-${name}.json`),'utf8')));
   await writeFile(info.outputPath(`web-images-${name}.json`),bytes);
  };
  const drag=async(x:number,y:number,x2:number,y2:number)=>{
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x2,y2);await page.mouse.up();
  };
  await open(path.join(root,'isolated-tier/native-upper-grab.json'));
  await page.mouse.click(236,202);await expect(page.getByTestId('fragment-view')).toBeVisible();
  const cases=[['orientation-6.jpg',1,740,112],['alpha.png',2,740,172],['animated.gif',3,1000,172]] as const;
  for(const [file,id,x,y] of cases){
   await open(path.join(images,file));const image=page.getByTestId(`reference-image-${id}`);
   await expect(image).toBeVisible();await expect(image).toBeFocused();
   expect(await image.boundingBox()).toEqual({x:0,y:0,width:32,height:24});
   await drag(10,10,x+10,y+10);
   await drag(x+25,y+18,x+185,y+138);
   expect(await image.boundingBox()).toEqual({x,y,width:192,height:144});
  }
  await page.mouse.move(0,740);await page.screenshot({path:info.outputPath('images-over-sample.png')});
  const gifClip={x:1000,y:172,width:176,height:128};
  const gifFrame=await page.screenshot({clip:gifClip});
  const rendered=PNG.sync.read(gifFrame);
  const nativeFirstFrame=await readFile(path.resolve('../reference/native/image-decoding/decoded/animated.gif.rgba'));
  const scale=rendered.width/gifClip.width;
  // Sample the four uniform quadrant interiors, away from focus/resize paint.
  // Stability alone would also accept a blank image or a frozen second frame.
  for(const [x,y] of [[8,6],[24,6],[8,18],[24,18]]){
   const expectedOffset=(y*32+x)*4;
   const renderedOffset=(Math.floor(y*6*scale)*rendered.width+Math.floor(x*6*scale))*4;
   expect([...rendered.data.subarray(renderedOffset,renderedOffset+4)])
    .toEqual([...nativeFirstFrame.subarray(expectedOffset,expectedOffset+4)]);
  }
  // The source GIF has a different second frame; native keeps its first frame.
  await page.waitForTimeout(500);
  expect(await page.screenshot({clip:gifClip})).toEqual(gifFrame);
  await save('with-images');
  await open(path.join(root,'isolated-tier/input.json'));
  await expect(page.getByTestId('fragment-view')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Sample',exact:true})).toHaveCount(0);
  for(const [,id,x,y] of cases)expect(await page.getByTestId(`reference-image-${id}`).boundingBox()).toEqual({x,y,width:192,height:144});
  await expect(page.getByTestId('reference-image-3')).toBeFocused();
  await page.keyboard.press('Backspace');await expect(page.getByTestId('reference-image-3')).toHaveCount(0);
  await expect(page.locator('[data-reference-image]')).toHaveCount(2);
  await save('after-replace');await page.mouse.move(0,740);
  await page.screenshot({path:info.outputPath('images-after-replace.png')});
 }finally{await app.close();}
});

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
   if(result.file==='alpha.png'||result.file==='display-p3-alpha.png'){
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

test('compiled PNG uploads preserve native straight pixels across formats',async({page},info)=>{
 const root=path.resolve('../reference/native/image-decoding/png-formats');
 const corpus=JSON.parse(await readFile(path.join(root,'native.json'),'utf8'));
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(backend=>{
   localStorage.setItem('gelBackend',backend);const w=window as any;w.__pngUploads=[];
   const gl=WebGL2RenderingContext.prototype,upload=gl.texImage2D;
   gl.texImage2D=function(...args:any[]){
    if(args.length===9&&args[3]===7&&args[4]===3&&args[8] instanceof Uint8Array)w.__pngUploads.push([...args[8]]);
    return (upload as any).apply(this,args);
   } as typeof upload;
   if(typeof GPUQueue!=='undefined'){
    const write=GPUQueue.prototype.writeTexture;
    GPUQueue.prototype.writeTexture=function(...args:Parameters<GPUQueue['writeTexture']>){
     const size=args[3] as GPUExtent3DDict;
     if(size.width===7&&size.height===3&&args[1] instanceof Uint8Array)w.__pngUploads.push([...args[1]]);
     return write.apply(this,args);
    };
   }
  },info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);await expect(page.getByTestId('band-0')).toBeVisible();
  const report=[];
  for(const [index,item] of corpus.entries()){
   expect(item.exit,item.file+' native acceptance').toBe(0);
   const bytes=[...await readFile(path.join(root,'inputs',item.file))];
   await page.evaluate(({bytes,name})=>{
    (window as any).__pngUploads=[];
    const data=new DataTransfer();data.items.add(new File([new Uint8Array(bytes)],name));
    document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,clientX:1100,clientY:650,dataTransfer:data}));
   },{bytes,name:item.file});
   await expect(page.getByTestId(`reference-image-canvas-${index+1}`)).toHaveAttribute('data-shared-ready','1');
   const uploads:number[][]=await page.evaluate(()=>(window as any).__pngUploads);
   expect(uploads.length,item.file+' actual GPU upload').toBeGreaterThan(0);
   const native=await readFile(path.join(root,'decoded',item.file+'.rgba'));
   for(const actual of uploads)expect(Buffer.from(actual),item.file).toEqual(native);
   report.push({file:item.file,uploads:uploads.length,exact:true});
   await page.getByTestId(`reference-image-${index+1}`).focus();await page.keyboard.press('Delete');
   await expect(page.getByTestId(`reference-image-${index+1}`)).toHaveCount(0);
  }
  await writeFile(info.outputPath('png-upload-comparison.json'),JSON.stringify(report,null,2));
 }finally{await app.close();}
});
