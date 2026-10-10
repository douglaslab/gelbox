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

test('Hovering a band uses the native species-colored rollover stroke', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // Wait for bands to render — the ladder fixture has 11 fragments.
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(11);

  // band-0 is the first (largest bp) fragment, sits at the top of the gel,
  // and isn't overlapped by lower bands' upward smear extensions. Use
  // .hover() so React's onPointerEnter fires through the synthesized
  // pointerover sequence.
  await page.locator('[data-testid="band-0"]').hover();
  await expect(page.locator('[data-testid="band-0"]'))
    .toHaveAttribute('stroke', '#333333');
});
