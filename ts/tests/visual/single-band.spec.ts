import { test, expect } from '@playwright/test';

test('single canonical band — golden frame', async ({ page }) => {
  await page.goto('/#/dev');
  await expect(page.getByTestId('renderer-status')).toHaveText('renderer: ready');
  // Wait one rAF so the GPU command has actually rendered before screenshot
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
  const canvas = page.getByTestId('gel-canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveScreenshot('single-band-canvas.png', {
    maxDiffPixelRatio: 0.02,
  });
});
