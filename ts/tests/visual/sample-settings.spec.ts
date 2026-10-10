import { openSampleSettings } from './sample-helpers';
import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

test.beforeEach(async ({ page }, testInfo) => {
  const backend = testInfo.project.name === 'chromium-webgl2' ? 'webgl2' : 'webgpu';
  await page.addInitScript((b: string) => { localStorage.setItem('gelBackend', b); }, backend);
});

function maybeSkipLinuxWebGPU(testInfo: import('@playwright/test').TestInfo) {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
}

test('Buffer + Dyes panel opens after clicking the sample background', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // Click the loaded tube — opens SampleSettingsView (no fragment selected).
  await page.locator('[data-testid="microtube-0"]').click();
  await openSampleSettings(page);
  await expect(page.getByTestId('sample-settings-view')).toBeVisible();
  await expect(page.getByText('Buffer + Dyes', { exact: true })).toBeVisible();

  // Buffer + 4 dye sliders all present.
  await expect(page.getByTestId('sample-buffer-view')).toBeVisible();
  for (let i = 0; i < 4; i++) {
    await expect(page.getByTestId(`dye-row-${i}`)).toBeVisible();
  }
});

test('Buffer preset buttons select the matching preset', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');
  await page.locator('[data-testid="microtube-0"]').click();
  await openSampleSettings(page);

  // Click TAE preset.
  await page.getByTestId('sample-buffer-view-preset-TAE').click();
  await expect(page.getByTestId('sample-buffer-view-preset-TAE'))
    .toHaveAttribute('data-selected', 'true');

  // Switching to H2O un-selects TAE.
  await page.getByTestId('sample-buffer-view-preset-H2O').click();
  await expect(page.getByTestId('sample-buffer-view-preset-H2O'))
    .toHaveAttribute('data-selected', 'true');
  await expect(page.getByTestId('sample-buffer-view-preset-TAE'))
    .not.toHaveAttribute('data-selected', 'true');
});

test('Setting dye mass adds a band to the gel (lazy-create dye fragment)', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // Ladder fixture has 11 non-dye fragments, all with mass>0 → 11 bands.
  const bands = page.locator('[data-testid^="band-"]');
  await expect(bands).toHaveCount(11);

  await page.locator('[data-testid="microtube-0"]').click();
  await openSampleSettings(page);
  await expect(page.getByTestId('sample-settings-view')).toBeVisible();

  // Click on the dye-0 (Xylene) bar track at ~50% to set its mass to ~62 ng.
  const track = page.getByTestId('dye-row-0-slider-track');
  const box   = await track.boundingBox();
  if (!box) throw new Error('dye-0 track missing');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  // Dye fragment was lazy-created → 12 bands now (11 ladder + 1 dye).
  await expect(bands).toHaveCount(12);
});

// Native SampleSettingsView uses Dye::kColors directly; no linear-to-sRGB conversion.
test('dye bars retain the native color values', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');
  await page.getByTestId('microtube-0').click();
  await openSampleSettings(page);
  const colors = [
    ['rgb(0, 175, 226)', 'rgb(204, 239, 249)'],
    ['rgb(152, 93, 147)', 'rgb(234, 223, 233)'],
    ['rgb(179, 167, 211)', 'rgb(240, 237, 246)'],
    ['rgb(250, 203, 1)', 'rgb(254, 245, 204)'],
  ];
  for (const [dye, [fill, empty]] of colors.entries()) {
    const track = page.getByTestId(`dye-row-${dye}-slider-track`);
    await expect(track).toHaveCSS('background-color', empty);
    await expect(track.locator(':scope > div').first()).toHaveCSS('background-color', fill);
  }
});

test('a first zero dye edit persists native fragment defaults when saved', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');
  await page.getByTestId('file-input').setInputFiles(
    path.resolve('../reference/native/files/interop/empty-native.json'));
  await page.getByTestId('microtube-1').click();
  await openSampleSettings(page);
  const track = page.getByTestId('dye-row-0-slider-track');
  await track.click({ position: { x: 0.1, y: 8 } });
  await page.getByRole('button', { name: 'Application settings' }).click();
  const pending = page.waitForEvent('download');
  await page.getByTestId('save-sample-btn').click();
  const download = await pending;
  const saved = JSON.parse(await fs.readFile((await download.path())!, 'utf8'));
  // Sample::setDye + Fragment/Aggregate constructors + Sample::toJson.
  expect(saved.Sample.Fragments).toEqual([{
    Bases: 0, Mass: 0, Degrade: 0, Dye: 'Xylene cyanol',
    AspectRatio: 1, Color: [0.5, 0.5, 0.5], Aggregate: [1],
  }]);
});
