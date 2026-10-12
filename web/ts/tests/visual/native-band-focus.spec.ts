import {test,expect} from '@playwright/test';
import path from 'node:path';
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
test('native band focus uses outward two-pixel species-colored outlines and independent selection/hover alpha',async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');
 await page.getByTestId('file-input').setInputFiles(path.resolve('../reference/native/replay/composed-move/input.json'));
 await expect(page.getByTestId('microtube-1')).not.toHaveAttribute('data-empty','true');
 const band=page.locator('[data-testid^="band-"][data-lane-index="1"][data-fragment-index="0"]').first();
 await page.mouse.move(0,0);
 const attrs=()=>band.evaluate(e=>Object.fromEntries(['x','y','width','height'].map(k=>[k,Number(e.getAttribute(k))])));
 const hit=await attrs(),box=(await band.boundingBox())!;
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await expect(band).toHaveAttribute('stroke','#4080bf');
 await expect(band).toHaveAttribute('stroke-width','2');
 await expect(band).toHaveAttribute('stroke-opacity','0.35');
 expect(await attrs()).toEqual({x:hit.x-1,y:hit.y-1,width:hit.width+2,height:hit.height+2});
 await page.mouse.down();await page.mouse.up();
 await page.mouse.move(box.x+box.width/2+1,box.y+box.height/2);
 await expect(band).toHaveAttribute('stroke-opacity','1');
 await page.mouse.move(0,0);
 await expect(band).toHaveAttribute('stroke-opacity','0.65');
 await page.screenshot({path:info.outputPath('native-band-focus.png')});
});

test('native dye focus uses half the dye band color, not the fragment metadata color',async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');
 await page.getByTestId('file-input').setInputFiles(path.resolve('../reference/native/replay/composed-move/input.json'));
 await expect(page.getByTestId('microtube-1')).not.toHaveAttribute('data-empty','true');
 const band=page.locator('[data-testid^="band-"][data-lane-index="1"][data-fragment-index="5"]');
 const b=(await band.boundingBox())!;
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2);
 await expect(band).toHaveAttribute('stroke','#7d6601');
 await expect(band).toHaveAttribute('stroke-opacity','0.35');
 await expect(band).toHaveAttribute('stroke-width','2');
});
