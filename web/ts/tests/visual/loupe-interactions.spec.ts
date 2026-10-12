import {test,expect} from '@playwright/test';
for(const shared of [false,true])test.describe(`shared:${shared}`,()=>{
test.beforeEach(async({page},info)=>{
 await page.addInitScript(({b,shared})=>{localStorage.setItem('gelBackend',b);if(shared)localStorage.setItem('gelSharedPresentation','1');(window as any).__molsimFreezeAfterTicks=60;},{b:info.project.name.includes('webgl2')?'webgl2':'webgpu',shared});
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');
});
for(const button of ['left','right','middle'] as const)test(`${button} persistent loupe frame, three drag modes, resize and keyboard ownership`,async({page})=>{
 await page.getByTestId('microtube-0').click();
 const gel=page.getByTestId('gel-overlay'),g=(await gel.boundingBox())!;
 const band=page.getByTestId('band-0'),b=(await band.boundingBox())!;
 // WebKit delivers integer mouse coordinates; use the same exact input on every engine.
 const x=Math.floor(b.x+b.width/2),y=Math.floor(b.y+b.height/2);
 await page.keyboard.down('Meta');await page.mouse.click(x,y);await page.keyboard.up('Meta');
 const frame=page.getByTestId('loupe-frame-1'),canvas=page.getByTestId('loupe-canvas-1'),anchor=page.getByTestId('loupe-anchor-1');
 await expect(frame).toBeFocused();await expect(canvas).toHaveAttribute('data-frozen','1');
 let f=(await frame.boundingBox())!;
 expect(f.x).toBeCloseTo(x+85.5,1);expect(f.y).toBeCloseTo(y-85.5,1);
 // Compare molecule content, not the translucent CSS focus border composited
 // over a different background after moving. Use integer-aligned interior clips
 // because WebKit expands fractional element screenshot bounds to whole pixels.
 const contentScreenshot=async()=>{
  const r=(await canvas.boundingBox())!;
  return page.screenshot({clip:{x:Math.ceil(r.x+2),y:Math.ceil(r.y+2),width:Math.floor(r.width-4),height:Math.floor(r.height-4)}});
 };
 // Compare the same idle pointer state before and after the move: native
 // anchor hover also shades the body, even outside the particle canvas.
 await page.mouse.move(0,0);
 const before=await contentScreenshot();
 // Body moves only the frame; seed/content remain unchanged.
 await page.mouse.move(f.x+10,f.y+155);await page.mouse.down({button});await page.mouse.move(f.x+40,f.y+175);await page.mouse.up({button});await page.mouse.move(0,0);
 let moved=(await frame.boundingBox())!;expect(moved.x-f.x).toBeCloseTo(30,1);expect(moved.y-f.y).toBeCloseTo(20,1);
 expect(await contentScreenshot()).toEqual(before);
 // Background selection follows the loupe's off-gel sample and closes the source.
 await expect(page.getByTestId('molecular-sim-canvas')).toHaveCount(0);
 let a=(await anchor.boundingBox())!;expect(a.x+a.width/2).toBeCloseTo(x,1);
 // Anchor moves independently.
 await page.mouse.move(x,y);await page.mouse.down({button});await page.mouse.move(x+12,y+10);await page.mouse.up({button});
 expect((await frame.boundingBox())!.x).toBeCloseTo(moved.x,1);
 a=(await anchor.boundingBox())!;expect(a.x+a.width/2).toBeCloseTo(x+12,1);
 // Wedge translates anchor and frame together.
 const wx=(x+12+moved.x)/2,wy=y+10;
 await page.mouse.move(wx,wy);await page.mouse.down({button});await page.mouse.move(wx+18,wy+9);await page.mouse.up({button});
 expect((await frame.boundingBox())!.x).toBeCloseTo(moved.x+18,1);
 a=(await anchor.boundingBox())!;expect(a.x+a.width/2).toBeCloseTo(x+30,1);
 const old=(await frame.boundingBox())!,oldGel=(await gel.boundingBox())!;
 await page.setViewportSize({width:1465,height:900});
 await expect.poll(async()=>(await gel.boundingBox())!.x).toBe(oldGel.x+40);
 const newGel=(await gel.boundingBox())!,resized=(await frame.boundingBox())!;
 expect(resized.x-old.x).toBeCloseTo(newGel.x-oldGel.x,1);expect(resized.y-old.y).toBeCloseTo(newGel.y-oldGel.y,1);
 await page.keyboard.press('Tab');await expect(frame).toBeFocused();
 await page.keyboard.press('Delete');await expect(frame).toHaveCount(0);await expect(page.getByTestId('molecular-sim-canvas')).toHaveCount(0);
});
test('Cmd drag creates a loupe on empty gel and moves frame and anchor',async({page})=>{
 const g=(await page.getByTestId('gel-overlay').boundingBox())!;const x=g.x+g.width*.8,y=g.y+g.height*.7;
 await page.keyboard.down('Meta');await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+25,y-15);await page.mouse.up();await page.keyboard.up('Meta');
 const frame=page.getByTestId('loupe-frame-1');await expect(frame).toBeFocused();
 const f=(await frame.boundingBox())!;expect(f.x).toBeCloseTo(x+25+85.5,1);expect(f.y).toBeCloseTo(y-15-85.5,1);
 await page.keyboard.press('Escape');await expect(frame).toHaveCount(0);
});
test('loupe particles remain paused without the screenshot freeze hook',async({page})=>{
 await page.evaluate(()=>{delete (window as any).__molsimFreezeAfterTicks;});
 const b=(await page.getByTestId('band-0').boundingBox())!;
 await page.keyboard.down('Meta');await page.mouse.click(b.x+b.width/2,b.y+b.height/2);await page.keyboard.up('Meta');await page.mouse.move(0,0);
 const canvas=page.getByTestId('loupe-canvas-1');
 await expect.poll(async()=>Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
 const frames=()=>page.evaluate(()=>new Promise<void>(resolve=>{let n=0;const tick=()=>{if(++n===45)resolve();else requestAnimationFrame(tick);};requestAnimationFrame(tick);}));
 await frames();const before=await canvas.screenshot();await frames();expect(await canvas.screenshot()).toEqual(before);
 // Shared chrome has independent exact native references in shared-loupe-native.
 if(!shared)await expect(page).toHaveScreenshot('persistent-loupe.png',{maxDiffPixels:20});
});
for(const button of ['left','right','middle'] as const)test(`${button} losing creation capture and canceling frame drag release ownership`,async({page})=>{
 const overlay=page.getByTestId('gel-overlay'),g=(await overlay.boundingBox())!;const x=g.x+300,y=g.y+300;
 await page.keyboard.down('Meta');await page.mouse.move(x,y);await page.mouse.down();
 await expect.poll(()=>overlay.evaluate(el=>el.hasPointerCapture(1))).toBe(true);
 await overlay.evaluate(el=>el.releasePointerCapture(1));
 const frame=page.getByTestId('loupe-frame-1');const before=(await frame.boundingBox())!;
 await page.mouse.move(x+40,y+40);await page.mouse.up();await page.keyboard.up('Meta');
 expect((await frame.boundingBox())!.x).toBeCloseTo(before.x,1);
 await page.mouse.move(before.x+20,before.y+150);await page.mouse.down({button});await page.mouse.move(before.x+30,before.y+155);
 await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1})));
 const stopped=(await frame.boundingBox())!;await page.mouse.move(before.x+70,before.y+155);await page.mouse.up({button});
 expect((await frame.boundingBox())!.x).toBeCloseTo(stopped.x,1);
});

