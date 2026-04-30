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
  // After M6b the default text shows lane + fragment count, no "no selection"
  expect(before).toContain('fragments');
  // Pointer-down on the first band (highest bp, top of canvas)
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0 });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  const after = await getSelectionText(page);
  // M6b format: "lane N fragment M: X bp, Y ng"
  expect(after).toMatch(/lane \d+ fragment \d+/);
});

test('Tab key cycles selection forward', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  // Focus the overlay
  await page.getByTestId('gel-overlay').focus();
  // Tab from null → 0: M6b format "lane 0 fragment 0: X bp, Y ng"
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('selection-info')).toContainText('fragment 0');
  // Tab again → 1
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('selection-info')).toContainText('fragment 1');
  // Shift+Tab → back to 0
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('selection-info')).toContainText('fragment 0');
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

test('microtube drag moves sample to a new lane', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  // Initial: lane 0 has the sample, lane 3 empty
  await expect(page.locator('[data-testid="microtube-0"]')).toBeVisible();
  // Read initial fill (sample present = filled)
  const tube0Before = await page.locator('[data-testid="microtube-0"]').getAttribute('fill');
  expect(tube0Before).not.toBe('transparent');
  const tube3Before = await page.locator('[data-testid="microtube-3"]').getAttribute('fill');
  expect(tube3Before).toBe('transparent');

  // Drag tube 0 → tube 3 by simulating pointer down on 0, up over 3
  const tube0 = await page.locator('[data-testid="microtube-0"]').boundingBox();
  const tube3 = await page.locator('[data-testid="microtube-3"]').boundingBox();
  if (!tube0 || !tube3) throw new Error('microtube bbox missing');
  await page.mouse.move(tube0.x + tube0.width / 2, tube0.y + tube0.height / 2);
  await page.mouse.down();
  await page.mouse.move(tube3.x + tube3.width / 2, tube3.y + tube3.height / 2, { steps: 5 });
  await page.mouse.up();

  // Now lane 3 has the sample; lane 0 is empty
  await expect.poll(async () =>
    (await page.locator('[data-testid="microtube-3"]').getAttribute('fill')) ?? ''
  ).not.toBe('transparent');
  await expect.poll(async () =>
    (await page.locator('[data-testid="microtube-0"]').getAttribute('fill')) ?? ''
  ).toBe('transparent');
});

test('alt+microtube-drag clones the sample (both lanes filled)', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  const tube0 = await page.locator('[data-testid="microtube-0"]').boundingBox();
  const tube4 = await page.locator('[data-testid="microtube-4"]').boundingBox();
  if (!tube0 || !tube4) throw new Error('microtube bbox missing');
  await page.keyboard.down('Alt');
  await page.mouse.move(tube0.x + tube0.width / 2, tube0.y + tube0.height / 2);
  await page.mouse.down();
  await page.mouse.move(tube4.x + tube4.width / 2, tube4.y + tube4.height / 2, { steps: 5 });
  await page.mouse.up();
  await page.keyboard.up('Alt');

  // Both 0 and 4 are filled
  await expect.poll(async () =>
    (await page.locator('[data-testid="microtube-0"]').getAttribute('fill')) ?? ''
  ).not.toBe('transparent');
  await expect.poll(async () =>
    (await page.locator('[data-testid="microtube-4"]').getAttribute('fill')) ?? ''
  ).not.toBe('transparent');
});
