import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }, info) => {
  await page.addInitScript(backend => localStorage.setItem('gelBackend', backend), info.project.name.includes('webgl2') ? 'webgl2' : 'webgpu');
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');
});
test('Meta preview follows the gel without stealing focus or adding a ring', async ({ page }) => {
  const overlay = page.getByTestId('gel-overlay'); await overlay.focus();
  const band = (await page.getByTestId('band-0').boundingBox())!;
  const x = band.x + band.width / 2, y = band.y + band.height / 2;
  await page.mouse.move(x, y); await expect(page.getByTestId('hover-loupe')).toHaveCount(0);
  await page.keyboard.down('Meta');
  const preview = page.getByTestId('hover-loupe'), frame = page.getByTestId('hover-loupe-frame');
  await expect(preview).toBeVisible(); await expect(overlay).toBeFocused();
  expect((await frame.boundingBox())!.x).toBeCloseTo(x + 85.5, 1);
  expect((await frame.boundingBox())!.y).toBeCloseTo(y - 85.5, 1);
  await expect(preview.locator('circle')).toHaveCount(0);
  await expect(page.locator('[data-loupe-id]')).toHaveCount(0);
  const canvas = page.getByTestId('hover-loupe-canvas');
  await expect.poll(async () => Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
  await page.evaluate(() => new Promise<void>(resolve => { let n = 0; const tick = () => ++n === 30 ? resolve() : requestAnimationFrame(tick); requestAnimationFrame(tick); }));
  const before = await canvas.screenshot();
  await page.evaluate(() => new Promise<void>(resolve => { let n = 0; const tick = () => ++n === 30 ? resolve() : requestAnimationFrame(tick); requestAnimationFrame(tick); }));
  expect(await canvas.screenshot()).toEqual(before);
  await expect(preview).toHaveScreenshot('hover-preview.png', { maxDiffPixels: 20 });
  await page.mouse.move(x + 7, y + 9);
  expect((await frame.boundingBox())!.x).toBeCloseTo(x + 7 + 85.5, 1);
  await page.keyboard.up('Meta'); await expect(preview).toHaveCount(0);
});
test('Meta-L toggle persists after key release; blank gel, exit and frame hits obey native rollover', async ({ page }) => {
  const g = (await page.getByTestId('gel-overlay').boundingBox())!;
  const x = g.x + 230, y = g.y + 300;
  await page.mouse.move(x, y); await page.keyboard.press('Meta+l');
  const preview = page.getByTestId('hover-loupe'), frame = page.getByTestId('hover-loupe-frame');
  await expect(preview).toBeVisible();
  // Native preview wedge is visible but not pickable; it must follow through it.
  await page.mouse.move(x + 40, y); await expect(frame).toBeVisible();
  expect((await frame.boundingBox())!.x).toBeCloseTo(x + 40 + 85.5, 1);
  const f = (await frame.boundingBox())!;
  await page.mouse.move(f.x + 20, f.y + 40); await expect(preview).toHaveCount(0);
  await page.mouse.move(x, y); await expect(preview).toBeVisible();
  await page.mouse.move(0, 0); await expect(preview).toHaveCount(0);
  await page.mouse.move(x, y); await expect(preview).toBeVisible();
  await page.keyboard.press('Meta+l'); await expect(preview).toHaveCount(0);
});
test('persistent creation replaces preview and browser blur clears transient modifier state', async ({ page }) => {
  const g = (await page.getByTestId('gel-overlay').boundingBox())!;
  const x = g.x + 220, y = g.y + 300;
  await page.mouse.move(x, y); await page.keyboard.down('Meta');
  await expect(page.getByTestId('hover-loupe')).toBeVisible();
  await page.mouse.down(); await expect(page.getByTestId('hover-loupe')).toHaveCount(0);
  await page.mouse.move(x + 20, y + 10); await page.mouse.up(); await page.keyboard.up('Meta');
  await expect(page.getByTestId('loupe-frame-1')).toBeFocused();
  await expect(page.locator('[data-loupe-id]')).toHaveCount(1);
  await page.mouse.move(g.x + 20, g.y + 200); await page.keyboard.down('Meta');
  await expect(page.getByTestId('hover-loupe')).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.getByTestId('hover-loupe')).toHaveCount(0);
  await page.keyboard.up('Meta'); await expect(page.getByTestId('loupe-frame-1')).toBeVisible();
});
test('sample import refreshes preview, document replacement recreates it and keeps the toggle', async ({ page }) => {
  const g = (await page.getByTestId('gel-overlay').boundingBox())!;
  const b = (await page.getByTestId('band-0').boundingBox())!;
  const x = b.x + b.width / 2 + g.width / 7, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.keyboard.press('Meta+l');
  const preview = page.getByTestId('hover-loupe'), canvas = page.getByTestId('hover-loupe-canvas');
  await expect(preview).toBeVisible();
  await expect(canvas).toHaveAttribute('data-alive-count', '0');
  await page.getByTestId('file-input').setInputFiles('../reference/native/files/1kbladder.xml');
  await expect(preview).toBeVisible();
  await expect.poll(async () => Number(await canvas.getAttribute('data-alive-count'))).toBeGreaterThan(0);
  await canvas.evaluate(el => el.setAttribute('data-old-preview', '1'));
  await page.getByTestId('file-input').setInputFiles('../reference/native/files/ladder-after-selection.gel.json');
  await expect(preview).toBeVisible();
  await expect(canvas).not.toHaveAttribute('data-old-preview', '1');
  await expect(canvas).toHaveAttribute('data-alive-count', '0');
  const next = (await page.getByTestId('gel-overlay').boundingBox())!;
  await page.mouse.move(next.x + 200, next.y + 300); await expect(preview).toBeVisible();
});
test('ordinary down preserves the snapshot until a drag edit refresh; cancel clears it', async ({ page }) => {
  const b = (await page.getByTestId('band-3').boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.keyboard.press('Meta+l');
  const preview = page.getByTestId('hover-loupe'); await expect(preview).toBeVisible();
  await page.mouse.down(); await expect(preview).toBeVisible();
  await page.mouse.move(x, y + 20); await expect(preview).toHaveCount(0);
  await page.mouse.up(); await expect(preview).toHaveCount(0);
  await page.mouse.move(x + 2, y + 20); await expect(preview).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 })));
  await expect(preview).toHaveCount(0);
});
test('native application setting and Meta-L share the hover toggle', async ({ page }) => {
  const settings = page.getByRole('button', { name: 'Application settings' });
  await settings.click();
  const toggle = page.getByRole('checkbox', { name: 'Loupe on hover' });
  await expect(toggle).not.toBeChecked(); await toggle.check();
  const g = (await page.getByTestId('gel-overlay').boundingBox())!;
  await page.mouse.move(g.x + 200, g.y + 300);
  await expect(page.getByTestId('hover-loupe')).toBeVisible();
  await page.keyboard.press('Meta+l'); await expect(toggle).not.toBeChecked();
  await expect(page.getByTestId('hover-loupe')).toHaveCount(0);
});

