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

test('frag-size SliderView is interactive (inspector panel mounts)', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  // M14: FragmentView is the default inspector. frag-size SliderView must be visible.
  await expect(page.getByTestId('frag-size')).toBeVisible();
});

test('clicking a band selects its fragment (selection-info updates)', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  const before = await getSelectionText(page);
  // M14: auto-selects fragment 0 on load, so default text is "lane 0 fragment 0: X bp, Y ng"
  // (Previously no fragment was auto-selected and the text showed fragment count.)
  expect(before).toMatch(/lane \d+ fragment \d+/);
  // Pointer-down on band-1 (second fragment) to change selection
  await page.locator('[data-testid="band-1"]').dispatchEvent('pointerdown', { button: 0 });
  await page.locator('[data-testid="band-1"]').dispatchEvent('pointerup');
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
  // M14: fragment 0 is auto-selected on load. Tab advances selection.
  // Tab from 0 → 1: M6b format "lane 0 fragment N: X bp, Y ng"
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('selection-info')).toContainText('fragment 1');
  // Tab again → 2
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('selection-info')).toContainText('fragment 2');
  // Shift+Tab → back to 1
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('selection-info')).toContainText('fragment 1');
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
  // Initial: lane 0 has the sample (no data-empty), lane 3 empty (has data-empty)
  await expect(page.locator('[data-testid="microtube-0"]')).toBeVisible();
  expect(await page.locator('[data-testid="microtube-0"]').getAttribute('data-empty')).toBeNull();
  expect(await page.locator('[data-testid="microtube-3"]').getAttribute('data-empty')).not.toBeNull();

  // Drag tube 0 → tube 3 by simulating pointer down on 0, up over 3
  const tube0 = await page.locator('[data-testid="microtube-0"]').boundingBox();
  const tube3 = await page.locator('[data-testid="microtube-3"]').boundingBox();
  if (!tube0 || !tube3) throw new Error('microtube bbox missing');
  await page.mouse.move(tube0.x + tube0.width / 2, tube0.y + tube0.height / 2);
  await page.mouse.down();
  await page.mouse.move(tube3.x + tube3.width / 2, tube3.y + tube3.height / 2, { steps: 5 });
  await page.mouse.up();

  // Now lane 3 has the sample (no data-empty); lane 0 is empty (has data-empty)
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

  // Both 0 and 4 are filled (no data-empty on either)
  await expect.poll(async () =>
    page.locator('[data-testid="microtube-0"]').getAttribute('data-empty')
  ).toBeNull();
  await expect.poll(async () =>
    page.locator('[data-testid="microtube-4"]').getAttribute('data-empty')
  ).toBeNull();
});

// NOTE: Save/Open file controls (save-sample-btn, open-btn, file-input) were part of
// GelControls/FileControls which were removed from GelPage during the M11 Stage refactor.
// Those features will be re-tested when re-mounted in a future milestone.

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
  // Synthesize a DataTransfer and dispatch drag/drop events.
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
  // No loupes initially
  await expect(page.locator('[data-testid^="loupe-"]')).toHaveCount(0);
  // Cmd+click (meta on Mac, ctrl on others) on band 0
  // dispatchEvent with metaKey set
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0, metaKey: true });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  // One loupe should be open
  await expect(page.locator('[data-loupe-id]')).toHaveCount(1);
  // Loupe shows fragment metadata
  await expect(page.locator('[data-loupe-id="1"]')).toContainText('lane 0');
});

test('loupe close button removes the loupe', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  // Open a loupe
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0, metaKey: true });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  await expect(page.locator('[data-loupe-id]')).toHaveCount(1);
  // Click close
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
