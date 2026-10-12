import {test,expect} from '@playwright/test';
test('a failed UI image load can recover through graphics retry',async({page},info)=>{
 await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 let failing=true;
 await page.route('**/assets/settings*.png',async route=>{
  if(failing&&route.request().resourceType()==='fetch')await route.fulfill({status:503,body:'temporary asset failure'});else await route.continue();
 });
 await page.goto('/#/gel');await expect(page.getByTestId('shared-scene-error')).toBeVisible();
 failing=false;await page.getByRole('button',{name:'Retry graphics'}).click();
 await expect(page.getByTestId('settings-button')).toHaveAttribute('data-shared-ready','1');
 await expect(page.getByTestId('shared-scene-error')).toHaveCount(0);
 await page.getByTestId('settings-button').click();await expect(page.getByTestId('gel-settings-view')).toBeVisible();
});
