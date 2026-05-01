import { expect, test } from '@playwright/test';

test('Species panel renders with header + well + palette + 5 sliders', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  await expect(page.getByTestId('fragment-view')).toBeVisible();
  await expect(page.getByText('Species', { exact: true })).toBeVisible();

  await expect(page.getByTestId('frag-size')).toBeVisible();
  await expect(page.getByTestId('frag-mass')).toBeVisible();
  await expect(page.getByTestId('frag-aspect')).toBeVisible();
  await expect(page.getByTestId('frag-aggregate')).toBeVisible();
  await expect(page.getByTestId('frag-degrade')).toBeVisible();

  await expect(page.getByTestId('fragment-well')).toBeVisible();
  await expect(page.getByTestId('fragment-palette')).toBeVisible();
});

test('Inspector defaults to Species not "Gel" heading', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  const inspector = page.getByTestId('inspector-panel');
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText('Species');
});

test('Clicking a palette swatch updates the fragment color', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  await page.getByTestId('fragment-palette-swatch-1').click();
  await expect(page.getByTestId('fragment-palette-swatch-1')).toHaveAttribute('aria-pressed', 'true');
});

test('Settings gear button switches inspector to "Gel" stub', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  await expect(page.getByTestId('fragment-view')).toBeVisible();
  await page.getByTestId('settings-button').click();

  const inspector = page.getByTestId('inspector-panel');
  await expect(inspector).toContainText('Gel');
  await expect(page.getByTestId('fragment-view')).toBeHidden();
});
