import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('native tube geometry at seven and twenty lanes', async ({ page }, info) => {
  await page.addInitScript(b => localStorage.setItem('gelBackend', b), info.project.name.includes('webgl2') ? 'webgl2' : 'webgpu');
  await page.setViewportSize({ width: 1365, height: 768 });
  await page.goto('/#/gel');
  const gel = (await page.getByTestId('gel-overlay').boundingBox())!;
  const tube = page.getByTestId('microtube-0');
  let b = (await tube.boundingBox())!, icon = (await tube.locator('img').boundingBox())!;
  expect(b.x - gel.x).toBeCloseTo(7.857, 1);
  expect(b.y - gel.y).toBeCloseTo(-59.714, 1);
  expect(b.y + b.height).toBeCloseTo(gel.y, 1);
  expect(icon.x - gel.x).toBeCloseTo(18, 1);
  expect(icon.y - gel.y).toBeCloseTo(-53, 1);
  expect(icon.width).toBeCloseTo(20, 1);
  expect(icon.height).toBeCloseTo(37.872, 1);

  if (info.project.name.includes('webgl2')) {
    // Inspect a compositor screenshot; direct GPU-to-2D copies are not reliable after presentation.
    await expect.poll(async () => {
      const png = (await page.getByTestId('gel-canvas').screenshot()).toString('base64');
      return page.evaluate(async data => {
        const image = new Image(); image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
        const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0);
        const p = ctx.getImageData(0, 0, 1, 1).data;
        return p[0] + p[1] + p[2];
      }, png);
    }).toBe(0);
    await page.screenshot({ path: info.outputPath('tubes-7.png') });
  }
  const native = JSON.parse(await readFile('../reference/native/files/ladder-after-selection.gel.json', 'utf8'));
  native.Gel.Samples = [native.Gel.Samples[0], ...Array(19).fill(null)];
  await page.getByRole('button', { name: 'Application settings' }).click();
  await page.getByTestId('file-input').setInputFiles({ name: 'twenty.gel.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(native)) });
  await expect(page.getByTestId('microtube-19')).toBeVisible();
  b = (await tube.boundingBox())!; icon = (await tube.locator('img').boundingBox())!;
  expect(b.width).toBeCloseTo(15.6, 1);
  expect(b.y - gel.y).toBeCloseTo(-22.375, 1);
  expect(icon.x - gel.x).toBeCloseTo(6, 1);
  expect(icon.y - gel.y).toBeCloseTo(-22, 1);
  expect(icon.width).toBeCloseTo(7.8, 1);
  if (info.project.name.includes('webgl2')) await page.screenshot({ path: info.outputPath('tubes-20.png') });
  // Native tubes no longer occupy the old 50px-high header hit area.
  await page.mouse.click(b.x + b.width / 2, gel.y - 40);
  await expect(page.getByTestId('sample-view')).toHaveCount(0);
  await page.mouse.click(b.x + b.width / 2, gel.y - 1);
  await expect(page.getByTestId('sample-view')).toHaveAttribute('data-lane-index', '0');
});
