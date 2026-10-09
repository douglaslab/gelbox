import { expect, test } from '@playwright/test';

test('native window coordinates place sample and inspector without an extra brace gutter', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 768 });
  await page.goto('/#/gel');
  await page.getByTestId('band-0').click();
  expect(await page.getByTestId('stage-left').boundingBox()).toEqual({ x: 208, y: 124, width: 390, height: 520 });
  expect(await page.getByTestId('stage-middle').boundingBox()).toEqual({ x: 628, y: 124, width: 362, height: 520 });
  expect(await page.getByTestId('stage-right').boundingBox()).toEqual({ x: 1021, y: 124, width: 303, height: 520 });
  expect((await page.getByTestId('stage-brace').boundingBox())?.x).toBe(1021);
});

test('gel settings occupies the slot beside the gel', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 768 });
  await page.goto('/#/gel');
  await page.getByTestId('microtube-0').click();
  await page.getByTestId('settings-button').click();
  expect(await page.getByTestId('stage-right').boundingBox()).toEqual({ x: 628, y: 124, width: 303, height: 520 });
  await expect(page.getByTestId('sample-view')).toHaveCount(0);
});

test('small native windows retain fixed-size panels and allow horizontal access', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.goto('/#/gel');
  await page.getByTestId('band-0').click();
  expect(await page.getByTestId('stage-left').boundingBox()).toEqual({ x: 8, y: 64, width: 390, height: 520 });
  await expect(page.getByTestId('stage-middle')).toBeAttached();
  await expect(page.getByTestId('stage-right')).toBeAttached();
  await page.getByTestId('stage-right').scrollIntoViewIfNeeded();
  expect((await page.getByTestId('stage-right').boundingBox())?.width).toBe(303);
});

test('root opens native workspace with no extra chrome and no empty-tube icons', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 768 });
  await page.goto('/');
  await expect(page.getByTestId('gel-page')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Home', exact: true })).toHaveCount(0);
  await expect(page.getByRole('banner')).toHaveCount(0);
  await expect(page.getByRole('contentinfo')).toHaveCount(0);
  await expect(page.getByTestId('microtube-0').locator('img')).toHaveCount(1);
  await expect(page.getByTestId('microtube-1').locator('img')).toHaveCount(0);
  await expect(page.getByTestId('microtube-0')).not.toHaveAttribute('data-selected', 'true');
  await expect(page.locator('[data-testid^="gel-well-"]')).toHaveCount(7);
  await page.screenshot({ path: test.info().outputPath('native-shell-startup.png') });
});


test('native positive resize offsets preserve gel dimensions', async ({ page }) => {
  await page.setViewportSize({ width: 1565, height: 968 });
  await page.goto('/#/gel');
  expect(await page.getByTestId('stage-left').boundingBox()).toEqual({ x: 288, y: 224, width: 390, height: 520 });
  await page.setViewportSize({ width: 1365, height: 768 });
  await expect.poll(async () => page.getByTestId('stage-left').boundingBox()).toEqual({ x: 208, y: 124, width: 390, height: 520 });
});

test('selecting a tube or band closes gel settings and restores sample content', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 768 });
  await page.goto('/#/gel');
  await page.getByTestId('settings-button').click();
  await page.getByTestId('microtube-0').click();
  await expect(page.getByTestId('settings-button')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('sample-view')).toBeVisible();
  await page.getByTestId('settings-button').click();
  await page.getByTestId('band-0').click();
  await expect(page.getByTestId('fragment-view')).toBeVisible();
  await expect(page.getByTestId('sample-view')).toBeVisible();
});

test('empty panel slots do not cause horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.goto('/#/gel');
  expect(await page.getByTestId('gel-page').evaluate(el => el.scrollWidth)).toBe(800);
});

test('remembered dark theme does not change native workspace colors', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('gel:theme', 'dark'));
  await page.goto('/#/gel');
  const colors = await page.getByTestId('gel-page').evaluate(el => {
    const style = getComputedStyle(el);
    return [style.backgroundColor, style.getPropertyValue('--color-grid').trim()];
  });
  expect(colors).toEqual(['rgb(255, 255, 255)', '#e4e1d6']);
});

test('gel canvas has no CSS border that shrinks its scientific image', async ({ page }) => {
  await page.goto('/#/gel');
  expect(await page.getByTestId('gel-canvas').evaluate(el => getComputedStyle(el).borderLeftWidth)).toBe('0px');
});
