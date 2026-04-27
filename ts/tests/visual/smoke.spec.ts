import { test, expect } from '@playwright/test';

test('home page renders title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Gelbox');
});
