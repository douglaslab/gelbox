import {test,expect} from '@playwright/test';
import {openSampleSettings} from './sample-helpers';
for(const shared of [false,true])test(`shared=${shared} buffer pointer presets retain sample keyboard ownership`,async({page},info)=>{
 await page.addInitScript(({backend,shared})=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation',shared?'1':'0');},{backend:info.project.name.endsWith('webgl2')?'webgl2':'webgpu',shared});
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');await page.getByTestId('microtube-0').click();
 await openSampleSettings(page);await expect(page.getByTestId('sample-view')).toBeFocused();
 const preset=page.getByTestId('sample-buffer-view-preset-TAE');await preset.click();
 await expect(preset).toHaveAttribute('data-selected','true');await expect(page.getByTestId('sample-view')).toBeFocused();
 await page.keyboard.press('Tab');await expect(page.getByTestId('selection-info')).toContainText('lane 0 fragment 0');
 // Deliberate keyboard focus still permits activating a preset.
 await openSampleSettings(page);await preset.focus();await page.keyboard.press('Enter');await expect(preset).toHaveAttribute('data-selected','true');
});
