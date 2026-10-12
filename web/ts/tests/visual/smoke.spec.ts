import { test, expect } from '@playwright/test';

test('home page renders title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Gelbox');
});

test('engineering navigation remains available on dev routes', async ({ page }) => {
  await page.goto('/#/dev');
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Gel' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Dev' })).toBeVisible();
});

test('navigating to /#/gel shows gel page', async ({ page }) => {
  await page.goto('/#/gel');
  // The gel page mounts the three-panel Stage; check for the gel-page wrapper.
  await expect(page.getByTestId('gel-page')).toBeVisible();
});

test('navigating to /#/dev shows dev page heading', async ({ page }) => {
  await page.goto('/#/dev');
  await expect(page.getByRole('heading', { name: 'Dev' })).toBeVisible();
});

test('dev page boots renderer', async ({ page }) => {
  test.skip(process.platform === 'linux', 'WebGPU adapter not available on Linux GitHub runners; revisit when M4 lands WebGL2 fallback');
  await page.goto('/#/dev');
  await expect(page.getByTestId('renderer-status')).toHaveText('renderer: ready');
  const canvas = page.getByTestId('gel-canvas');
  await expect(canvas).toBeVisible();
});
