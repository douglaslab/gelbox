import {releasePalette} from '../helpers/releasePalette';
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }, info) => {
  await page.addInitScript(b => localStorage.setItem('gelBackend', b), info.project.name.includes('webgl2') ? 'webgl2' : 'webgpu');
  await page.setViewportSize({ width: 1365, height: 768 });
  await page.goto('/#/gel');
});

async function saveSample(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Application settings' }).click();
  const pending = page.waitForEvent('download');
  await page.getByTestId('save-sample-btn').click();
  const doc = JSON.parse(await readFile((await (await pending).path())!, 'utf8'));
  await expect(page.getByTestId('save-sample-btn')).toHaveCount(0);
  return doc.Sample;
}

test('create an empty sample, add species, edit, delete final species and save', async ({ page }) => {
  await page.getByTestId('microtube-2').click();
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index', '2');
  await expect(page.getByTestId('inspector-panel')).toHaveCount(0);
  expect((await saveSample(page)).Fragments).toEqual([]);
  await page.getByRole('button', { name: 'New species' }).click();
  await expect(page.getByTestId('fragment-view')).toBeVisible();
  await page.getByTestId('frag-size-icon-hi').click();
  await page.getByTestId('fragment-palette-swatch-11').click();
  await expect(page.getByTestId('fragment-representative')).toBeVisible();
  await expect(page.locator('[data-testid^="band-"][data-lane-index="2"]').first()).toHaveAttribute('stroke', '#333333');
  const sample = await saveSample(page);
  expect(sample.Fragments).toHaveLength(1);
  expect(sample.Fragments[0]).toMatchObject({ Bases: 14000, Degrade: 0, AspectRatio: 1, Aggregate: [1,0,0,0,0,0,0], Color: releasePalette[11] });
  await page.getByTestId('sample-view').focus();
  await page.keyboard.press('Backspace');
  await expect(page.getByTestId('fragment-view')).toHaveCount(0);
  expect((await saveSample(page)).Fragments).toEqual([]);
  await page.getByTestId('sample-view').focus();
  await page.keyboard.press('Escape');
  // Native tick follows the retained sample reference even with index -1.
  await page.evaluate(() => new Promise<void>(resolve => {
    let frames=5;const tick=()=>--frames?requestAnimationFrame(tick):resolve();requestAnimationFrame(tick);
  }));
  await expect(page.getByTestId('sample-view')).toBeVisible();
});

test('right-click creates a species at gel position; Alt clone appends and deletion restores order', async ({ page }) => {
  const gel = (await page.getByTestId('gel-overlay').boundingBox())!;
  await page.mouse.click(gel.x + gel.width * .5, gel.y + 250, { button: 'right' });
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index', '3');
  const created = (await saveSample(page)).Fragments;
  expect(created).toHaveLength(1);
  // Locate by geometry: only the new sample occupies the fourth lane.
  const target = page.locator('[data-testid^="band-"]').last();
  await target.click({ modifiers: ['Alt'] });
  expect((await saveSample(page)).Fragments).toHaveLength(2);
  await page.getByTestId('sample-view').focus();
  await page.keyboard.press('Delete');
  expect((await saveSample(page)).Fragments).toEqual(created);
});

test('sample background toggles settings and Tab includes deselection', async ({ page }) => {
  await page.getByTestId('microtube-1').click();
  await page.getByTestId('molecular-sim-canvas').click({ position: { x: 10, y: 10 } });
  await expect(page.getByTestId('sample-settings-view')).toBeVisible();
  await page.getByTestId('molecular-sim-canvas').click({ position: { x: 10, y: 10 } });
  await expect(page.getByTestId('sample-settings-view')).toHaveCount(0);
  await page.getByRole('button', { name: 'New species' }).click();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('fragment-view')).toHaveCount(0);
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('fragment-view')).toBeVisible();
});
