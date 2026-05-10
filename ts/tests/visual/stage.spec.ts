import { expect, test } from '@playwright/test';

test('Stage renders three panel slots with brace once a fragment is selected', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // After M18, the inspector + brace are gated on having something to show.
  // Select a band so the inspector mounts and the brace renders.
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0 });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');

  const stage = page.getByTestId('stage');
  await expect(stage).toBeVisible();

  const leftSlot   = page.getByTestId('stage-left');
  const middleSlot = page.getByTestId('stage-middle');
  const rightSlot  = page.getByTestId('stage-right');
  const brace      = page.getByTestId('stage-brace');

  await expect(leftSlot).toBeVisible();
  await expect(middleSlot).toBeVisible();
  await expect(rightSlot).toBeVisible();
  await expect(brace).toBeVisible();

  const stageBox  = await stage.boundingBox();
  const stageX    = stageBox?.x ?? 0;
  const stageY    = stageBox?.y ?? 0;

  // The C++ kLayout.gelTopLeft = (208, 124) targets a desktop window with
  // chrome above the canvas. In the browser, Stage uses PAD_X=32 / PAD_Y=60
  // (see Stage.tsx). Assertions reflect the browser layout — gel sizes
  // (390×520, 362, 303) come straight from LAYOUT; only the stage origin
  // padding differs.
  const PAD_X = 32;
  const PAD_Y = 60;
  const leftBox = await leftSlot.boundingBox();
  expect((leftBox?.x ?? 0) - stageX).toBeCloseTo(PAD_X, 0);
  expect((leftBox?.y ?? 0) - stageY).toBeCloseTo(PAD_Y, 0);
  expect(leftBox?.width).toBeCloseTo(390, 0);
  expect(leftBox?.height).toBeCloseTo(520, 0);

  // Middle = PAD_X + gelSize.x + gelToSampleGutter = 32 + 390 + 30 = 452
  const middleBox = await middleSlot.boundingBox();
  expect((middleBox?.x ?? 0) - stageX).toBeCloseTo(452, 0);
  expect(middleBox?.width).toBeCloseTo(362, 0);

  // Right = middleX + sampleSize.x + sampleToBraceGutter + braceSize.x
  //       = 452 + 362 + 31 + 44 = 889
  const rightBox = await rightSlot.boundingBox();
  expect((rightBox?.x ?? 0) - stageX).toBeCloseTo(889, 0);
  expect(rightBox?.width).toBeCloseTo(303, 0);
});

test.skip('Stage reflows to a single column on narrow viewports', async ({ page }) => {
  // The single-column reflow at narrow viewports was intentionally disabled
  // (see Stage.tsx — "Multi-column reflow / single-column mobile is
  // intentionally disabled"). Re-enable + re-add this test if/when the
  // narrow-viewport story is revived.
  await page.setViewportSize({ width: 800, height: 1200 });
  await page.goto('/#/gel');
});
