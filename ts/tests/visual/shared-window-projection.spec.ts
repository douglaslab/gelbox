import {test,expect} from '@playwright/test';
import fs from 'node:fs';
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
test('shared projection follows logical resize when physical surface size is unchanged',async({page},info)=>{
 await page.addInitScript(backend=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation','1');},info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');await page.mouse.move(0,0);
 await expect(page.getByTestId('shared-scene')).toHaveAttribute('width','2730');
 await expect(page.getByTestId('shared-scene')).toHaveAttribute('height','1536');
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:2730,height:1536,deviceScaleFactor:1,mobile:false});
 await expect.poll(()=>page.evaluate(()=>[innerWidth,innerHeight,devicePixelRatio])).toEqual([2730,1536,1]);
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 await expect(page.getByTestId('shared-scene')).toHaveAttribute('width','2730');
 await expect(page.getByTestId('shared-scene')).toHaveAttribute('height','1536');
 const rect=(await page.getByTestId('gel-canvas').boundingBox())!;
 // Playwright page.screenshot restores its configured DPR; raw CDP retains this emulated display change.
 const png=Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})).data,'base64');await fs.promises.writeFile(info.outputPath('resized.png'),png);
 await fs.promises.writeFile(info.outputPath('metrics.json'),JSON.stringify({rect,metrics:await page.evaluate(()=>[innerWidth,innerHeight,devicePixelRatio])}));
 const pixels=await page.evaluate(async({png,rect})=>{
  const im=await createImageBitmap(new Blob([new Uint8Array(png)],{type:'image/png'}));
  const canvas=new OffscreenCanvas(im.width,im.height),ctx=canvas.getContext('2d')!;ctx.drawImage(im,0,0);im.close();
  return [[rect.x+rect.width-10,rect.y+rect.height/2],[rect.x+rect.width+5,rect.y+rect.height/2]].map(([x,y])=>[...ctx.getImageData(Math.floor(x),Math.floor(y),1,1).data].slice(0,3));
 },{png:[...png],rect});
 expect(pixels).toEqual([[0,0,0],[255,255,255]]);
 await expect.poll(()=>page.evaluate(()=>[innerWidth,innerHeight,devicePixelRatio])).toEqual([2730,1536,1]);
 await cdp.detach();
});
