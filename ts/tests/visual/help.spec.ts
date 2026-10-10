import {test,expect} from '@playwright/test';

test('native Help icon follows the lower-right corner and opens documentation without replacing the gel',async({page,context},info)=>{
  await page.addInitScript(backend=>localStorage.setItem('gelBackend',backend),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  await page.setViewportSize({width:1365,height:800});
  await page.goto('/#/gel');
  const help=page.getByRole('link',{name:'Help',exact:true});
  await expect(help).toBeVisible();
  await expect(help).toHaveAttribute('href','http://douglaslab.org/gelbox/');
  expect(await help.boundingBox()).toEqual({x:1317,y:752,width:32,height:32});
  await page.setViewportSize({width:1000,height:700});
  expect(await help.boundingBox()).toEqual({x:952,y:652,width:32,height:32});
  await help.hover();
  await expect(help.locator('img')).toHaveCSS('filter','brightness(0.9)');
  await page.screenshot({path:info.outputPath('help-control.png')});
  await page.getByTestId('microtube-0').click();
  await page.getByTestId('sample-view').focus();
  // Keep the test local while observing the actual new-window navigation.
  await context.route('**://douglaslab.org/gelbox/',route=>route.fulfill({contentType:'text/html',body:'<title>Gelbox help</title>'}));
  const popup=context.waitForEvent('page');
  await help.click();
  const opened=await popup;await opened.waitForLoadState();
  expect(opened.url()).toMatch(/^https?:\/\/douglaslab\.org\/gelbox\/$/);
  await expect(page.getByTestId('sample-view')).toBeFocused();
  await expect(page.getByTestId('gel-overlay')).toBeVisible();
  await opened.close();
});
