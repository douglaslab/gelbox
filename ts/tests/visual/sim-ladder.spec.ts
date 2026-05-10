import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  const backend = testInfo.project.name === 'chromium-webgl2' ? 'webgl2' : 'webgpu';
  await page.addInitScript((b: string) => { localStorage.setItem('gelBackend', b); }, backend);
});

test('1kb ladder — sim-driven golden frame', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/dev/sim');
  await expect(page.getByTestId('renderer-status')).toHaveText('renderer: ready');
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
  const canvas = page.getByTestId('gel-canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveScreenshot('sim-ladder-canvas.png', {
    // Loosened from 0.02 → 0.05 to cover macOS-vs-Linux antialiasing
    // variance the bigger regressions still trip.
    maxDiffPixelRatio: 0.05,
  });
});
