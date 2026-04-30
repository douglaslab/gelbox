import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  const backend = testInfo.project.name === 'chromium-webgl2' ? 'webgl2' : 'webgpu';
  await page.addInitScript((b: string) => { localStorage.setItem('gelBackend', b); }, backend);
});

async function getSelectionText(page: import('@playwright/test').Page) {
  return (await page.getByTestId('selection-info').textContent()) ?? '';
}

test('gel page boots with default ladder fixture and renders bands', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  await expect(page.getByTestId('gel-canvas')).toBeVisible();
  await expect(page.getByTestId('gel-overlay')).toBeVisible();
  // 10 fragments → at least 10 band rects (more if any fragment has aggregates; ladder has none)
  const rects = page.locator('[data-testid^="band-"]');
  await expect(rects).toHaveCount(10);
});

test('voltage slider changes (sliders are interactive)', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  // Find the voltage slider by label
  const voltage = page.getByLabel('Voltage');
  await voltage.fill('140');
  // Value pill in the same group should reflect 140 V
  await expect(page.locator('text=140 V')).toBeVisible();
});

test('clicking a band selects its fragment (selection-info updates)', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  const before = await getSelectionText(page);
  expect(before).toContain('no selection');
  // Pointer-down on the first band (highest bp, top of canvas)
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0 });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  const after = await getSelectionText(page);
  expect(after).toContain('selected fragment');
});

test('Tab key cycles selection forward', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  // Focus the overlay
  await page.getByTestId('gel-overlay').focus();
  // Tab from null → 0
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('selection-info')).toContainText('selected fragment 0');
  // Tab again → 1
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('selection-info')).toContainText('selected fragment 1');
  // Shift+Tab → back to 0
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('selection-info')).toContainText('selected fragment 0');
});

test('alt+pointer-down clones the fragment (band count grows)', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  const rects = page.locator('[data-testid^="band-"]');
  await expect(rects).toHaveCount(10);
  // Alt-pointer-down on band 0 should clone its fragment
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0, altKey: true });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  await expect(rects).toHaveCount(11);
});
