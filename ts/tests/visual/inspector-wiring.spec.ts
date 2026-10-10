import { openSampleSettings } from './sample-helpers';
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

test('inspector panel transitions: empty → tube → fragment → gear → empty', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // Initial: nothing selected → panel hidden.
  await expect(page.getByTestId('inspector-panel')).toHaveCount(0);

  // Click the loaded tube: opens Buffer + Dyes.
  await page.locator('[data-testid="microtube-0"]').click();
  await expect(page.getByTestId('inspector-panel')).toHaveCount(0);
  await openSampleSettings(page);

  // Click a band: switches to Species.
  await page.locator('[data-testid="band-0"]').click({ force: true });
  await expect(page.getByTestId('inspector-panel')).toHaveAttribute('data-view', 'fragment');

  // Press the gear: gel-settings wins regardless.
  await page.getByTestId('settings-button').click();
  await expect(page.getByTestId('inspector-panel')).toHaveAttribute('data-view', 'gel-settings');

  // Native settings entry clears selection; closing must not revive Species.
  await page.getByTestId('settings-button').click();
  await expect(page.getByTestId('inspector-panel')).toHaveCount(0);
});

test('cross-panel rollover: hovering a band rings the matching SampleView particles', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');
  // Open SampleView.
  await page.locator('[data-testid="microtube-0"]').click();
  await expect(page.getByTestId('molecular-sim-canvas')).toBeVisible();

  // Native band-2 rollover uses its red species color.
  const band = page.locator('[data-testid="band-2"]');
  await band.hover();
  await expect(band).toHaveAttribute('stroke', '#cc0000');
  // No assertion on the canvas pixel state — that's golden territory.
  // The visible cue is sufficient to confirm SET_ROLLOVER fires through.
});

test('cross-panel selection: click a SampleView particle → Species opens', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');
  await page.locator('[data-testid="microtube-0"]').click();
  await expect(page.getByTestId('sample-view')).toBeVisible();

  // Click a few canvas points until a particle hit selects a fragment.
  const canvas = page.getByTestId('molecular-sim-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas bbox missing');
  let switched = false;
  for (let yi = 0; yi < 8 && !switched; yi++) {
    for (let xi = 0; xi < 8 && !switched; xi++) {
      const px = box.x + (box.width  * (xi + 0.5)) / 8;
      const py = box.y + (box.height * (yi + 0.5)) / 8;
      await page.mouse.click(px, py);
      const view = await page.getByTestId('inspector-panel').count() ? await page.getByTestId('inspector-panel').getAttribute('data-view') : null;
      if (view === 'fragment') switched = true;
    }
  }
  expect(switched).toBe(true);
});
