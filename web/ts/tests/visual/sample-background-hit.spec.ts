import {test,expect} from '@playwright/test';
for(const shared of [false,true])test(`shared=${shared} sample background highlights only an empty pointer location each frame`,async({page},info)=>{
 await page.addInitScript(({backend,shared})=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation',shared?'1':'0');(window as any).__molsimFreezeAfterTicks=60;},{backend:info.project.name.endsWith('webgl2')?'webgl2':'webgpu',shared});
 await page.route('**/src/components/sample/SampleSimCanvas.tsx*',async route=>{const response=await route.fetch(),body=await response.text();expect(body).toContain('const store = useGelStore();');await route.fulfill({response,body:body.replace('const store = useGelStore();','const store = useGelStore(); globalThis.__backgroundStore=store;')});});
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');await page.getByTestId('microtube-0').click();
 const canvas=page.getByTestId('molecular-sim-canvas');await expect(canvas).toHaveAttribute('data-frozen','1');
 await page.evaluate(()=>{const sim=(window as any).__backgroundStore.getMolecularView('sample').sim,p=sim.parts.find((p:any)=>p.alive);if(!p)throw Error('Missing real sample particle');p.loc={x:100,y:100};p.fade=1;sim.parts=[p];if(sim.pickFragment(100,100)<0)throw Error('Fixture does not hit particle');});
 const r=(await canvas.boundingBox())!;
 const pixel=async()=>{await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));return page.screenshot({clip:{x:r.x+8,y:r.y+8,width:1,height:1}});};
 await page.mouse.move(0,0);const idle=await pixel();
 await page.mouse.move(r.x+100,r.y+100);expect(await pixel()).toEqual(idle);
 await page.mouse.down();expect(await pixel()).toEqual(idle);await page.mouse.up();
 await page.mouse.move(r.x+200,r.y+200);expect(await pixel()).not.toEqual(idle);
 // Particle motion under a stationary pointer must re-evaluate background picking.
 await page.evaluate(()=>{const sim=(window as any).__backgroundStore.getMolecularView('sample').sim;sim.parts[0].loc={x:200,y:200};if(sim.pickFragment(200,200)<0)throw Error('Missing stationary hit');});
 expect(await pixel()).toEqual(idle);
});
