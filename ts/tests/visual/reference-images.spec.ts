import {openSampleSettings} from './sample-helpers';
import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test.beforeEach(async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.includes('webgl2')?'webgl2':'webgpu');
 await page.setViewportSize({width:1365,height:768});await page.goto('/#/gel');
});
async function drop(page:Page,files:{name:string;color?:string;bytes?:number[];text?:string}[],x=180,y=140){
 await page.evaluate(async({files,x,y})=>{
  const data=new DataTransfer();
  for(const f of files){let blob:Blob;
   if(f.bytes)blob=new Blob([new Uint8Array(f.bytes)],{type:'image/gif'});
   else if(f.text!==undefined)blob=new Blob([f.text]);
   else {const canvas=document.createElement('canvas');canvas.width=200;canvas.height=100;const ctx=canvas.getContext('2d')!;ctx.fillStyle=f.color??'red';ctx.fillRect(0,0,200,100);blob=await new Promise<Blob>(resolve=>canvas.toBlob(b=>resolve(b!),f.name.endsWith('.jpg')?'image/jpeg':'image/png'));}
   data.items.add(new File([blob],f.name,{type:blob.type}));
  }
  document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:data,clientX:x,clientY:y}));
 },{files,x,y});
}
async function pixel(page:Page,id=1){return page.getByTestId(`reference-image-canvas-${id}`).evaluate((c:HTMLCanvasElement)=>Array.from(c.getContext('2d')!.getImageData(0,0,1,1).data));}
async function top(page:Page,x:number,y:number){return page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('[data-reference-image],[data-loupe-id]')?.getAttribute('data-testid'),{x,y});}
test('PNG/JPG drops preserve dimensions, order, focus, resize and fixed window position',async({page})=>{
 expect(await page.getByRole('button',{name:'Application settings'}).boundingBox()).toEqual({x:16,y:720,width:32,height:32});
 await drop(page,[{name:'a.png'},{name:'b.jpg',color:'blue'}]);
 const a=page.getByTestId('reference-image-1'),b=page.getByTestId('reference-image-2');
 await expect(b).toBeFocused();expect(await b.boundingBox()).toEqual({x:80,y:90,width:200,height:100});
 await page.screenshot({path:`/tmp/gel-reference-images-${test.info().project.name}.png`});
 expect(await top(page,150,120)).toBe('reference-image-2');expect((await pixel(page,2))[2]).toBeGreaterThan(250);
 // Move second to expose first. Clicking first focuses but never raises it.
 await page.mouse.move(150,120);await page.mouse.down();await page.mouse.move(250,120);await page.mouse.up();
 await a.click({position:{x:20,y:20}});await expect(a).toBeFocused();expect(await top(page,220,120)).toBe('reference-image-2');
 // Clear the second image from the first image's resize handle.
 await page.mouse.move(300,120);await page.mouse.down();await page.mouse.move(600,120);await page.mouse.up();
 await page.mouse.move(279,189);await page.mouse.down();await page.mouse.move(99,109);await page.mouse.up();
 expect(await a.boundingBox()).toEqual({x:80,y:90,width:32,height:16});
 await page.setViewportSize({width:1500,height:900});expect(await a.boundingBox()).toEqual({x:80,y:90,width:32,height:16});
});
test('GIF uses static first frame, Escape preserves image and Delete owns only image focus',async({page})=>{
 await page.getByTestId('band-0').click();
 const selected=await page.getByTestId('selection-info').textContent();
 const bytes=Array.from(await readFile('fixtures/images/two-frames.gif'));
 await drop(page,[{name:'animation.gif',bytes}],160,130);
 const image=page.getByTestId('reference-image-1');await expect(image).toBeFocused();expect(await pixel(page)).toEqual([255,0,0,255]);
 await page.waitForTimeout(240);expect(await pixel(page)).toEqual([255,0,0,255]);
 await page.keyboard.press('Escape');await expect(image).toBeVisible();await expect(page.getByTestId('sample-view')).toBeVisible();
 await page.keyboard.press('Delete');await expect(image).toHaveCount(0);await expect(page.getByTestId('selection-info')).toHaveText(selected!);
});
test('multi-file errors preserve successes, document replacement retains images and saves exclude them',async({page})=>{
 await drop(page,[{name:'a.png'},{name:'bad.png',text:'not an image'},{name:'b.jpg'}]);
 await expect(page.getByTestId('reference-image-2')).toBeVisible();await expect(page.getByTestId('drop-error')).toContainText('bad.png');
 const native=await readFile('../reference/native/files/ladder-after-selection.gel.json','utf8');
 await page.getByTestId('file-input').setInputFiles({name:'gel.json',mimeType:'application/json',buffer:Buffer.from(native)});
 await expect(page.getByTestId('file-error')).toHaveCount(0);
 await expect(page.getByTestId('reference-image-1')).toBeVisible();await expect(page.getByTestId('reference-image-2')).toBeVisible();
 await page.getByRole('button',{name:'Application settings'}).click();const download=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
 const data=JSON.parse(await readFile((await(await download).path())!,'utf8'));expect(data).toEqual(JSON.parse(native));
});
test('fully off-window release deletes; capture loss ends drag without later movement',async({page})=>{
 await drop(page,[{name:'a.png'}]);const image=page.getByTestId('reference-image-1');await expect(image).toBeVisible();
 await page.mouse.move(100,110);await page.mouse.down();await page.mouse.move(101,111);
 await image.evaluate(el=>el.releasePointerCapture(1));const before=await image.boundingBox();
 await page.mouse.move(150,150);await page.mouse.up();expect(await image.boundingBox()).toEqual(before);
 // Pointer capture permits dragging past the window edge.
 await page.mouse.move(110,120);await page.mouse.down();await page.mouse.move(-250,120);await page.mouse.up();await expect(image).toHaveCount(0);
});
test('images and loupes share insertion order; only clicking a loupe raises it',async({page})=>{
 const gel=(await page.getByTestId('gel-overlay').boundingBox())!;
 await page.keyboard.down('Meta');await page.mouse.click(gel.x+100,gel.y+250);await page.keyboard.up('Meta');
 const loupe=page.getByTestId('loupe-frame-1');await expect(loupe).toBeVisible();const box=(await loupe.boundingBox())!;
 await drop(page,[{name:'above.png'}],box.x+150,box.y+50);await expect(page.getByTestId('reference-image-1')).toBeVisible();
 expect(await top(page,box.x+100,box.y+60)).toBe('reference-image-1');
 await page.mouse.click(box.x+20,box.y+80);expect(await top(page,box.x+100,box.y+60)).toBe('loupe-1');
});

