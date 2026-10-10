import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test.beforeEach(async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');await page.getByTestId('band-0').click();await page.mouse.move(0,0);
 await expect(page.getByTestId('frag-aggregate')).toBeVisible();
});
async function weights(page:Page){
 await page.getByRole('button',{name:'Application settings'}).click();
 const pending=page.waitForEvent('download');await page.getByTestId('save-sample-btn').click();
 const file=await pending;return JSON.parse(await readFile((await file.path())!,'utf8')).Sample.Fragments[0].Aggregate;
}
test('aggregate graph paints current columns and retains earlier edits in one gesture',async({page})=>{
 const graph=page.getByTestId('frag-aggregate-col-0').locator('..'),r=(await graph.boundingBox())!;
 const x=(i:number)=>r.x+r.width*(i+.5)/7,y=(v:number)=>r.y+r.height*(1-v);
 // Column 2 starts at zero: this down is in blank graph space.
 await page.mouse.move(x(2),y(.63));await page.mouse.down();
 await page.mouse.move(x(4),y(.42));
 await page.mouse.move(x(5),y(.78));
 await page.mouse.move(x(0),y(.22));await page.mouse.up();
 const a=await weights(page);
 expect(a).toEqual([0,0,.65,0,.4,1,0]);
});
test('aggregate endpoint icons select only first or last size',async({page})=>{
 await page.getByTestId('frag-aggregate-icon-hi').click();
 expect(await weights(page)).toEqual([0,0,0,0,0,0,1]);
 await page.getByTestId('frag-aggregate-icon-lo').click();
 expect(await weights(page)).toEqual([1,0,0,0,0,0,0]);
});
test('aggregate cancellation prevents further painting until a new down',async({page})=>{
 const graph=page.getByTestId('frag-aggregate-col-0').locator('..'),r=(await graph.boundingBox())!;
 await graph.evaluate(el=>el.addEventListener('pointerdown',e=>{(el as HTMLElement).dataset.pid=String((e as PointerEvent).pointerId);},{once:true}));
 await page.mouse.move(r.x+r.width/14,r.y+r.height*.5);await page.mouse.down();
 await graph.evaluate(el=>el.dispatchEvent(new PointerEvent('pointercancel',{pointerId:Number((el as HTMLElement).dataset.pid),bubbles:true})));
 await page.mouse.move(r.x+r.width*4.5/7,r.y+r.height*.35);await page.mouse.up();
 expect(await weights(page)).toEqual([.5,0,0,0,0,0,0]);
});

for(const imported of [[0,1],[.0001,1],[1,.2,.3,.4,.5,.6,.7,.8,.9],[]])
test(`aggregate inspector preserves imported distribution ${JSON.stringify(imported)}`,async({page})=>{
 const document=JSON.parse(await readFile('../reference/native/files/ladder-after-selection.gel.json','utf8'));
 document.Gel.Samples[0].Fragments=document.Gel.Samples[0].Fragments.slice(0,1);
 document.Gel.Samples[0].Fragments[0].Aggregate=imported;
 document.Gel.Samples[0].Fragments[0].Bases=1000;
 await page.getByTestId('file-input').setInputFiles({name:'aggregate.gel.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(document))});
 await page.getByTestId('band-0').click();await page.mouse.move(0,0);
 const columns=page.locator('[data-testid^="frag-aggregate-col-"]');
 await expect(columns).toHaveCount(Math.max(7,imported.length));
 // Merely opening the inspector must not rewrite the source array.
 // Native JSON omits the Aggregate field when its vector is empty.
 expect(await weights(page)).toEqual(imported.length?imported:undefined);
 const graph=page.getByTestId('frag-aggregate-col-0').locator('..'),r=(await graph.boundingBox())!;
 const expected=imported.length?[...imported]:[1];
 while(expected.length<7)expected.push(0);
 await page.mouse.click(r.x+r.width*2.5/expected.length,r.y+r.height/2);
 expected[2]=.5;
 expect(await weights(page)).toEqual(expected);
});
