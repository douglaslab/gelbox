import {test,expect,type Page} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {serveBuiltApp} from './built-app';
import {openSampleSettings} from '../visual/sample-helpers';

async function save(page:Page){
 const menu=page.getByRole('button',{name:'Application settings'});
 if(await menu.getAttribute('aria-expanded')!=='true')await menu.click();
 const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
 const doc=JSON.parse(await readFile((await (await pending).path())!,'utf8'));
 await page.keyboard.press('Escape');return doc;
}

test('compiled native mixed gel supports species and buffer edits before native reopen',async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  await page.getByTestId('settings-button').click();
  await page.getByRole('button',{name:'Application settings'}).click();
  const file=path.resolve('../reference/native/replay/file-workflow/native-input.json');
  const input=JSON.parse(await readFile(file,'utf8'));
  await page.getByTestId('file-input').setInputFiles(file);
  await expect(page.getByRole('button',{name:'Application settings'})).toHaveAttribute('aria-expanded','false');
  await expect(page.getByTestId('gel-settings-view')).toBeVisible();
  expect(await save(page)).toEqual(input);
  await page.getByTestId('gel-buffer-view-preset-TBE').click();
  await page.getByTestId('settings-button').click();
  await page.getByTestId('microtube-1').click();
  await openSampleSettings(page);
  await page.getByTestId('sample-buffer-view-preset-TAE').click();
  // Use an actual pointer click: SVG hit rectangles may overlap, and the gel
  // picker (rather than DOM stacking) determines the selected species.
  const band=(await page.locator('[data-lane-index="1"][data-fragment-index="0"]').first().boundingBox())!;
  await page.mouse.click(band.x+band.width/2,band.y+band.height/2);
  const track=page.getByTestId('frag-mass-track'),box=(await track.boundingBox())!;
  await page.mouse.click(box.x+box.width*.67,box.y+box.height/2);
  await expect(page.getByTestId('fragment-representative')).toHaveAttribute('data-shared-ready','1');
  const output=await save(page),mass=output.Gel.Samples[1].Fragments[0].Mass;
  expect(mass).toBeGreaterThan(0);expect(mass).not.toBe(input.Gel.Samples[1].Fragments[0].Mass);
  const expected=structuredClone(input);
  expected.Gel.Buffer={Tris:44.5,Borate:44.5,Acetate:0,EDTA:1};
  expected.Gel.Samples[1].Buffer={Tris:40,Borate:0,Acetate:20,EDTA:1};
  expected.Gel.Samples[1].Fragments[0].Mass=mass;
  expect(output).toEqual(expected);expect(errors).toEqual([]);
  await writeFile(info.outputPath('web-edited.json'),JSON.stringify(output,null,2)+'\n');
  await page.mouse.move(0,0);await page.screenshot({path:info.outputPath('web-edited.png')});
  // Reopening the exported file must preserve data and close prior sample/species views.
  await page.getByRole('button',{name:'Application settings'}).click();
  await page.getByTestId('file-input').setInputFiles({name:'edited.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(output))});
  await expect(page.getByRole('button',{name:'Application settings'})).toHaveAttribute('aria-expanded','false');
  await expect(page.getByTestId('sample-view')).toHaveCount(0);
  expect(await save(page)).toEqual(output);
  const nativeReread=path.resolve('../reference/native/replay/file-workflow/native-reread-webgpu.json');
  await page.getByRole('button',{name:'Application settings'}).click();
  await page.getByTestId('file-input').setInputFiles(nativeReread);
  await expect(page.getByRole('button',{name:'Application settings'})).toHaveAttribute('aria-expanded','false');
  expect(await save(page)).toEqual(JSON.parse(await readFile(nativeReread,'utf8')));
 }finally{await app.close();}
});

