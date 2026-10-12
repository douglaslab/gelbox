import {test,expect} from '@playwright/test';
for(const shared of [false,true])for(const button of ['left','right','middle'] as const)test(`shared=${shared} ${button} icon buttons own release and preserve keyboard actions`,async({page},info)=>{
 await page.addInitScript(({backend,shared})=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation',shared?'1':'0');(window as any).__helpOpens=[];window.open=((...args:any[])=>{(window as any).__helpOpens.push(args);return null;}) as typeof window.open;},{backend:info.project.name.endsWith('webgl2')?'webgl2':'webgpu',shared});
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');
 const app=page.getByRole('button',{name:'Application settings'}),settings=page.getByTestId('settings-button');
 await app.click({button});await expect(app).toHaveAttribute('aria-expanded','true');
 await app.click({button});await expect(app).toHaveAttribute('aria-expanded','false');
 await settings.click({button});await expect(settings).toHaveAttribute('aria-pressed','true');
 await settings.click({button});await expect(settings).toHaveAttribute('aria-pressed','false');
 const r=(await settings.boundingBox())!;
 for(const cancel of ['outside','pointercancel','lostpointercapture']){
  await page.mouse.move(r.x+16,r.y+16);await page.mouse.down({button});
  if(cancel==='outside')await page.mouse.move(0,0);
  else await settings.evaluate((el,type)=>el.dispatchEvent(new PointerEvent(type,{pointerId:1,bubbles:true})),cancel);
  await page.mouse.up({button});await expect(settings).toHaveAttribute('aria-pressed','false');
 }
 await settings.focus();await page.keyboard.press('Space');await expect(settings).toHaveAttribute('aria-pressed','true');
 await page.keyboard.press('Enter');await expect(settings).toHaveAttribute('aria-pressed','false');
 await page.getByTestId('microtube-1').click();await page.getByTestId('new-species').click({button});
 await expect(page.getByTestId('selection-info')).toContainText('lane 1 fragment 0');await expect(page.getByTestId('sample-view')).toBeFocused();
 const help=page.getByRole('link',{name:'Help',exact:true});await help.click({button});
 await expect.poll(()=>page.evaluate(()=>(window as any).__helpOpens.length)).toBe(1);
 expect(await page.evaluate(()=>(window as any).__helpOpens[0][0])).toBe('http://douglaslab.org/gelbox/');
 await help.focus();await page.keyboard.press('Enter');
 await expect.poll(()=>page.evaluate(()=>(window as any).__helpOpens.length)).toBe(2);
});
