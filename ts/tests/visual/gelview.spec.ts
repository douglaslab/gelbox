import { expect, test } from '@playwright/test';

test('Settings button toggles inspectorMode in state', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  const btn = page.getByTestId('settings-button');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveAttribute('aria-pressed', 'false');

  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'true');

  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'false');
});

test('Microtube row uses PNG icons for samples', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  const tube0 = page.getByTestId('microtube-0');
  await expect(tube0).toBeVisible();
  await expect(tube0.locator('img')).toBeVisible();
});

test('Hovering a band sets rollover stroke (yellow)', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // Wait for bands to render
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(10);

  // React's onPointerEnter is synthesized from pointerover (which bubbles).
  // Use Playwright locator.dispatchEvent which fires at the element and lets
  // React's root delegation pick it up.
  await page.locator('[data-testid="band-9"]').dispatchEvent('pointerover');
  await page.waitForTimeout(50);
  const stroke = await page.locator('[data-testid="band-9"]').getAttribute('stroke');
  expect(stroke?.toUpperCase()).toBe('#FFFF00');
});
