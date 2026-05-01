import { expect, test } from '@playwright/test';

test('Slider demo page mounts all three styles', async ({ page }) => {
  await page.goto('/#/dev/slider');

  await expect(page.getByTestId('slider-voltage')).toBeVisible();
  await expect(page.getByTestId('slider-welldmg')).toBeVisible();
  await expect(page.getByTestId('slider-graph')).toBeVisible();

  await expect(page.getByTestId('slider-voltage-handle')).toBeVisible();
  await expect(page.getByTestId('slider-voltage-icon-lo')).toBeVisible();
  await expect(page.getByTestId('slider-voltage-icon-hi')).toBeVisible();
});

test('Clicking the lo icon sets voltage slider to its minimum', async ({ page }) => {
  await page.goto('/#/dev/slider');

  await page.getByTestId('slider-voltage-icon-lo').click();
  await expect(page.getByTestId('slider-voltage')).toContainText('30 V');
});

test('Clicking the hi icon sets bar slider to its maximum', async ({ page }) => {
  await page.goto('/#/dev/slider');

  await page.getByTestId('slider-welldmg-icon-hi').click();
  await expect(page.getByTestId('slider-welldmg')).toContainText('1.00');
});
