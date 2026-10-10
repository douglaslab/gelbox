import {test,expect} from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs/promises';
const input=path.resolve('../reference/native/replay/composed-move/input.json');
test.use({viewport:{width:1365,height:768},deviceScaleFactor:2});
test.beforeEach(async({page},info)=>{
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');
 await page.getByTestId('file-input').setInputFiles(input);
 await expect(page.getByTestId('microtube-1')).not.toHaveAttribute('data-empty','true');
 await page.mouse.click(291.5,182);
 await expect(page.getByTestId('fragment-view')).toBeVisible();
});
test('native closest palette marker preserves imported custom color',async({page},info)=>{
 await expect(page.getByTestId('fragment-palette-swatch-0')).toHaveAttribute('aria-pressed','true');
 const marker=await page.getByTestId('fragment-palette-swatch-0').evaluate(e=>{
  const s=getComputedStyle(e,'::before');return {left:s.left,right:s.right,top:s.top,bottom:s.bottom,radius:s.borderRadius,background:s.backgroundColor};
 });
 expect(marker).toEqual({left:'-1px',right:'-1px',top:'-1px',bottom:'-1px',radius:'4px',background:'rgb(0, 0, 0)'});
 // Merely marking the nearest swatch must preserve the imported custom color.
 await page.getByRole('button',{name:'Application settings'}).click();
 const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
 const doc=JSON.parse(await fs.readFile((await(await pending).path())!,'utf8'));
 expect(doc).toEqual(JSON.parse(await fs.readFile(input,'utf8')));
 await page.screenshot({path:info.outputPath('native-inspector-details.png')});
});
test('native sample header tube width and baseline',async({page})=>{
 const tube=page.getByTestId('sample-header-tube');await expect(tube).toBeVisible();
 await expect.poll(()=>tube.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
 const t=(await tube.boundingBox())!,s=(await page.getByTestId('sample-view').boundingBox())!;
 expect(t.width).toBe(19);expect(t.x-s.x).toBe(10.5);
 expect(t.y+t.height-s.y).toBeCloseTo(-25,5);
 expect(t.height).toBeCloseTo(19*89/47,1);
});
test('native degradation control has no numeric label',async({page})=>{
 await expect(page.getByTestId('frag-degrade')).toHaveText('');
});
test('pointer color edit retains native sample keyboard ownership',async({page})=>{
 const sample=page.getByTestId('sample-view');
 await expect(sample).toBeFocused();
 await page.getByTestId('fragment-palette-swatch-1').click();
 await expect(page.getByTestId('fragment-palette-swatch-1')).toHaveAttribute('aria-pressed','true');
 await expect(sample).toBeFocused();
 await page.keyboard.press('Delete');
 await page.getByRole('button',{name:'Application settings'}).click();
 const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
 const doc=JSON.parse(await fs.readFile((await(await pending).path())!,'utf8'));
 const expected=JSON.parse(await fs.readFile(input,'utf8'));
 const fragments=expected.Gel.Samples[1].Fragments;
 fragments[0]=fragments.pop();
 expect(doc).toEqual(expected);
 await expect(page.getByTestId('fragment-view')).toHaveCount(0);
});
test('palette retains explicit keyboard activation',async({page})=>{
 const swatch=page.getByTestId('fragment-palette-swatch-1');
 await swatch.focus();await page.keyboard.press('Space');
 await expect(swatch).toBeFocused();
 await expect(swatch).toHaveAttribute('aria-pressed','true');
});
test('native palette drag edits on press, crosses cells and retains the last valid color outside',async({page})=>{
 const sample=page.getByTestId('sample-view');
 const swatch=(i:number)=>page.getByTestId(`fragment-palette-swatch-${i}`);
 const a=(await swatch(1).boundingBox())!,b=(await swatch(6).boundingBox())!,c=(await swatch(10).boundingBox())!;
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();
 await expect(swatch(1)).toHaveAttribute('aria-pressed','true');
 await expect(sample).toBeFocused();
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:4});
 await expect(swatch(6)).toHaveAttribute('aria-pressed','true');
 await page.mouse.move(1300,700);
 await expect(swatch(6)).toHaveAttribute('aria-pressed','true');
 await page.mouse.move(c.x+c.width/2,c.y+c.height/2);
 await expect(swatch(10)).toHaveAttribute('aria-pressed','true');
 await page.mouse.move(1300,700);await page.mouse.up();
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
 await expect(swatch(10)).toHaveAttribute('aria-pressed','true');
 await expect(sample).toBeFocused();
});
