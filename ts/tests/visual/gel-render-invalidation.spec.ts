import {test,expect} from '@playwright/test';

test.use({viewport:{width:1365,height:768}});
for(const shared of [false,true])test(`selection, panels and loupes retain the gel image while scientific edits redraw it (shared: ${shared})`,async({page},info)=>{
 const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
 await page.addInitScript(({backend,shared})=>{localStorage.setItem('gelBackend',backend);if(shared)localStorage.setItem('gelSharedPresentation','1');(window as any).__scientificRenders=0;},{backend,shared});
 // Count actual scientific passes, not React renders or presentation blits.
 await page.route(`**/src/lib/gel/render${backend==='webgl2'?'-gl':''}.ts*`,async route=>{
  const response=await route.fetch(),body=await response.text();
  expect(body.split('function render() {')).toHaveLength(2);
  await route.fulfill({response,body:body.replace('function render() {','function render() { globalThis.__scientificRenders++;')});
 });
 await page.goto('/#/gel');
 const canvas=page.getByTestId('gel-canvas');
 const count=()=>page.evaluate(()=>(window as any).__scientificRenders as number);
 await expect.poll(count).toBeGreaterThan(0);
 // A band click establishes native sample/species selection and may edit its bases.
 // Take the baseline afterward; subsequent Tab only changes selection.
 await page.getByTestId('band-0').click();await page.mouse.move(0,0);
 const pixels=()=>canvas.screenshot({style:'[data-testid="gel-overlay"] { visibility: hidden !important; }'});
 const initial=await pixels(),baseline=await count();
 const unchanged=async()=>{await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));expect(await count()).toBe(baseline);};
 await page.getByTestId('band-0').hover();await expect(page.getByTestId('fragment-view')).toBeVisible();await unchanged();
 await page.getByTestId('sample-view').focus();await page.keyboard.press('Tab');await page.mouse.move(0,0);await expect(page.getByTestId('fragment-view')).toBeVisible();await unchanged();
 await page.getByTestId('settings-button').click();await expect(page.getByTestId('gel-settings-view')).toBeVisible();await unchanged();
 await page.getByTestId('settings-button').click();
 const band=(await page.getByTestId('band-0').boundingBox())!;
 await page.keyboard.down('Meta');await page.mouse.click(band.x+band.width/2,band.y+band.height/2);await page.keyboard.up('Meta');
 const loupe=page.getByTestId('loupe-frame-1');await expect(loupe).toBeVisible();await unchanged();
 await page.keyboard.press('Escape');await expect(loupe).toHaveCount(0);await unchanged();
 // Verify the optimization does not freeze genuine scientific or layout edits.
 await page.getByTestId('timeline-slider-icon-lo').click();await expect.poll(count).toBeGreaterThan(baseline);
 expect(await pixels()).not.toEqual(initial);
 await page.getByTestId('timeline-slider-icon-hi').click();expect(await pixels()).toEqual(initial);
 await page.getByTestId('settings-button').click();const beforeLanes=await count();
 await page.getByTestId('gel-lanes-icon-hi').click();await expect(page.getByTestId('gel-well-19')).toBeVisible();
 await expect.poll(count).toBeGreaterThan(beforeLanes);expect(await pixels()).not.toEqual(initial);
});
