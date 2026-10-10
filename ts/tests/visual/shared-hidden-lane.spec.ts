import {test,expect} from '@playwright/test';
import fs from 'node:fs';

for(const shared of [false,true])test(`hidden sample keeps selection and engine with loupe and image present (shared:${shared})`,async({page},info)=>{
 await page.addInitScript(({backend,shared})=>{
  localStorage.setItem('gelBackend',backend);if(shared)localStorage.setItem('gelSharedPresentation','1');
  (window as any).__molsimFreezeAfterTicks=60;
 },{backend:info.project.name.endsWith('webgl2')?'webgl2':'webgpu',shared});
 await page.route('**/src/components/sample/SampleSimCanvas.tsx*',async route=>{
  const response=await route.fetch(),body=await response.text();
  expect(body).toContain('const store = useGelStore();');
  await route.fulfill({response,body:body.replace('const store = useGelStore();','const store = useGelStore(); globalThis.__combinedStore=store;')});
 });
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');
 await page.getByTestId('microtube-0').click();
 await expect.poll(()=>page.evaluate(()=>!!(window as any).__combinedStore)).toBe(true);
 // Native keeps sample identities beyond numLanes. Populate lane 11, then
 // exercise real rendered panels and keyboard input as that lane is hidden.
 await page.evaluate(()=>{
  const store=(window as any).__combinedStore;
  store.dispatch({type:'SET_NUM_LANES',value:12});
  store.dispatch({type:'IMPORT_SAMPLE',sample:store.getSnapshot().gel.samples[0],preferredLane:11});
  store.dispatch({type:'SET_SELECTED',laneIndex:11,index:1});
  store.dispatch({type:'ADD_LOUPE',anchor:{x:50,y:200}});
 });
 await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','11');
 await expect(page.getByTestId('loupe-canvas-1')).toHaveAttribute('data-frozen','1');
 await expect(page.getByTestId('molecular-sim-canvas')).toHaveAttribute('data-frozen','1');
 const bytes=[...fs.readFileSync('../reference/native/modern/shared-image-scenes/alpha.png')];
 await page.evaluate(bytes=>{
  const data=new DataTransfer();data.items.add(new File([new Uint8Array(bytes)],'alpha.png',{type:'image/png'}));
  document.querySelector('[data-testid="gel-page"]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:data,clientX:50,clientY:650}));
 },bytes);
 const image=page.getByTestId('reference-image-1');await expect(image).toBeFocused();
 if(shared)await expect(page.getByTestId('reference-image-canvas-1')).toHaveAttribute('data-shared-ready','1');
 await page.mouse.move(0,0);const imagePixels=await image.screenshot();
 await page.evaluate(()=>{
  const store=(window as any).__combinedStore;
  (window as any).__combinedSample=store.getSnapshot().gel.samples[11];
  (window as any).__combinedEngine=store.getMolecularView('sample');
  (window as any).__combinedLoupe=store.getMolecularView('loupe-1');
  if(!(window as any).__combinedEngine||!(window as any).__combinedLoupe)throw Error('Expected both live molecular engines');
  store.dispatch({type:'SET_NUM_LANES',value:7});
 });
 await expect(page.getByTestId('microtube-11')).toHaveCount(0);
 await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','11');
 await page.getByTestId('sample-view').focus();await page.keyboard.press('Tab');
 await expect.poll(()=>page.evaluate(()=>(window as any).__combinedStore.getSnapshot().gel.selection?.fragmentIndex)).toBe(2);
 expect(await page.evaluate(()=>{
  const w=window as any,s=w.__combinedStore,g=s.getSnapshot().gel;
  return {sample:g.selection.sample===w.__combinedSample,engine:s.getMolecularView('sample')===w.__combinedEngine,
   loupe:s.getMolecularView('loupe-1')===w.__combinedLoupe};
 })).toEqual({sample:true,engine:true,loupe:true});
 await image.focus();expect(await image.screenshot()).toEqual(imagePixels);
 await page.keyboard.press('Delete');await expect(image).toHaveCount(0);
 await page.evaluate(()=>(window as any).__combinedStore.dispatch({type:'SET_NUM_LANES',value:12}));
 await expect(page.getByTestId('microtube-11')).toBeVisible();
 await page.getByTestId('loupe-frame-1').focus();await page.keyboard.press('Escape');
 await expect(page.getByTestId('loupe-frame-1')).toHaveCount(0);
 await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','11');
 await expect(page.getByRole('alert')).toHaveCount(0);
});
