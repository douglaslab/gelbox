import {test,expect} from '@playwright/test';
for(const scale of [1,2])test.describe(`DPR${scale}`,()=>{
test.use({deviceScaleFactor:scale});
for(const shared of [false,true])test(`dragged tube remains visible outside lane hit regions (shared:${shared})`,async({page},info)=>{
 await page.addInitScript(({backend,shared})=>{localStorage.setItem('gelBackend',backend);if(shared)localStorage.setItem('gelSharedPresentation','1');},{backend:info.project.name.endsWith('webgl2')?'webgl2':'webgpu',shared});
 await page.setViewportSize({width:1365,height:768});await page.goto('/#/gel');
 if(shared)await expect(page.getByTestId('microtube-row')).toHaveAttribute('data-shared-ready','1');
 const source=page.getByTestId('microtube-0'),hit=(await source.boundingBox())!,icon=(await source.locator('img').boundingBox())!;
 const x=Math.floor(hit.x+hit.width/2),y=Math.floor(hit.y+15);
 await page.mouse.move(x,y);await page.mouse.down();
 await page.mouse.move(x+160,y+160);
 const ghost=page.getByTestId('drag-microtube');await expect(ghost).toBeVisible();
 await expect.poll(()=>ghost.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBe(47);
 const r=(await ghost.boundingBox())!;expect(r.x).toBeCloseTo(icon.x+160,1);expect(r.y).toBeCloseTo(icon.y+160,1);
 const png=await ghost.screenshot();
 const lit=await page.evaluate(async bytes=>{const b=await createImageBitmap(new Blob([new Uint8Array(bytes)])),c=new OffscreenCanvas(b.width,b.height),ctx=c.getContext('2d')!;ctx.drawImage(b,0,0);b.close();const d=ctx.getImageData(0,0,c.width,c.height).data;return [...d].filter((v,i)=>i%4!==3&&v>50).length;},[...png]);expect(lit).toBeGreaterThan(30);
 await expect(page.getByTestId('microtube-0')).toHaveAttribute('data-empty','true');
 const target=(await page.getByTestId('microtube-3').boundingBox())!;
 await page.mouse.move(target.x+target.width/2,target.y+15);await expect(ghost).toHaveCount(0);
 await page.mouse.up();await expect(page.getByTestId('microtube-3')).not.toHaveAttribute('data-empty','true');
});

});
