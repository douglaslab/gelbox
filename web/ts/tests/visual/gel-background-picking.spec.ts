import {test,expect} from '@playwright/test';
for(const shared of [false,true])for(const button of ['left','middle'] as const)test(`shared=${shared} ${button} gel background picks occupied lanes and clears fragment focus`,async({page},info)=>{
 await page.addInitScript(({backend,shared})=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation',shared?'1':'0');},{backend:info.project.name.endsWith('webgl2')?'webgl2':'webgpu',shared});
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');
 const gel=(await page.getByTestId('gel-overlay').boundingBox())!,x=(lane:number)=>gel.x+gel.width*(lane+.5)/7,y=gel.y+gel.height-3;
 await expect(page.getByTestId('sample-view')).toHaveCount(0);
 await page.mouse.click(x(0),y,{button});
 await expect(page.getByTestId('sample-view')).toBeVisible();await expect(page.getByTestId('sample-view')).toBeFocused();
 await page.getByTestId('band-0').click();await expect(page.getByTestId('fragment-view')).toBeVisible();
 // Inside the selected outline's SVG hit rectangle, outside native mUIRect.
 const band=(await page.getByTestId('band-0').boundingBox())!;
 await page.mouse.click(band.x+.25,band.y+band.height/2,{button});
 await expect(page.getByTestId('fragment-view')).toHaveCount(0);await expect(page.getByTestId('sample-view')).toBeFocused();
 await page.getByTestId('band-0').click();await page.mouse.click(x(1),y,{button});
 await expect(page.getByTestId('fragment-view')).toHaveCount(0);await expect(page.getByTestId('microtube-1')).toHaveAttribute('data-empty','true');
 await expect(page.getByTestId('sample-view')).toBeFocused();
 // An occupied empty sample is still selectable through its lane background.
 await page.getByTestId('microtube-1').click();await page.getByTestId('microtube-0').click();
 await page.mouse.click(x(1),y,{button});
 await expect(page.getByTestId('microtube-1')).toHaveAttribute('data-selected','true');
 await expect(page.getByTestId('sample-view')).toBeFocused();
});
