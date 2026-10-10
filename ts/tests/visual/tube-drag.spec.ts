import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test.beforeEach(async ({ page }, info) => {
  await page.addInitScript(b => localStorage.setItem('gelBackend', b), info.project.name.includes('webgl2') ? 'webgl2' : 'webgpu');
  await page.setViewportSize({ width: 1365, height: 768 });
  await page.goto('/#/gel');
});
async function center(page: import('@playwright/test').Page, lane: number) {
  const b = (await page.getByTestId(`microtube-${lane}`).boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + 15 };
}
async function save(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Application settings' }).click();
  const pending = page.waitForEvent('download');
  await page.getByTestId('save-gel-btn').click();
  const doc = JSON.parse(await readFile((await (await pending).path())!, 'utf8'));
  await page.keyboard.press('Escape');
  return doc;
}
test('tube follows continuous movement and can re-enter after leaving the row', async ({ page }) => {
  const source = await center(page, 0), target = await center(page, 3);
  await page.mouse.move(source.x, source.y); await page.mouse.down();
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index', '0');
  await page.mouse.move(target.x, target.y);
  await expect(page.getByTestId('microtube-0')).toHaveAttribute('data-empty', 'true');
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index', '3');
  await page.mouse.move(target.x, target.y + 130);
  await expect(page.getByTestId('sample-view')).toHaveCount(0);
  await expect(page.getByTestId('microtube-3')).toHaveAttribute('data-empty', 'true');
  await page.mouse.move(target.x, target.y); await page.mouse.up();
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index', '3');
  const doc = await save(page);
  expect(doc.Gel.Samples[0]).toBeNull();
  expect(doc.Gel.Samples[3].Fragments.length).toBeGreaterThan(0);
});
test('Alt at mouse-down clones even after releasing Alt; occupied drop preserves destination', async ({ page }) => {
  const source = await center(page, 0), target = await center(page, 2);
  await page.keyboard.down('Alt');
  await page.mouse.move(source.x, source.y); await page.mouse.down();
  await page.keyboard.up('Alt');
  await page.mouse.move(target.x, target.y); await page.mouse.up();
  const cloned = await save(page);
  expect(cloned.Gel.Samples[2]).toEqual(cloned.Gel.Samples[0]);
  await page.mouse.move(source.x, source.y); await page.mouse.down();
  await page.mouse.move(target.x, target.y); await page.mouse.up();
  const dropped = await save(page);
  expect(dropped.Gel.Samples[0]).toBeNull();
  expect(dropped.Gel.Samples[2]).toEqual(cloned.Gel.Samples[2]);
});
test('repeated tube click closes sample; right click does not start a tube drag', async ({ page }) => {
  const tube = page.getByTestId('microtube-0');
  await tube.click(); await expect(page.getByTestId('sample-view')).toBeVisible();
  await tube.click(); await expect(page.getByTestId('sample-view')).toHaveCount(0);
  await tube.click({ button: 'right' });
  await expect(page.getByTestId('sample-view')).toHaveCount(0);
});
test('unexpected capture loss ends the gesture and permits selecting another tube', async ({ page }) => {
  const source = await center(page, 0);
  await page.mouse.move(source.x, source.y); await page.mouse.down();
  // Process pending capture before testing loss of active capture.
  await page.mouse.move(source.x + 1, source.y);
  await page.getByTestId('microtube-row').evaluate(el => el.releasePointerCapture(1));
  await page.mouse.move(source.x, source.y + 130); await page.mouse.up();
  await page.getByTestId('microtube-1').click();
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index', '1');
  await expect(page.getByTestId('microtube-0')).not.toHaveAttribute('data-empty', 'true');
});
test('Tab and Delete while holding a tube persist when it moves', async ({ page }) => {
  await page.getByTestId('band-0').click();
  const source = await center(page, 0), target = await center(page, 3);
  await page.mouse.move(source.x, source.y); await page.mouse.down();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Delete');
  await page.mouse.move(target.x, target.y); await page.mouse.up();
  const doc = await save(page);
  expect(doc.Gel.Samples[0]).toBeNull();
  expect(doc.Gel.Samples[3].Fragments).toHaveLength(10);
});
