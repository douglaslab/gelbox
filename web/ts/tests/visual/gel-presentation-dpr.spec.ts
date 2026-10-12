import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {readFile} from 'node:fs/promises';
test.use({viewport:{width:1365,height:768},deviceScaleFactor:1});
const reference=(lanes:number,dpr:number)=>fs.readFileSync(`../reference/native/modern/well-scenes/${lanes}-${dpr}-0.png`).toString('base64');
test('well presentation follows lanes and live DPR in both modes without changing the document',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');const cdp=await page.context().newCDPSession(page);
 const save=async()=>{const menu=page.getByRole('button',{name:'Application settings'});if(await menu.getAttribute('aria-expanded')!=='true')await menu.click();const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();const result=JSON.parse(await readFile((await(await pending).path())!,'utf8'));if(await menu.getAttribute('aria-expanded')==='true')await menu.click();return result;};
 for(const lanes of [7,20]){
  if(lanes===20){await page.getByTestId('settings-button').click();const track=(await page.getByTestId('gel-lanes-track').boundingBox())!;await page.mouse.click(track.x+track.width*.99,track.y+track.height/2);await expect(page.getByTestId('gel-well-19')).toBeVisible();await page.getByTestId('settings-button').click();}
  const before=await save();
  const geometry=await page.getByTestId('gel-well-0').evaluate(e=>['x','y','width','height'].map(key=>e.getAttribute(key)));
  for(const mode of ['effects','direct']){
   if(mode==='direct')await page.keyboard.press('Meta+r');
   await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-render-mode',mode);
   for(const dpr of [1,2,1]){
    await cdp.send('Emulation.setDeviceMetricsOverride',{width:1365,height:768,deviceScaleFactor:dpr,mobile:false});
    await expect(page.getByTestId('gel-canvas')).toHaveAttribute('width',String(390*dpr));
    await expect(async()=>{
     const box=(await page.getByTestId('gel-canvas').boundingBox())!;// Capture through the same CDP session that owns the metrics override.
     // Playwright's original session otherwise captures at its original DPR.
     const {data:png}=await cdp.send('Page.captureScreenshot',{format:'png',clip:{x:box.x,y:box.y,width:390,height:30,scale:1},captureBeyondViewport:false});
     const count=await page.evaluate(async({png,native,dpr})=>{
      const decode=async(data:string,x:number,y:number)=>{const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();if(image.width!==390*dpr)throw Error(`Wrong capture scale: ${image.width}`);const c=document.createElement('canvas');c.width=390*dpr;c.height=30*dpr;const ctx=c.getContext('2d')!;ctx.drawImage(image,x,y,c.width,c.height,0,0,c.width,c.height);return ctx.getImageData(0,0,c.width,c.height).data;};
      const [a,b]=await Promise.all([decode(png,0,0),decode(native,0,0)]);let count=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])count++;return count;
     },{png,native:reference(lanes,dpr),dpr});expect(count).toBe(0);
    }).toPass({timeout:5000});
    expect(await page.getByTestId('gel-well-0').evaluate(e=>['x','y','width','height'].map(key=>e.getAttribute(key)))).toEqual(geometry);
   }
  }
  expect(await save()).toEqual(before);
  // Picking stays in logical coordinates after backing-buffer changes.
  await page.getByTestId('band-0').click();await expect(page.getByTestId('fragment-view')).toBeVisible();
  await page.getByTestId('settings-button').click();await page.getByTestId('settings-button').click();
  await page.keyboard.press('Meta+r');
 }
 await expect(page.getByRole('alert')).toHaveCount(0);expect(errors).toEqual([]);await cdp.detach();
});
