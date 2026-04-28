import { test, expect } from '@playwright/test';

test('50-band rAF loop holds <25ms/frame avg', async ({ page }) => {
  test.skip(process.platform === 'linux', 'WebGPU adapter not available on Linux GitHub runners; revisit when M4 lands WebGL2 fallback');
  await page.goto('/#/dev/perf');
  await expect(page.getByTestId('renderer-status')).toHaveText('renderer: ready');

  // Wait for the rolling window to fill (60 frames at ~60fps ≈ 1s; allow 5s for slow startups).
  await expect(async () => {
    const text = await page.getByTestId('frame-avg').textContent();
    expect(text).toMatch(/^avg-frame-ms: /);
  }).toPass({ timeout: 5000 });

  const text = await page.getByTestId('frame-avg').textContent();
  const m = text?.match(/^avg-frame-ms: ([\d.]+)/);
  expect(m, `frame-avg testid did not match expected format: ${text}`).not.toBeNull();
  const ms = parseFloat(m![1]);
  console.log(`50-band rAF avg frame time: ${ms.toFixed(2)} ms`);
  expect(ms, `Expected <25 ms/frame, got ${ms.toFixed(2)} ms`).toBeLessThan(25);
});
