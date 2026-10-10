import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

test.beforeEach(async ({page}, info) => {
 await page.addInitScript(b => localStorage.setItem('gelBackend',b), info.project.name.includes('webgl2')?'webgl2':'webgpu');
 await page.setViewportSize({width:1365,height:800});
 await page.goto('/#/gel');
});
async function frames(page: Page) {
 await page.evaluate(() => new Promise<void>(resolve => {
  let n=5; const tick=()=>--n ? requestAnimationFrame(tick) : resolve(); requestAnimationFrame(tick);
 }));
}
async function tube(page: Page, lane: number) {
 const box=(await page.getByTestId(`microtube-${lane}`).boundingBox())!;
 return {x:box.x+box.width/2,y:box.y+15};
}

test('off-document selection survives removal without selecting a new lane occupant', async ({page}) => {
 await page.getByTestId('band-0').click();
 const from=await tube(page,0);
 await page.mouse.move(from.x,from.y); await page.mouse.down();
 await page.mouse.move(from.x,from.y+140); await page.mouse.up();
 await frames(page);
 await expect(page.getByTestId('selection-info')).toContainText('lane -1 fragment 0');
 await expect(page.getByTestId('sample-view')).toHaveCount(0);
 await page.getByRole('button',{name:'Application settings'}).click();
 await page.getByTestId('file-input').setInputFiles(path.resolve('../reference/native/files/1kbladder.xml'));
 await page.mouse.move(0,0); await frames(page);
 await expect(page.getByTestId('microtube-0')).not.toHaveAttribute('data-empty','true');
 await expect(page.getByTestId('selection-info')).toContainText('lane -1 fragment 0');
 await expect(page.getByTestId('sample-view')).toHaveCount(0);
 await expect(page.getByTestId('band-0')).toHaveAttribute('stroke','transparent');
 await page.getByTestId('microtube-0').click();
 await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','0');
 await expect(page.getByTestId('selection-info')).not.toContainText('fragment 0');
});

test('Alt clone keeps original shared selection across frames and independent edits', async ({page}) => {
 await page.getByTestId('band-0').click();
 const originalBases=Number((await page.getByTestId('selection-info').textContent())!.match(/: (\d+) bp/)![1]);
 const from=await tube(page,0),to=await tube(page,2);
 await page.keyboard.down('Alt');await page.mouse.move(from.x,from.y);await page.mouse.down();
 await page.mouse.move(to.x,to.y);await page.mouse.up();await page.keyboard.up('Alt');
 await page.mouse.move(0,0);await frames(page);
 await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','0');
 await expect(page.getByTestId('selection-info')).toContainText('lane 0 fragment 0');
 await page.getByTestId('frag-size-icon-hi').click();
 await expect(page.getByTestId('selection-info')).toContainText('14000 bp');
 await page.getByRole('button',{name:'Application settings'}).click();
 const pending=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
 const doc=JSON.parse(await readFile((await (await pending).path())!,'utf8'));
 expect(doc.Gel.Samples[0].Fragments[0].Bases).toBe(14000);
 expect(doc.Gel.Samples[2].Fragments[0].Bases).toBe(originalBases);
});

test('frame follows retained selection after close; full document replacement clears it', async ({page}) => {
 await page.getByTestId('band-0').click();
 await page.getByTestId('sample-view').focus();await page.keyboard.press('Escape');
 await page.mouse.move(0,0);await frames(page);
 await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index','0');
 await expect(page.getByTestId('fragment-view')).toBeVisible();
 await page.getByRole('button',{name:'Application settings'}).click();
 await page.getByTestId('file-input').setInputFiles(path.resolve('../reference/native/files/ladder-after-selection.gel.json'));
 await frames(page);
 await expect(page.getByTestId('sample-view')).toHaveCount(0);
 await expect(page.getByTestId('band-0')).toHaveAttribute('stroke','transparent');
});
