import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  const backend = testInfo.project.name === 'chromium-webgl2' ? 'webgl2' : 'webgpu';
  await page.addInitScript((b: string) => { localStorage.setItem('gelBackend', b); }, backend);
});

function maybeSkipLinuxWebGPU(testInfo: import('@playwright/test').TestInfo) {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
}

test('Buffer + Dyes panel opens when a non-empty tube is clicked', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // Click the loaded tube — opens SampleSettingsView (no fragment selected).
  await page.locator('[data-testid="microtube-0"]').click();
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
  await expect(page.getByTestId('sample-settings-view')).toBeVisible();

  // Click on the dye-0 (Xylene) bar track at ~50% to set its mass to ~62 ng.
  const track = page.getByTestId('dye-row-0-slider-track');
  const box   = await track.boundingBox();
  if (!box) throw new Error('dye-0 track missing');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  // Dye fragment was lazy-created → 12 bands now (11 ladder + 1 dye).
  await expect(bands).toHaveCount(12);
});
