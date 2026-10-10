import {test,expect} from '@playwright/test';
for(const locale of ['fr-FR','ar-EG'])for(const shared of [false,true])test.describe(`${locale} shared=${shared}`,()=>{
 test.use({locale,viewport:{width:1365,height:800}});
 test('species numeric labels use native ASCII commas and keep graphics alive',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({backend,shared})=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation',shared?'1':'0');},{backend:info.project.name.endsWith('webgl2')?'webgl2':'webgpu',shared});
  await page.goto('/#/gel');await page.getByTestId('microtube-2').click();await page.getByTestId('new-species').click();
  await expect(page.getByTestId('fragment-view')).toBeVisible();
  await page.getByTestId('frag-size-icon-hi').click();await expect(page.getByTestId('frag-size')).toContainText('14,000 bp');
  await page.getByTestId('frag-mass-icon-hi').click();await expect(page.getByTestId('frag-mass')).toContainText('175 ng');
  await page.mouse.move(0,0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  if(shared)await expect(page.getByTestId('shared-scene')).toBeVisible();
  expect(errors).toEqual([]);
 });
});
