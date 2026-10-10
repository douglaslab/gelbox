import { expect, test } from '@playwright/test';

// After M18, the inspector hides by default — Species ("fragment") view
// only mounts after a fragment is selected. Each test explicitly drives the
// state into the case it's checking.

test('Species panel renders with header + well + palette + 5 sliders', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // Select a fragment by clicking a band on the gel.
  await page.locator('[data-testid="band-0"]').click({ force: true });

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

test('Inspector shows Species view after a fragment is selected', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // Initially the inspector slot is empty (hidden).
  await expect(page.getByTestId('inspector-panel')).toHaveCount(0);

  // Selecting a fragment swaps the inspector to "Species".
  await page.locator('[data-testid="band-0"]').click({ force: true });

  const inspector = page.getByTestId('inspector-panel');
  await expect(inspector).toBeVisible();
  await expect(inspector).toHaveAttribute('data-view', 'fragment');
  await expect(inspector).toContainText('Species');
});

test('Clicking a palette swatch updates the fragment color', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // Open Species first.
  await page.locator('[data-testid="band-0"]').click({ force: true });

  await page.getByTestId('fragment-palette-swatch-1').click();
  await expect(page.getByTestId('fragment-palette-swatch-1')).toHaveAttribute('aria-pressed', 'true');
});

test('Settings gear button switches inspector to "Gel" view', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // Open Species so we have a non-empty inspector to swap from.
  await page.locator('[data-testid="band-0"]').click({ force: true });
  await expect(page.getByTestId('fragment-view')).toBeVisible();

  await page.getByTestId('settings-button').click();

  const inspector = page.getByTestId('inspector-panel');
  await expect(inspector).toHaveAttribute('data-view', 'gel-settings');
  await expect(page.getByTestId('fragment-view')).toBeHidden();
});
