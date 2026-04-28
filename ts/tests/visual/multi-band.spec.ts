import { test, expect } from '@playwright/test';

test('50-band canonical scene with overcook — golden frame', async ({ page }) => {
  test.skip(process.platform === 'linux', 'WebGPU adapter not available on Linux GitHub runners; revisit when M4 lands WebGL2 fallback');
  await page.goto('/#/dev/multi');
  await expect(page.getByTestId('renderer-status')).toHaveText('renderer: ready');
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
  const canvas = page.getByTestId('gel-canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveScreenshot('multi-band-canvas.png', {
    maxDiffPixelRatio: 0.02,
  });
});