test('native Alt-clone refreshes preview before mouse-down clears rollover', async ({ page }) => {
  const b = (await page.getByTestId('band-3').boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.keyboard.press('Meta+l');
  await page.keyboard.down('Alt');
  const preview = page.getByTestId('hover-loupe'); await expect(preview).toBeVisible();
  const count = await page.locator('[data-testid^="band-"]').count();
  await page.mouse.down();
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(count + 1);
  await expect(preview).toBeVisible();
  await page.mouse.move(x, y + 20); await expect(preview).toHaveCount(0);
  await page.mouse.up(); await page.keyboard.up('Alt');
});
test('right-create refreshes preview during the native mouse-down operation', async ({ page }) => {
  const g = (await page.getByTestId('gel-overlay').boundingBox())!;
  await page.mouse.move(g.x + 180, g.y + 300); await page.keyboard.press('Meta+l');
  const preview = page.getByTestId('hover-loupe'); await expect(preview).toBeVisible();
  const count = await page.locator('[data-testid^="band-"]').count();
  await page.mouse.down({ button: 'right' });
  await expect(page.locator('[data-testid^="band-"]')).toHaveCount(count + 1);
  await expect(preview).toBeVisible();
  await page.mouse.up({ button: 'right' });
});

test('Windows platform branch uses Control for preview and hover toggle',async({page})=>{
 // Exercise the platform branch on this Mac; this is not physical Windows QA.
 await page.evaluate(()=>Object.defineProperty(navigator,'platform',{configurable:true,value:'Win32'}));
 const band=(await page.getByTestId('band-0').boundingBox())!;
 await page.mouse.move(band.x+band.width/2,band.y+band.height/2);
 await page.keyboard.down('Control');await expect(page.getByTestId('hover-loupe')).toBeVisible();
 await page.keyboard.up('Control');await expect(page.getByTestId('hover-loupe')).toHaveCount(0);
 await page.keyboard.press('Control+l');await expect(page.getByTestId('hover-loupe')).toBeVisible();
 await page.keyboard.press('Control+l');await expect(page.getByTestId('hover-loupe')).toHaveCount(0);
});

test('Windows platform branch uses Control-R for native Render toggle',async({page})=>{
 await page.evaluate(()=>Object.defineProperty(navigator,'platform',{configurable:true,value:'Win32'}));
 await page.getByRole('button',{name:'Application settings'}).click();
 const render=page.getByRole('checkbox',{name:'Render',exact:true});await expect(render).toBeChecked();
 await page.keyboard.press('Control+r');await expect(render).not.toBeChecked();
 await page.keyboard.press('Control+r');await expect(render).toBeChecked();
});