test('deletion and route unmount each release the owned bitmap exactly once',async({page})=>{
 await page.evaluate(()=>{
  const original=window.createImageBitmap.bind(window);(window as any).imageCloses=0;
  window.createImageBitmap=(async(...args:any[])=>{
   const image=await (original as any)(...args),close=image.close.bind(image);
   image.close=()=>{(window as any).imageCloses++;close();};return image;
  }) as typeof createImageBitmap;
 });
 await drop(page,[{name:'a.png'},{name:'b.png'}]);await expect(page.getByTestId('reference-image-2')).toBeFocused();
 await page.keyboard.press('Backspace');await expect(page.getByTestId('reference-image-2')).toHaveCount(0);
 expect(await page.evaluate(()=>(window as any).imageCloses)).toBe(1);
 await page.evaluate(()=>{location.hash='/dev';});await expect(page.getByTestId('gel-page')).toHaveCount(0);
 expect(await page.evaluate(()=>(window as any).imageCloses)).toBe(2);
});
test('later sample settings stay below images; later species inspectors append above them',async({page})=>{
 await drop(page,[{name:'sample-cover.png'}],880,300);await expect(page.getByTestId('reference-image-1')).toBeVisible();
 await page.getByTestId('microtube-0').click();expect(await top(page,850,300)).toBe('reference-image-1');
 const sample=(await page.getByTestId('sample-view').boundingBox())!;
 // Inspector region is separate from the sample; hover/selection opens it above earlier images.
 await drop(page,[{name:'inspector-cover.png'}],1180,300);await expect(page.getByTestId('reference-image-2')).toBeVisible();
 await openSampleSettings(page);await expect(page.getByTestId('sample-settings-view')).toBeVisible();
 expect(await top(page,1150,300)).toBe('reference-image-2');
 await page.getByTestId('band-0').click();
 expect(await top(page,1150,300)).not.toBe('reference-image-2');
 expect(sample.width).toBeGreaterThan(0);
});

