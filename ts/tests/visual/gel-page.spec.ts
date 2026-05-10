import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  const backend = testInfo.project.name === 'chromium-webgl2' ? 'webgl2' : 'webgpu';
  await page.addInitScript((b: string) => { localStorage.setItem('gelBackend', b); }, backend);
});

async function getSelectionText(page: import('@playwright/test').Page) {
  return (await page.getByTestId('selection-info').textContent()) ?? '';
}

// The default ladder fixture has 11 non-dye fragments → 11 bands.
const LADDER_FRAGMENT_COUNT = 11;

test('gel page boots with default ladder fixture and renders bands', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  await expect(page.getByTestId('gel-canvas')).toBeVisible();
  await expect(page.getByTestId('gel-overlay')).toBeVisible();
  const rects = page.locator('[data-testid^="band-"]');
  await expect(rects).toHaveCount(LADDER_FRAGMENT_COUNT);
});

test('frag-size SliderView is interactive once a fragment is selected', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  // After M18, FragmentView only mounts when a fragment is selected.
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0 });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  await expect(page.getByTestId('frag-size')).toBeVisible();
});

test('clicking a band selects its fragment (selection-info updates)', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  // Initial: no fragment selected → selection-info shows the lane summary.
  const before = await getSelectionText(page);
  expect(before).toMatch(/lane \d+: \d+ fragments/);
  // Click band-1 to select fragment 1.
  await page.locator('[data-testid="band-1"]').dispatchEvent('pointerdown', { button: 0 });
  await page.locator('[data-testid="band-1"]').dispatchEvent('pointerup');
  const after = await getSelectionText(page);
  expect(after).toMatch(/lane \d+ fragment \d+/);
});

test('Tab key cycles selection forward', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  // First select fragment 0 by clicking band-0 — Tab cycles within the lane.
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0 });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  await page.getByTestId('gel-overlay').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('selection-info')).toContainText('fragment 1');
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('selection-info')).toContainText('fragment 2');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('selection-info')).toContainText('fragment 1');
});

test('alt+pointer-down clones the fragment (band count grows)', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  const rects = page.locator('[data-testid^="band-"]');
  await expect(rects).toHaveCount(LADDER_FRAGMENT_COUNT);
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0, altKey: true });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  await expect(rects).toHaveCount(LADDER_FRAGMENT_COUNT + 1);
});

test('microtube drag moves sample to a new lane', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  await expect(page.locator('[data-testid="microtube-0"]')).toBeVisible();
  expect(await page.locator('[data-testid="microtube-0"]').getAttribute('data-empty')).toBeNull();
  expect(await page.locator('[data-testid="microtube-3"]').getAttribute('data-empty')).not.toBeNull();

  const tube0 = await page.locator('[data-testid="microtube-0"]').boundingBox();
  const tube3 = await page.locator('[data-testid="microtube-3"]').boundingBox();
  if (!tube0 || !tube3) throw new Error('microtube bbox missing');
  await page.mouse.move(tube0.x + tube0.width / 2, tube0.y + tube0.height / 2);
  await page.mouse.down();
  await page.mouse.move(tube3.x + tube3.width / 2, tube3.y + tube3.height / 2, { steps: 5 });
  await page.mouse.up();

  await expect.poll(async () =>
    page.locator('[data-testid="microtube-3"]').getAttribute('data-empty')
  ).toBeNull();
  await expect.poll(async () =>
    page.locator('[data-testid="microtube-0"]').getAttribute('data-empty')
  ).not.toBeNull();
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

  await expect.poll(async () =>
    page.locator('[data-testid="microtube-0"]').getAttribute('data-empty')
  ).toBeNull();
  await expect.poll(async () =>
    page.locator('[data-testid="microtube-4"]').getAttribute('data-empty')
  ).toBeNull();
});

test('Drag-drop a sample-shaped JSON loads it', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  await expect(page.getByTestId('gel-page')).toBeVisible();
  const samplePayload = {
    schema: 'gel-sample-v0',
    buffer: { tris: 44.5, borate: 44.5, acetate: 0, edta: 1 },
    fragments: [
      { bases: 9876, mass: 50, degrade: 0, dye: -1, aggregate: [], aspectRatio: 1, color: [1, 1, 1] },
    ],
  };
  const target = page.getByTestId('gel-page');
  await target.evaluate((el, payload) => {
    const dt = new DataTransfer();
    const file = new File([payload], 'dragged.json', { type: 'application/json' });
    dt.items.add(file);
    const dragOver = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt });
    el.dispatchEvent(dragOver);
    const drop = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
    el.dispatchEvent(drop);
  }, JSON.stringify(samplePayload));
  await expect(page.locator('[data-testid="band-0"]')).toBeVisible();
  await page.locator('[data-testid="band-0"]').click({ button: 'left' });
  await expect(page.getByTestId('selection-info')).toContainText('9876 bp');
});

test('cmd+click on a band opens a loupe popover', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  await expect(page.locator('[data-testid="band-0"]')).toBeVisible();
  await expect(page.locator('[data-testid^="loupe-"]')).toHaveCount(0);
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0, metaKey: true });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  await expect(page.locator('[data-loupe-id]')).toHaveCount(1);
  await expect(page.locator('[data-loupe-id="1"]')).toContainText('lane 0');
});

test('loupe close button removes the loupe', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0, metaKey: true });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  await expect(page.locator('[data-loupe-id]')).toHaveCount(1);
  await page.getByTestId('loupe-close-1').click();
  await expect(page.locator('[data-loupe-id]')).toHaveCount(0);
});

test('multiple cmd+clicks open multiple loupes', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0, metaKey: true });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  await page.locator('[data-testid="band-1"]').dispatchEvent('pointerdown', { button: 0, metaKey: true });
  await page.locator('[data-testid="band-1"]').dispatchEvent('pointerup');
  await expect(page.locator('[data-loupe-id]')).toHaveCount(2);
});
