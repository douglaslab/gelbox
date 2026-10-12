/**
 * loupe.spec.ts — Loupe synthetic-sample render goldens (M26a)
 *
 * Proves that cmd+clicking a gel band opens a loupe showing real particles
 * (from MolecularSim via SampleSimCanvas), not a blank box or SVG dots.
 *
 * The loupe canvas is animated (rAF), so goldens are made deterministic via
 * the same freeze hook used by sample-molecular-render.spec.ts:
 *   window.__molsimFreezeAfterTicks = 60
 * Once the sim has ticked 60 frames it stops advancing and sets
 *   data-frozen="1"
 * on the canvas element. We wait for that attribute before snapshotting.
 *
 * IMPORTANT: The loupe anchor is derived from e.clientX/clientY in
 * GelOverlay.onBandPointerDown. Using dispatchEvent('pointerdown', {metaKey})
 * yields clientX=0/clientY=0 → anchor at (0,0) → no bands picked →
 * empty sample (0 particles). Instead we use page.mouse + page.keyboard.down
 * so the browser synthesises a real pointer event with correct coordinates.
 *
 * DOM hooks (M26a):
 *   [data-testid^="loupe-"]        — the loupe popup container
 *   [data-testid^="loupe-canvas-"] — the SampleSimCanvas inside the loupe
 *   [data-testid^="loupe-frame-"]  — focus/keyboard/drag frame
 *   [data-loupe-id]                — alternate container selector used in gel-page.spec.ts
 *
 * snapshotPathTemplate (from playwright.config.ts):
 *   {testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}
 * → tests/visual/loupe.spec.ts-snapshots/loupe-idle-chromium-webgpu.png
 *   tests/visual/loupe.spec.ts-snapshots/loupe-idle-chromium-webgl2.png
 */

import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Backend wiring — identical to every other visual spec in this suite.
// ---------------------------------------------------------------------------

test.beforeEach(async ({ page }, testInfo) => {
  const backend = testInfo.project.name === 'chromium-webgl2' ? 'webgl2' : 'webgpu';
  await page.addInitScript((b: string) => { localStorage.setItem('gelBackend', b); }, backend);
  // Freeze the loupe's MolecularSim after a fixed tick count so the animated
  // canvas reaches a stable, deterministic frame before snapshotting.
  await page.addInitScript(() => {
    (window as unknown as { __molsimFreezeAfterTicks?: number }).__molsimFreezeAfterTicks = 60;
  });
});

function maybeSkipLinuxWebGPU(testInfo: import('@playwright/test').TestInfo) {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the gel page at a fixed viewport. */
async function gotoGel(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');
  await expect(page.locator('[data-testid="band-0"]')).toBeVisible();
}

/**
 * Cmd-click band-0 to open a loupe. Uses page.mouse + page.keyboard.down
 * (not dispatchEvent) so the browser synthesises a real PointerEvent with
 * correct clientX/clientY — which GelOverlay uses to compute the gel anchor.
 * Returns the loupe canvas locator (testid "loupe-canvas-1").
 */
async function openLoupe(page: Page) {
  const band0 = page.locator('[data-testid="band-0"]');
  const box = await band0.boundingBox();
  if (!box) throw new Error('band-0 bounding box missing');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.keyboard.down('Meta');
  await page.mouse.down();
  await page.mouse.up();
  await page.keyboard.up('Meta');
  // Wait for the loupe container to appear.
  await expect(page.locator('[data-loupe-id]')).toHaveCount(1);
  const canvas = page.locator('[data-testid="loupe-canvas-1"]');
  await expect(canvas).toBeVisible();
  return canvas;
}

/** Wait for the loupe's sim to reach the deterministic frozen frame. */
async function waitForFrozen(canvas: ReturnType<Page['locator']>): Promise<void> {
  await expect(canvas).toHaveAttribute('data-frozen', '1', { timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('cmd+click on a band opens a loupe showing live particles', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);

  await gotoGel(page);

  // No loupes before the click.
  await expect(page.locator('[data-testid^="loupe-"]')).toHaveCount(0);

  const canvas = await openLoupe(page);

  // The loupe popup is visible.
  await expect(page.locator('[data-loupe-id]')).toHaveCount(1);
  // The canvas inside the loupe reaches data-frozen="1" once particles have
  // settled — this confirms the sim is running (not a blank box).
  await waitForFrozen(canvas);
  // Confirm at least one particle is alive (real sample, not empty).
  await expect.poll(async () => Number(await canvas.getAttribute('data-alive-count')))
    .toBeGreaterThan(0);
});

test('Escape closes the focused loupe', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);

  await gotoGel(page);
  await openLoupe(page);

  // Close the focused loupe with the native Escape key.
  await page.getByTestId('loupe-frame-1').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-loupe-id]')).toHaveCount(0);
});

test('loupe render golden', async ({ page }, testInfo) => {
  maybeSkipLinuxWebGPU(testInfo);

  await gotoGel(page);
  const canvas = await openLoupe(page);

  // Wait for the deterministic frozen frame before snapshotting.
  await waitForFrozen(canvas);

  await expect(canvas).toHaveScreenshot('loupe-idle.png', { maxDiffPixelRatio: 0.01 });
});
