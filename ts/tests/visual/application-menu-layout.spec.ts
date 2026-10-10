import {test,expect} from '@playwright/test';

for(const shared of [false,true])for(const scale of [1,2])test(`shared=${shared} native application menu geometry and assets at ${scale}x`,async({browser},info)=>{
  const context=await browser.newContext({viewport:{width:1365,height:800},deviceScaleFactor:scale});
  const page=await context.newPage();
  await page.addInitScript(backend=>localStorage.setItem('gelBackend',backend),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  try {
    await page.addInitScript(shared=>localStorage.setItem('gelSharedPresentation',shared?'1':'0'),shared);
    await page.goto('/#/gel');
    const help=page.getByRole('link',{name:'Help'}).locator('img');
    await expect.poll(()=>help.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
    expect(await help.evaluate((img:HTMLImageElement)=>new URL(img.currentSrc).pathname)).toBe(`/assets/help${scale===2?'@2x':''}.png`);
    await page.getByRole('button',{name:'Application settings'}).click();
    const divider=page.getByTestId('application-menu-divider');
    await expect(divider).toBeVisible();
    expect(await divider.boundingBox()).toEqual({x:12,y:734,width:113,height:8});
    const check=async(name:string,n:number)=>{
      const label=page.getByRole('checkbox',{name,exact:true}).locator('..');
      const box=(await label.boundingBox())!;
      expect(box.x).toBe(16);expect(box.y+box.height).toBe(752-32-28*n);
    };
    await check('Render',0);await check('Loupe on hover',1);
    const save=page.getByTestId('save-gel-btn'),open=page.getByTestId('open-btn');
    for(const [button,n] of [[save,2],[open,3]] as const) {
      const box=(await button.boundingBox())!;
      expect(box.x).toBe(16);expect(box.y+box.height).toBe(752-32-28*n);
      expect(box.height).toBe(Math.floor(17/scale));
      expect(box.width).toBe(Math.floor((n===2?67:50)/scale));
      await expect(button).toHaveCSS('font-size',`${12/scale}px`);
      await expect(button).toHaveCSS('border-radius','2px');
      await expect(button).toHaveCSS('background-color','rgb(242, 242, 242)');
    }
    await page.screenshot({path:info.outputPath(`menu-${scale}x.png`)});
    await page.getByTestId('microtube-0').click();
    await page.getByRole('button',{name:'Application settings'}).click();
    const sample=(await page.getByTestId('save-sample-btn').boundingBox())!;
    expect(sample.y+sample.height).toBe(664);
    expect(sample.width).toBe(Math.floor(139/scale));expect(sample.height).toBe(Math.floor(17/scale));
    expect((await save.boundingBox())!.y+(await save.boundingBox())!.height).toBe(636);
    expect((await open.boundingBox())!.y+(await open.boundingBox())!.height).toBe(608);
  } finally {await context.close();}
});
