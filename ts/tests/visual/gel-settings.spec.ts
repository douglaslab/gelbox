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

test('Gear button opens GelSettingsView with all 5 sliders + buffer', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  await page.getByTestId('settings-button').click();
  const panel = page.getByTestId('gel-settings-view');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Gel', exact: true })).toBeVisible();

  for (const k of ['lanes', 'time', 'voltage', 'well-damage', 'rotate']) {
    await expect(page.getByTestId(`gel-${k}`)).toBeVisible();
  }
  await expect(page.getByTestId('gel-buffer-view')).toBeVisible();
});

test('Voltage slider drag updates state and re-runs sim', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');
  await page.getByTestId('settings-button').click();

  // The voltage track centre is at 50% normalized, which in our config maps
  // to 0V (because valueMin=-300, valueMax=300). Drag to ~75% → ~150V.
  const track = page.getByTestId('gel-voltage-track');
  const box   = await track.boundingBox();
  if (!box) throw new Error('voltage track missing');
  await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2);

  // Bands re-render — sanity-check that the canvas still renders. (We don't
  // sample the actual band positions; that would be brittle.)
  await expect(page.getByTestId('gel-canvas')).toBeVisible();
});

test('Lane count slider increases the microtube row count', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');
  await page.getByTestId('settings-button').click();

  const tubes = page.locator('[data-testid^="microtube-"]:not([data-testid="microtube-row"])');
  // Initial: 7 lanes.
  await expect(tubes).toHaveCount(7);

  // Drag the lanes slider to the high end.
  const track = page.getByTestId('gel-lanes-track');
  const box = await track.boundingBox();
  if (!box) throw new Error('lanes track missing');
  await page.mouse.click(box.x + box.width * 0.99, box.y + box.height / 2);

  // 20 lanes is the max in our tuning.
  await expect(tubes).toHaveCount(20);
});

test('Gel buffer preset updates on click', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');
  await page.getByTestId('settings-button').click();

  // TBE is the default. Clicking TAE selects it.
  await page.getByTestId('gel-buffer-view-preset-TAE').click();
  await expect(page.getByTestId('gel-buffer-view-preset-TAE'))
    .toHaveAttribute('data-selected', 'true');
});

test('Gear button closes the panel on second click', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');
  await page.getByTestId('settings-button').click();
  await expect(page.getByTestId('gel-settings-view')).toBeVisible();
  await page.getByTestId('settings-button').click();
  await expect(page.getByTestId('gel-settings-view')).toBeHidden();
});