test('compiled queued mixed drops use the new layout and preserve occupied or full lanes',async({page})=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),test.info().project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const input=JSON.parse(await readFile('../reference/native/replay/file-workflow/native-input.json','utf8'));
  const empty={...input,Gel:{...input.Gel,Samples:Array(20).fill(null)}};
  const gel=(await page.getByTestId('gel-overlay').boundingBox())!;
  // Delay only the external File read; the compiled queue, handlers and reducer
  // remain unmodified. A second drop arrives while the mixed batch is pending.
  await page.evaluate(()=>{
   const original=File.prototype.text;
   File.prototype.text=async function(){
    if(this.name==='pending-gel.json')await new Promise<void>(resolve=>{(window as any).releaseFileRead=resolve;});
    return original.call(this);
   };
  });
  const drop=async(files:{name:string;text:string}[])=>{
   const transfer=await page.evaluateHandle(files=>{
    const data=new DataTransfer();for(const f of files)data.items.add(new File([f.text],f.name));return data;
   },files);
   try{await page.getByTestId('gel-page').dispatchEvent('drop',{dataTransfer:transfer,clientX:gel.x+107,clientY:gel.y+30});}
   finally{await transfer.dispose();}
  };
  const sample=(name:string)=>`<Sample name="${name}"><Fragment><Bases value="500"/><Mass value="10"/></Fragment></Sample>`;
  await drop([{name:'pending-gel.json',text:JSON.stringify(empty)},{name:'first.xml',text:sample('first')}]);
  await expect.poll(()=>page.evaluate(()=>typeof (window as any).releaseFileRead)).toBe('function');
  await drop([{name:'second.xml',text:sample('second')}]);
  await expect(page.getByTestId(/^microtube-\d+$/)).toHaveCount(7);
  await page.evaluate(()=>(window as any).releaseFileRead());
  await expect(page.getByTestId(/^microtube-\d+$/)).toHaveCount(20);
  await expect(page.getByTestId('microtube-5')).not.toHaveAttribute('data-empty','true');
  await expect(page.getByTestId('microtube-0')).not.toHaveAttribute('data-empty','true');
  const result=await save(page);
  expect(result.Gel.Samples[5].name).toBe('first');expect(result.Gel.Samples[0].name).toBe('second');
  expect(result.Gel.Samples.filter(Boolean)).toHaveLength(2);
  expect(result.Gel.Buffer).toEqual(input.Gel.Buffer);
  const full={...input,Gel:{...input.Gel,Samples:Array.from({length:7},(_,i)=>({...input.Gel.Samples[1],name:`occupied-${i}`}))}};
  await page.getByTestId('file-input').setInputFiles({name:'full.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(full))});
  await expect(page.getByTestId(/^microtube-\d+$/)).toHaveCount(7);
  await drop([{name:'overflow.xml',text:sample('overflow')}]);
  await expect(page.getByTestId('drop-error')).toContainText('No empty lane available');
  expect(await save(page)).toEqual(full);
 }finally{await app.close();}
});

for(const offset of [0,1])test(`sample drop ${offset===0?'on':'outside'} right gel edge follows native lane picking`,async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const before=await save(page);
  const rect=(await page.getByTestId('gel-overlay').boundingBox())!;
  const transfer=await page.evaluateHandle(()=>{
   const data=new DataTransfer();
   data.items.add(new File(['<Sample name="edge-drop"><Fragment><Bases value="500"/><Mass value="10"/></Fragment></Sample>'],'edge.xml'));
   return data;
  });
  try{await page.getByTestId('gel-page').dispatchEvent('drop',{dataTransfer:transfer,clientX:rect.x+rect.width+offset,clientY:rect.y+30});}
  finally{await transfer.dispose();}
  // Native Rect::contains includes the right edge; pickLane clamps to the last
  // lane. Outside the rectangle, loading uses the first empty lane instead.
  const lane=offset===0?6:1;
  await expect(page.getByTestId(`microtube-${lane}`)).not.toHaveAttribute('data-empty','true');
  const after=await save(page);
  expect(after.Gel.Samples[lane].name).toBe('edge-drop');
  expect(after.Gel.Samples.filter(Boolean)).toHaveLength(2);
  expect(after.Gel.Samples[0]).toEqual(before.Gel.Samples[0]);
 }finally{await app.close();}
});

test('compiled native file shortcuts use the current imported document and selected sample',async({page},info)=>{
 const app=await serveBuiltApp('/gelbox/');
 try{
  await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.goto(`${app.url}#/gel`);
  const inputFile=path.resolve('../reference/native/replay/file-workflow/native-input.json');
  const input=JSON.parse(await readFile(inputFile,'utf8'));
  const menu=page.getByRole('button',{name:'Application settings'});await menu.click();
  const choosing=page.waitForEvent('filechooser');await page.keyboard.press('Meta+o');
  await (await choosing).setFiles(inputFile);await expect(menu).toHaveAttribute('aria-expanded','false');
  const download=async(shortcut:string)=>{
   const pending=page.waitForEvent('download');await page.keyboard.press(shortcut);
   return JSON.parse(await readFile((await (await pending).path())!,'utf8'));
  };
  const nativeGel=JSON.parse(await readFile('../reference/native/replay/file-shortcuts/native-gel.json','utf8'));
  expect(nativeGel).toEqual(input);expect(await download('Meta+s')).toEqual(nativeGel);
  await page.getByTestId('microtube-1').click();
  const sample=await download('Alt+Meta+s');
  expect(sample.Gelbox).toEqual({version:'1.0',type:'sample'});
  const nativeSample=JSON.parse(await readFile('../reference/native/replay/file-shortcuts/native-sample.json','utf8'));
  expect(nativeSample.Sample).toEqual(input.Gel.Samples[1]);expect(sample).toEqual(nativeSample);
  // Shipping macOS Safari reports Option-S as ß, while retaining KeyS.
  // Playwright's keyboard.press('Alt+Meta+s') does not model this layout mapping.
  const mappedDownload=page.waitForEvent('download');
  const prevented=await page.evaluate(()=>{
   const event=new KeyboardEvent('keydown',{key:'ß',code:'KeyS',metaKey:true,altKey:true,bubbles:true,cancelable:true});
   window.dispatchEvent(event);return event.defaultPrevented;
  });
  expect(prevented).toBe(true);
  expect(JSON.parse(await readFile((await (await mappedDownload).path())!,'utf8'))).toEqual(nativeSample);
  await expect(menu).toHaveAttribute('aria-expanded','false');
 }finally{await app.close();}
});
