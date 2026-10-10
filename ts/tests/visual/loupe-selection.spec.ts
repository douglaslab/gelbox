import {test,expect} from '@playwright/test';
for(const shared of [false,true])test.describe(`shared:${shared}`,()=>{
test.beforeEach(async({page})=>{if(shared)await page.addInitScript(()=>localStorage.setItem('gelSharedPresentation','1'));});
for(const button of ['left','right','middle'] as const)test(`${button} loupe hover and selection resolve to the source species in the open sample`,async({page},info)=>{
 await page.addInitScript(b=>{localStorage.setItem('gelBackend',b);(window as any).__molsimFreezeAfterTicks=60;},info.project.name.includes('webgl2')?'webgl2':'webgpu');
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');
 await page.getByTestId('microtube-0').click();
 const band=page.getByTestId('band-0'),box=(await band.boundingBox())!;
 await page.keyboard.down('Meta');await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await page.keyboard.up('Meta');
 const canvas=page.getByTestId('loupe-canvas-1');await expect(canvas).toHaveAttribute('data-frozen','1');
 const png=await canvas.screenshot();
 const point=await page.evaluate(async bytes=>{
  const im=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
  const c=new OffscreenCanvas(im.width,im.height),ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);im.close();
  const d=ctx.getImageData(0,0,c.width,c.height).data;
  let sx=0,sy=0,n=0;
  for(let y=10;y<c.height-10;y++)for(let x=10;x<c.width-10;x++)if(d[(y*c.width+x)*4]<100){sx+=x+.5;sy+=y+.5;n++;}
  if(!n)throw new Error('No dark source molecule in loupe');
  return{x:sx/n/c.width,y:sy/n/c.height};
 },[...png]);
 const bounds=(await canvas.boundingBox())!;
 const x=bounds.x+point.x*bounds.width,y=bounds.y+point.y*bounds.height;
 await page.mouse.move(0,0);await expect(page.getByTestId('fragment-view')).toHaveCount(0);
 await page.mouse.move(x,y);
 await expect(page.getByTestId('fragment-view')).toBeVisible();
 await expect(band).not.toHaveAttribute('stroke','transparent');
 await page.mouse.click(x,y,{button});await page.mouse.move(0,0);
 await expect(page.getByTestId('selection-info')).toContainText('lane 0 fragment 0');
 await expect(page.getByTestId('fragment-view')).toBeVisible();
 await expect(band).not.toHaveAttribute('stroke','transparent');
 // Native empty loupe selection retains the derived sample with an invalid
 // fragment; GelView follows that off-gel sample and closes the ordinary panel.
 await page.mouse.click(bounds.x+10,bounds.y+bounds.height-10,{button});await page.mouse.move(0,0);
 await expect(page.getByTestId('fragment-view')).toHaveCount(0);
 await expect(page.getByTestId('selection-info')).not.toContainText('fragment 0');
 await expect(page.getByTestId('molecular-sim-canvas')).toHaveCount(0);
 await page.mouse.click(x,y,{button});await page.mouse.move(0,0);
 await expect(page.getByTestId('fragment-view')).toBeVisible();
 const gel=(await page.getByTestId('gel-overlay').boundingBox())!;
 await page.mouse.click(gel.x+gel.width*.95,gel.y+gel.height*.95);
 await expect(page.getByTestId('fragment-view')).toHaveCount(0);
 await expect(page.getByTestId('selection-info')).not.toContainText('fragment 0');
});

test('selecting a loupe molecule opens its source panel on the next native frame',async({page},info)=>{
 await page.addInitScript(b=>{localStorage.setItem('gelBackend',b);(window as any).__molsimFreezeAfterTicks=60;},info.project.name.includes('webgl2')?'webgl2':'webgpu');
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');
 const band=page.getByTestId('band-0'),box=(await band.boundingBox())!;
 await page.keyboard.down('Meta');await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await page.keyboard.up('Meta');
 const canvas=page.getByTestId('loupe-canvas-1');await expect(canvas).toHaveAttribute('data-frozen','1');
 const png=await canvas.screenshot();
 const point=await page.evaluate(async bytes=>{
  const im=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
  const c=new OffscreenCanvas(im.width,im.height),ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);im.close();
  const d=ctx.getImageData(0,0,c.width,c.height).data;
  let sx=0,sy=0,n=0;
  for(let y=10;y<c.height-10;y++)for(let x=10;x<c.width-10;x++)if(d[(y*c.width+x)*4]<100){sx+=x+.5;sy+=y+.5;n++;}
  if(!n)throw new Error('No dark source molecule in loupe');
  return{x:sx/n/c.width,y:sy/n/c.height};
 },[...png]);
 const bounds=(await canvas.boundingBox())!;
 await expect(page.getByTestId('sample-view')).toHaveCount(0);
 await page.mouse.click(bounds.x+point.x*bounds.width,bounds.y+point.y*bounds.height);
 await page.mouse.move(0,0);
 await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','0');
 await expect(page.getByTestId('selection-info')).toContainText('lane 0 fragment 0');
 await expect(page.getByTestId('fragment-view')).toBeVisible();
 await expect(page.getByTestId('loupe-frame-1')).toBeFocused();
});

test('leaving a loupe clears rollover acquired by a frame without a pointer event',async({page},info)=>{
 await page.addInitScript(b=>{localStorage.setItem('gelBackend',b);(window as any).__molsimFreezeAfterTicks=60;},info.project.name.includes('webgl2')?'webgl2':'webgpu');
 // Observe the real application store without adding production test hooks.
 await page.route('**/src/components/sample/SampleSimCanvas.tsx*',async route=>{
  const response=await route.fetch(),body=await response.text();
  expect(body).toContain('const store = useGelStore();');
  await route.fulfill({response,body:body.replace('const store = useGelStore();','const store = useGelStore(); globalThis.__observedGelStore = store;')});
 });
 await page.goto('/#/gel');
 const band=(await page.getByTestId('band-0').boundingBox())!;
 await page.keyboard.down('Meta');await page.mouse.click(band.x+band.width/2,band.y+band.height/2);await page.keyboard.up('Meta');
 const canvas=page.getByTestId('loupe-canvas-1');await expect(canvas).toHaveAttribute('data-frozen','1');
 // Park over empty space. A particle then crosses the stationary pointer;
 // only the native frame picker, not a mouse callback, observes this hit.
 await canvas.hover({position:{x:80,y:80}});
 await page.evaluate(()=>{
  const store=(window as any).__observedGelStore,view=store.getMolecularView('loupe-1');
  store.dispatch({type:'SET_SELECTION',ref:null});
  const part=view.sim.parts.find((p:any)=>p.alive);
  if(!part)throw new Error('Missing loupe particle');
  part.loc={x:80,y:80};part.fade=1;
  store.setViewPointer('loupe-1',{x:80,y:80},true);
  store.tick(60);
  if(!store.getSnapshot().gel.rollover)throw new Error('Frame failed to acquire rollover');
 });
 await page.mouse.move(0,0);
 await expect.poll(()=>page.evaluate(()=>(window as any).__observedGelStore.getSnapshot().gel.rollover)).toBeNull();
 await expect(page.getByTestId('fragment-view')).toHaveCount(0);
});

});
