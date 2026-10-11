import {test,expect} from '@playwright/test';
for(const shared of [false,true])for(const button of ['left','right','middle'] as const)test(`shared=${shared} Meta-${button} tube creates and drags a loupe without selecting a sample`,async({page},info)=>{
 await page.addInitScript(({backend,shared})=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation',shared?'1':'0');},{backend:info.project.name.endsWith('webgl2')?'webgl2':'webgpu',shared});
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');
 const tube=(await page.getByTestId('microtube-0').boundingBox())!,x=Math.floor(tube.x+tube.width/2),y=Math.floor(tube.y+15);
 await page.keyboard.down('Meta');await page.mouse.move(x,y);await page.mouse.down({button});
 const frame=page.getByTestId('loupe-frame-1'),anchor=page.getByTestId('loupe-anchor-1');
 await expect(frame).toBeFocused();await expect(page.getByTestId('sample-view')).toHaveCount(0);
 const initial=(await frame.boundingBox())!;expect(initial.x).toBeCloseTo(x+85.5,1);expect(initial.y).toBeCloseTo(y-85.5,1);
 await page.mouse.move(x+30,y+45);await page.keyboard.up('Meta');await page.mouse.up({button});
 const moved=(await frame.boundingBox())!;expect(moved.x-initial.x).toBeCloseTo(30,1);expect(moved.y-initial.y).toBeCloseTo(45,1);
 const a=(await anchor.boundingBox())!;expect(a.x+a.width/2).toBeCloseTo(x+30,1);expect(a.y+a.height/2).toBeCloseTo(y+45,1);
 await expect(page.getByTestId('microtube-0')).not.toHaveAttribute('data-empty','true');await expect(frame).toBeFocused();
 await page.keyboard.press('Delete');await expect(frame).toHaveCount(0);
 // Lost capture must end creation movement without converting it to a sample drag.
 await page.keyboard.down('Meta');await page.mouse.move(x,y);await page.mouse.down({button});await page.mouse.move(x+1,y);
 const row=page.getByTestId('microtube-row');await row.evaluate(el=>el.releasePointerCapture(1));
 const second=page.getByTestId('loupe-frame-2'),before=(await second.boundingBox())!;
 await page.mouse.move(x+50,y+50);await page.mouse.up({button});await page.keyboard.up('Meta');
 expect((await second.boundingBox())!.x).toBeCloseTo(before.x,1);await expect(page.getByTestId('sample-view')).toHaveCount(0);
});

for(const target of ['microtube-0','band-0'])test(`macOS Control-click on ${target} does not act as the Command loupe modifier`,async({page},info)=>{
 await page.addInitScript(backend=>localStorage.setItem('gelBackend',backend),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');
 // The original Cocoa reference uses Cinder ACCEL_DOWN=META_DOWN on macOS.
 // Control alone must not take the loupe-creation branch.
 expect(await page.evaluate(()=>navigator.platform)).toMatch(/Mac/);
 await page.keyboard.down('Control');
 try{await page.getByTestId(target).click();}
 finally{await page.keyboard.up('Control');}
 await expect(page.locator('[data-loupe-id]')).toHaveCount(0);
 await expect(page.getByTestId('microtube-0')).not.toHaveAttribute('data-empty','true');
});