test('clicking an older loupe raises it and retains its drag and keyboard focus',async({page})=>{
 const g=(await page.getByTestId('gel-overlay').boundingBox())!;
 for(const [x,y] of [[g.x+30,g.y+350],[g.x+270,g.y+100]]){
  await page.keyboard.down('Meta');await page.mouse.click(x,y);await page.keyboard.up('Meta');
 }
 const first=page.getByTestId('loupe-frame-1'),second=page.getByTestId('loupe-frame-2');
 const b=(await first.boundingBox())!;
 await page.mouse.move(b.x+20,b.y+150);await page.mouse.down();await page.mouse.move(b.x+45,b.y+160);await page.mouse.up();
 await expect(first).toBeFocused();expect((await first.boundingBox())!.x).toBeCloseTo(b.x+25,1);
 expect(await page.getByTestId('loupe-1').evaluate(el=>Number(getComputedStyle(el).zIndex))).toBeGreaterThan(await page.getByTestId('loupe-2').evaluate(el=>Number(getComputedStyle(el).zIndex)));
 await page.keyboard.press('Delete');await expect(first).toHaveCount(0);await expect(second).toBeVisible();
 await second.focus();await page.keyboard.press('Backspace');await expect(second).toHaveCount(0);
});
test('an anchor inside its frame keeps priority over frame dragging',async({page})=>{
 const g=(await page.getByTestId('gel-overlay').boundingBox())!;const x=g.x+250,y=g.y+300;
 await page.keyboard.down('Meta');await page.mouse.click(x,y);await page.keyboard.up('Meta');
 const frame=page.getByTestId('loupe-frame-1'),anchor=page.getByTestId('loupe-anchor-1');const f=(await frame.boundingBox())!;
 const inside={x:f.x+85.5,y:f.y+85.5};
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(inside.x,inside.y);await page.mouse.up();
 await page.mouse.down();await page.mouse.move(inside.x+20,inside.y+10);await page.mouse.up();
 expect((await frame.boundingBox())!.x).toBeCloseTo(f.x,1);expect((await frame.boundingBox())!.y).toBeCloseTo(f.y,1);
 const a=(await anchor.boundingBox())!;expect(a.x+a.width/2).toBeCloseTo(inside.x+20,1);expect(a.y+a.height/2).toBeCloseTo(inside.y+10,1);
});

});
