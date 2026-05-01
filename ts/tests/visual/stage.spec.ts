import { expect, test } from '@playwright/test';

test('Stage renders three panel slots with brace at LAYOUT coords (wide viewport)', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

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

  // Positions are measured relative to the stage origin so viewport offset
  // (e.g. scrollbar width, body padding) does not affect the assertions.
  const stageBox  = await stage.boundingBox();
  const stageX    = stageBox?.x ?? 0;
  const stageY    = stageBox?.y ?? 0;

  // Left slot at LAYOUT.gelTopLeft = (208, 124)
  const leftBox = await leftSlot.boundingBox();
  expect((leftBox?.x ?? 0) - stageX).toBeCloseTo(208, 0);
  expect((leftBox?.y ?? 0) - stageY).toBeCloseTo(124, 0);
  expect(leftBox?.width).toBeCloseTo(390, 0);
  expect(leftBox?.height).toBeCloseTo(520, 0);

  // Middle slot at gelTopLeft.x + gelSize.x + gelToSampleGutter = 208 + 390 + 30 = 628
  const middleBox = await middleSlot.boundingBox();
  expect((middleBox?.x ?? 0) - stageX).toBeCloseTo(628, 0);
  expect(middleBox?.width).toBeCloseTo(362, 0);

  // Right slot at middleX + sampleSize.x + sampleToBraceGutter + braceSize.x = 628 + 362 + 31 + 44 = 1065
  const rightBox = await rightSlot.boundingBox();
  expect((rightBox?.x ?? 0) - stageX).toBeCloseTo(1065, 0);
  expect(rightBox?.width).toBeCloseTo(303, 0);
});

test('Stage reflows to a single column on narrow viewports', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 1200 });
  await page.goto('/#/gel');

  const stage = page.getByTestId('stage');
  await expect(stage).toBeVisible();

  const leftSlot   = page.getByTestId('stage-left');
  const middleSlot = page.getByTestId('stage-middle');
  const rightSlot  = page.getByTestId('stage-right');
  const brace      = page.getByTestId('stage-brace');

  // Brace is hidden in narrow layout
  await expect(brace).toBeHidden();

  const leftBox   = await leftSlot.boundingBox();
  const middleBox = await middleSlot.boundingBox();
  const rightBox  = await rightSlot.boundingBox();

  // Each panel below the previous (Y increases monotonically)
  expect(middleBox?.y ?? 0).toBeGreaterThan(leftBox?.y ?? 0);
  expect(rightBox?.y ?? 0).toBeGreaterThan(middleBox?.y ?? 0);
});
