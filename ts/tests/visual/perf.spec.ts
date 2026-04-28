import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  const backend = testInfo.project.name === 'chromium-webgl2' ? 'webgl2' : 'webgpu';
  await page.addInitScript((b: string) => {
    localStorage.setItem('gelBackend', b);
  }, backend);
});

test('50-band rAF loop holds avg frame time within budget', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  // Per-backend gate: WebGPU at <25ms (60fps target with headroom), WebGL2 at <33ms (30fps minimum).
  const gateMs = testInfo.project.name === 'chromium-webgl2' ? 33 : 25;

  await page.goto('/#/dev/perf');
  await expect(page.getByTestId('renderer-status')).toHaveText('renderer: ready');
  await expect(async () => {
    const text = await page.getByTestId('frame-avg').textContent();
    expect(text).toMatch(/^avg-frame-ms: /);
  }).toPass({ timeout: 5000 });
  const text = await page.getByTestId('frame-avg').textContent();
  const m = text?.match(/^avg-frame-ms: ([\d.]+)/);
  expect(m, `frame-avg testid did not match expected format: ${text}`).not.toBeNull();
  const ms = parseFloat(m![1]);
  console.log(`50-band rAF avg frame time (${testInfo.project.name}): ${ms.toFixed(2)} ms`);
  expect(ms, `Expected <${gateMs} ms/frame, got ${ms.toFixed(2)} ms`).toBeLessThan(gateMs);
});
