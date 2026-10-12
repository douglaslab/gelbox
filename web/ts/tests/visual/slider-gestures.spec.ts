import {test,expect} from '@playwright/test';

for(const shared of [false,true])test.describe(`shared:${shared}`,()=>{
test.beforeEach(async({page},info)=>{
 await page.addInitScript(s=>localStorage.setItem('gelSharedPresentation',s?'1':'0'),shared);
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');
});

for(const offset of [-6,6])test(`timeline handle drag retains its native start value at offset ${offset}`,async({page})=>{
 const track=page.getByTestId('timeline-slider-track'),handle=page.getByTestId('timeline-slider-handle');
 const r=(await track.boundingBox())!,y=r.y+r.height/2,start=r.x+r.width;
 const center=async()=>{const b=(await handle.boundingBox())!;return b.x+b.width/2;};
 await page.mouse.move(start+offset,y);await page.mouse.down();
 // Native only maps the down position when it lies inside the track pick rect.
 await expect.poll(center).toBeCloseTo(start+Math.min(offset,0),1);
 await page.mouse.move(start+offset-40,y);
 await expect.poll(center).toBeCloseTo(start-40,1);
 await page.mouse.up();
 await expect.poll(center).toBeCloseTo(start-40,1);
});

test('slider ignores held-pointer entry',async({page})=>{
 const track=(await page.getByTestId('timeline-slider-track').boundingBox())!;
 const handle=page.getByTestId('timeline-slider-handle'),before=await handle.boundingBox();
 await page.mouse.move(0,0);await page.mouse.down();
 await page.mouse.move(track.x+track.width/2,track.y+10);await page.mouse.up();
 expect(await handle.boundingBox()).toEqual(before);
});

for(const event of ['pointercancel','lostpointercapture'])test(`${event} ends slider ownership`,async({page})=>{
 const track=page.getByTestId('timeline-slider-track'),r=(await track.boundingBox())!;
 const handle=page.getByTestId('timeline-slider-handle');
 await track.evaluate(el=>el.addEventListener('pointerdown',event=>{
  (el as HTMLElement).dataset.pointerId=String((event as PointerEvent).pointerId);
 },{once:true}));
 await page.mouse.move(r.x+r.width/2,r.y+10);await page.mouse.down();
 const before=await handle.boundingBox();
 await track.evaluate((el,event)=>{
  const pointerId=Number((el as HTMLElement).dataset.pointerId);
  if(event==='lostpointercapture')el.releasePointerCapture(pointerId);
  else el.dispatchEvent(new PointerEvent(event,{pointerId,bubbles:true}));
 },event);
 await page.mouse.move(r.x+r.width/4,r.y+10);await page.mouse.up();
 expect(await handle.boundingBox()).toEqual(before);
 // A fresh gesture must still work.
 await page.mouse.click(r.x+r.width/4,r.y+10);
 const after=(await handle.boundingBox())!;
 expect(after.x+after.width/2).toBeCloseTo(r.x+r.width/4,1);
});

test('native voltage notch captures within four logical pixels',async({page})=>{
 await page.getByTestId('settings-button').click();
 const root=page.getByTestId('gel-voltage'),r=(await page.getByTestId('gel-voltage-track').boundingBox())!;
 await page.mouse.click(r.x+r.width/2+5,r.y+10);
 await expect(root).toHaveText(`${Math.round(600*5/r.width)} V`);
 await page.mouse.click(r.x+r.width/2+3,r.y+10);
 await expect(root).toHaveText('0 V');
});

for(const button of ['right','middle'] as const)test(`${button} slider track, handle and endpoint follow native ownership`,async({page})=>{
 const track=(await page.getByTestId('timeline-slider-track').boundingBox())!,handle=page.getByTestId('timeline-slider-handle');
 const center=async()=>{const r=(await handle.boundingBox())!;return r.x+r.width/2;};
 await page.mouse.move(track.x+track.width/4,track.y+10);await page.mouse.down({button});
 await expect.poll(center).toBeCloseTo(track.x+track.width/4,1);
 await page.mouse.move(track.x+track.width/2,track.y+10);await page.mouse.up({button});
 await expect.poll(center).toBeCloseTo(track.x+track.width/2,1);
 const high=page.getByTestId('timeline-slider-icon-hi'),r=(await high.boundingBox())!;
 await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down({button});
 await expect(high).toHaveAttribute('data-highlighted','true');
 await page.mouse.move(0,0);await expect(high).toHaveAttribute('data-highlighted','false');await page.mouse.up({button});
 await expect.poll(center).toBeCloseTo(track.x+track.width/2,1);
 await high.click({button});await expect.poll(center).toBeCloseTo(track.x+track.width,1);
 await page.mouse.move(track.x+track.width+6,track.y+10);await page.mouse.down({button});
 await page.mouse.move(track.x+track.width-34,track.y+10);await page.mouse.up({button});
 await expect.poll(center).toBeCloseTo(track.x+track.width-40,1);
});

test('endpoint cancellation clears ownership before release',async({page})=>{
 const slider=page.getByTestId('timeline-slider'),low=page.getByTestId('timeline-slider-icon-lo'),slot=low.locator('..');
 for(const event of ['pointercancel','lostpointercapture']){
  await slot.evaluate(el=>el.addEventListener('pointerdown',e=>{(el as HTMLElement).dataset.pid=String((e as PointerEvent).pointerId);},{once:true}));
  const r=(await low.boundingBox())!;await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down({button:'right'});
  await slot.evaluate((el,event)=>el.dispatchEvent(new PointerEvent(event,{pointerId:Number((el as HTMLElement).dataset.pid),bubbles:true})),event);
  await page.mouse.up({button:'right'});await expect(slider).toContainText('3:00');
  await low.click({button:'right'});await expect(slider).toContainText('0:00');
  await page.getByTestId('timeline-slider-icon-hi').click();await expect(slider).toContainText('3:00');
 }
});

});
