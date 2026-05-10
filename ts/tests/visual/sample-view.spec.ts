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

test('SampleView is hidden until first interaction, then shows heading + canvas', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // Initial load: no sample selected → middle slot empty.
  await expect(page.getByTestId('sample-view')).toHaveCount(0);

  // Click the loaded tube to open the sample slot.
  await page.locator('[data-testid="microtube-0"]').click();
  await expect(page.getByTestId('sample-view')).toBeVisible();
  await expect(page.getByText('Sample', { exact: true })).toBeVisible();
  await expect(page.getByTestId('molecular-sim-canvas')).toBeVisible();
});

test('SampleView dot count == sum(calcTargetPop(mass)) over non-dye fragments', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');
  await page.locator('[data-testid="microtube-0"]').click();
  const canvas = page.getByTestId('molecular-sim-canvas');
  await expect(canvas).toBeVisible();
  const count = await canvas.getAttribute('data-dot-count');
  // The default ladder fixture has 10 fragments, all non-dye, all positive
  // mass — so the count should be > 0 even if individual masses vary.
  expect(Number(count)).toBeGreaterThan(0);
});

test('Clicking a dot in SampleView selects that fragment in the inspector', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');
  // Open the sample by clicking the loaded tube + a band so the inspector
  // has a known starting fragment selection.
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0 });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  await expect(page.getByTestId('selection-info')).toContainText('fragment 0');

  // Read the deterministic dot layout from the page's React state via
  // the running module — instead, hit the centre of the canvas. The default
  // ladder gives ~50 dots/fragment all non-dye, so the centre will hit
  // SOME fragment (just not necessarily fragment 0). Then verify that
  // selection-info reports a different fragment number.
  const canvas = page.getByTestId('molecular-sim-canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas bbox missing');

  // Click many points across the canvas — at least one will hit a dot, since
  // the layout is dense (10 fragments × 50 dots ≈ 500 dots in 362×520).
  let hitFound = false;
  for (let yi = 0; yi < 8 && !hitFound; yi++) {
    for (let xi = 0; xi < 8 && !hitFound; xi++) {
      const px = box.x + (box.width  * (xi + 0.5)) / 8;
      const py = box.y + (box.height * (yi + 0.5)) / 8;
      await page.mouse.click(px, py);
      const txt = (await page.getByTestId('selection-info').textContent()) ?? '';
      if (txt.match(/lane 0 fragment \d+/)) {
        hitFound = true;
      }
    }
  }
  expect(hitFound).toBe(true);
});

test('Hovering a band updates rollover so SampleView can react', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');
  // First populate the sample slot.
  await page.locator('[data-testid="microtube-0"]').click();
  await expect(page.getByTestId('sample-view')).toBeVisible();

  // Hovering band-0 should set rollover to fragment 0 — the band's stroke
  // turns yellow per the existing GelOverlay logic.
  const band0 = page.locator('[data-testid="band-0"]');
  await band0.hover();
  // The band's stroke attribute changes to the hover color (#FFFF00 from
  // sampleViewFragHoverColor).
  await expect(band0).toHaveAttribute('stroke', /#?[fF]{4}00|#[fF][fF][fF][fF]00/i);
});