test('a second drop waits for the first decode, retaining arrival order',async({page})=>{
 await page.evaluate(()=>{
  const original=window.createImageBitmap.bind(window);(window as any).decodeNames=[];
  window.createImageBitmap=(async(file:File)=>{
   (window as any).decodeNames.push(file.name);
   if(file.name==='slow.png')await new Promise<void>(resolve=>{(window as any).finishDecode=resolve;});
   return original(file);
  }) as typeof createImageBitmap;
 });
 await drop(page,[{name:'slow.png'}]);await drop(page,[{name:'fast.png',color:'blue'}]);
 expect(await page.evaluate(()=>(window as any).decodeNames)).toEqual(['slow.png']);
 await page.evaluate(()=>(window as any).finishDecode());await expect(page.getByTestId('reference-image-2')).toBeFocused();
 expect(await pixel(page,1)).toEqual([255,0,0,255]);expect(await pixel(page,2)).toEqual([0,0,255,255]);
});
test('a mixed file batch picks sample placement using the newly loaded gel layout',async({page})=>{
 const gel=(await page.getByTestId('gel-overlay').boundingBox())!;
 const native=JSON.parse(await readFile('../reference/native/files/ladder-after-selection.gel.json','utf8'));
 native.Gel.Samples=Array(20).fill(null);
 const xml=await readFile('../reference/native/files/1kbladder.xml','utf8');
 await drop(page,[{name:'twenty.json',text:JSON.stringify(native)},{name:'sample.xml',text:xml}],gel.x+107,gel.y-10);
 await expect(page.getByTestId('microtube-19')).toBeVisible();
 await expect(page.getByTestId('microtube-5')).toHaveAttribute('aria-label','Lane 6 sample');
 await expect(page.getByTestId('microtube-0')).toHaveAttribute('data-empty','true');
});

test('Open waits for an earlier pending drop before replacing its document',async({page})=>{
 await page.evaluate(()=>{
  const original=window.createImageBitmap.bind(window);
  window.createImageBitmap=(async(file:File)=>{
   await new Promise<void>(resolve=>{(window as any).finishDecode=resolve;});
   return original(file);
  }) as typeof createImageBitmap;
 });
 const native=JSON.parse(await readFile('../reference/native/files/ladder-after-selection.gel.json','utf8'));
 native.Gel.Samples=Array(20).fill(null);
 await drop(page,[{name:'slow.png'},{name:'older.json',text:JSON.stringify(native)}]);
 await expect.poll(()=>page.evaluate(()=>typeof (window as any).finishDecode)).toBe('function');
 native.Gel.Samples=Array(7).fill(null);
 await page.getByTestId('file-input').setInputFiles({name:'newer.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(native))});
 await page.evaluate(()=>(window as any).finishDecode());
 await expect(page.getByTestId('reference-image-1')).toBeVisible();
 await expect(page.getByTestId(/^microtube-\d+$/)).toHaveCount(7);
 await expect(page.getByTestId('microtube-0')).toHaveAttribute('data-empty','true');
});

test('application settings preserves image keyboard ownership until a sample takes focus',async({page})=>{
 await drop(page,[{name:'a.png'}]);
 const image=page.getByTestId('reference-image-1');await expect(image).toBeFocused();
 await page.getByRole('button',{name:'Application settings'}).click();
 await expect(image).toBeFocused();await expect(image).toHaveCSS('outline-color','rgb(255, 255, 128)');
 await page.keyboard.press('Backspace');await expect(image).toHaveCount(0);
 await drop(page,[{name:'b.png'}],1200,650);const second=page.getByTestId('reference-image-2');await expect(second).toBeFocused();
 await page.getByTestId('microtube-0').click();
 await page.getByTestId('sample-view').click({position:{x:30,y:100}});
 await expect(second).not.toBeFocused();
 await page.keyboard.press('Backspace');await expect(second).toBeVisible();
});
