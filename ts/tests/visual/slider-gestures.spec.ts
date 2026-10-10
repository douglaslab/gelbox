import {test,expect} from '@playwright/test';

test.beforeEach(async({page},info)=>{
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

test('slider ignores held-pointer entry and secondary clicks',async({page})=>{
 const track=(await page.getByTestId('timeline-slider-track').boundingBox())!;
 const handle=page.getByTestId('timeline-slider-handle'),before=await handle.boundingBox();
 await page.mouse.move(0,0);await page.mouse.down();
 await page.mouse.move(track.x+track.width/2,track.y+10);await page.mouse.up();
 expect(await handle.boundingBox()).toEqual(before);
 await page.mouse.click(track.x+track.width/2,track.y+10,{button:'right'});
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
