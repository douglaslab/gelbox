import {test,expect} from '@playwright/test';
for(const shared of [false,true])for(const button of ['right','middle'] as const)test(`shared=${shared} ${button} empty sample background toggles settings and retains focus`,async({page},info)=>{
 await page.addInitScript(({backend,shared})=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation',shared?'1':'0');},{backend:info.project.name.endsWith('webgl2')?'webgl2':'webgpu',shared});
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');
 await page.getByTestId('microtube-1').click();
 const canvas=page.getByTestId('molecular-sim-canvas'),sample=page.getByTestId('sample-view'),settings=page.getByTestId('sample-settings-view');
 await expect(canvas).toBeVisible();await expect(settings).toHaveCount(0);
 await canvas.click({position:{x:40,y:40},button});
 await expect(settings).toBeVisible();await expect(sample).toBeFocused();
 await canvas.click({position:{x:40,y:40},button});
 await expect(settings).toHaveCount(0);await expect(sample).toBeFocused();
});
