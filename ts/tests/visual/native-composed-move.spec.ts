import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const root='../reference/native/replay/composed-move';
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
test('original-release selected multimer follows tube move with hover enabled',async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');
 await page.getByTestId('file-input').setInputFiles(path.resolve(root,'input.json'));
 await expect(page.getByTestId('microtube-1')).not.toHaveAttribute('data-empty','true');
 await page.getByTestId('microtube-1').click();
 // Original release screenshot coordinate (583,420), minus its 56px title bar,
 // at display scale 2. This picks the same degraded multimer segment.
 await page.mouse.click(291.5,182);
 await expect(page.getByTestId('fragment-view')).toContainText('2,500 bp');
 await expect(page.getByTestId('fragment-view')).toContainText('35 ng');
 const selected=page.locator('[data-lane-index="1"][data-fragment-index="0"]');
 const strokes=await selected.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('stroke')));
 expect(strokes.length).toBeGreaterThan(0);expect(strokes.every(s=>s!=='transparent')).toBe(true);
 await expect(page.getByTestId('sample-frame')).toHaveCSS('border-radius','0px');
 await expect(page.getByTestId('fragment-well')).toHaveCSS('background-color','rgb(241, 241, 241)');
 await expect(page.getByTestId('fragment-representative')).toBeVisible();
 await page.keyboard.press('Meta+l');
 await expect(page.getByTestId('hover-loupe')).toBeVisible();
 await page.screenshot({path:info.outputPath('selected-hover.png')});
 await page.mouse.move(291.5,92);await page.mouse.down();
 await page.mouse.move(403,92,{steps:10});await page.mouse.up();
 await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','3');
 await expect(page.getByTestId('sample-view')).toBeFocused();
 await expect(page.getByTestId('microtube-1')).toHaveAttribute('data-empty','true');
 await expect(page.getByTestId('microtube-3')).toHaveAttribute('data-selected','true');
 await expect(page.getByTestId('fragment-view')).toContainText('2,500 bp');
 await expect(page.getByTestId('fragment-view')).toContainText('35 ng');
 expect(await page.locator('[data-lane-index="3"][data-fragment-index="0"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('stroke')))).toEqual(strokes);
 await expect(page.getByTestId('hover-loupe')).toHaveCount(0);
 await page.screenshot({path:info.outputPath('moved.png')});
 await page.getByRole('button',{name:'Application settings'}).click();
 const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
 const exported=JSON.parse(await fs.readFile((await (await pending).path())!,'utf8'));
 expect(exported).toEqual(JSON.parse(await fs.readFile(path.join(root,'moved-native.json'),'utf8')));
});


test('Species preview draws the existing selected molecule and updates its color',async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');
 await page.getByTestId('file-input').setInputFiles(path.resolve(root,'input.json'));
 await expect(page.getByTestId('microtube-1')).not.toHaveAttribute('data-empty','true');
 await page.mouse.click(291.5,182);
 const preview=page.getByTestId('fragment-representative');await expect(preview).toBeVisible();
 await page.getByTestId('fragment-palette-swatch-1').click();
 // Read actual rendered pixels, not merely the selected color in React state.
 await expect.poll(async()=>{
  const png=(await page.getByTestId('fragment-well').screenshot()).toString('base64');
  return page.evaluate(async png=>{
   const img=new Image();img.src='data:image/png;base64,'+png;await img.decode();
   const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
   const ctx=c.getContext('2d')!;ctx.drawImage(img,0,0);
   const data=ctx.getImageData(0,0,c.width,c.height).data;let red=0;
   for(let i=0;i<data.length;i+=4)if(data[i]>150&&data[i+1]<100&&data[i+2]<100)red++;
   return red;
  },png);
 }).toBeGreaterThan(20);
 await expect(page.getByTestId('fragment-well')).toHaveCSS('background-color','rgb(241, 241, 241)');
 // The preview is a presentation of the sample view, not a second simulation.
 await expect(page.getByTestId('molecular-sim-canvas')).toHaveAttribute('data-molecular-view','sample');
});
