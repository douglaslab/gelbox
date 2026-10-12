import {test,expect} from '@playwright/test';

for(const shared of [false,true])for(const scale of [1,2])test(`shared=${shared} readable application menu geometry and assets at ${scale}x`,async({browser},info)=>{
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
      expect(box.height).toBe(17);
      expect(box.width).toBe(n===2?67:50);
      await expect(button).toHaveCSS('font-size',`${12}px`);
      await expect(button).toHaveCSS('border-radius','2px');
      await expect(button).toHaveCSS('background-color','rgb(242, 242, 242)');
    }
    const screenshot=await page.screenshot({path:info.outputPath(`menu-${scale}x.png`)});
    // Verify GPU paint fills the enlarged hit targets as well as DOM geometry.
    const boxes=await Promise.all([open.boundingBox(),save.boundingBox()]);
    const painted=await page.evaluate(async({bytes,boxes,scale})=>{
      const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
      const canvas=new OffscreenCanvas(image.width,image.height),ctx=canvas.getContext('2d')!;
      ctx.drawImage(image,0,0);image.close();
      return boxes.map(box=>[...ctx.getImageData(Math.floor((box!.x+box!.width-2)*scale),Math.floor((box!.y+box!.height/2)*scale),1,1).data].slice(0,3));
    },{bytes:[...screenshot],boxes,scale});
    expect(painted).toEqual([[242,242,242],[242,242,242]]);
    await page.getByTestId('microtube-0').click();
    await page.getByRole('button',{name:'Application settings'}).click();
    const sample=(await page.getByTestId('save-sample-btn').boundingBox())!;
    expect(sample.y+sample.height).toBe(664);
    expect(sample.width).toBe(139);expect(sample.height).toBe(17);
    expect((await save.boundingBox())!.y+(await save.boundingBox())!.height).toBe(636);
    expect((await open.boundingBox())!.y+(await open.boundingBox())!.height).toBe(608);
  } finally {await context.close();}
});
