import { test, expect } from '@playwright/test';

test('home page renders title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Gelbox');
});

test('all three tabs are visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Gel' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Dev' })).toBeVisible();
});

test('navigating to /#/gel shows gel page heading', async ({ page }) => {
  await page.goto('/#/gel');
  await expect(page.getByRole('heading', { name: 'Gel' })).toBeVisible();
});

test('navigating to /#/dev shows dev page heading', async ({ page }) => {
  await page.goto('/#/dev');
  await expect(page.getByRole('heading', { name: 'Dev' })).toBeVisible();
});

test('dev page boots renderer', async ({ page }) => {
  await page.goto('/#/dev');
  await expect(page.getByTestId('renderer-status')).toHaveText('renderer: ready');
  const canvas = page.getByTestId('gel-canvas');
  await expect(canvas).toBeVisible();
});
