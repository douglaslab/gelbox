import {test, expect} from '@playwright/test';

test('native sample fade-in, edit timing, hover slowdown and loupe preroll', async ({page}, info) => {
  await page.addInitScript(backend => localStorage.setItem('gelBackend', backend), info.project.name.endsWith('webgl2') ? 'webgl2' : 'webgpu');
  await page.goto('/#/gel');
  await expect(page.getByTestId('microtube-0')).toBeVisible();
  await page.evaluate(async () => {
    const path = '/src/lib/sim/molecularSimEngine.ts';
    const {MolecularSim} = await import(/* @vite-ignore */ path);
    const w = window as any;
    w.__molsimFreezeAfterTicks = 0;
    w.__timing = {ticks: [], prerolls: [], prerollStartingCounts: []};
    const tick = MolecularSim.prototype.tick, preroll = MolecularSim.prototype.preroll;
    MolecularSim.prototype.tick = function(bullet: boolean) { w.__timing.ticks.push(bullet); return tick.call(this, bullet); };
    MolecularSim.prototype.preroll = function(n?: number) { w.__timing.prerolls.push(n ?? 100); w.__timing.prerollStartingCounts.push(this.parts.length); return preroll.call(this, n); };
  });
  await page.getByTestId('microtube-0').click();
  const canvas = page.getByTestId('molecular-sim-canvas');
  await expect(canvas).toHaveAttribute('data-frozen', '1');
  await expect(canvas).toHaveAttribute('data-alive-count', '0');
  expect(await page.evaluate(() => (window as any).__timing.prerolls)).toEqual([]);
  await canvas.hover();
  await page.evaluate(() => { (window as any).__molsimFreezeAfterTicks = 3; });
  await expect.poll(() => page.evaluate(() => (window as any).__timing.ticks.length)).toBe(3);
  expect(await page.evaluate(() => (window as any).__timing.ticks)).toEqual([true,true,true]);
  await page.mouse.move(1,1);
  await page.evaluate(() => { (window as any).__molsimFreezeAfterTicks = 6; });
  await expect.poll(() => page.evaluate(() => (window as any).__timing.ticks.length)).toBe(6);
  expect(await page.evaluate(() => (window as any).__timing.ticks.slice(3))).toEqual([false,false,false]);
  await canvas.hover();
  await page.mouse.down();
  await page.mouse.move(1,1);
  await page.evaluate(() => { (window as any).__molsimFreezeAfterTicks = 9; });
  await expect.poll(() => page.evaluate(() => (window as any).__timing.ticks.length)).toBe(9);
  expect(await page.evaluate(() => (window as any).__timing.ticks.slice(6))).toEqual([true,true,true]);
  await page.mouse.up();
  await page.evaluate(() => { (window as any).__molsimFreezeAfterTicks = 12; });
  await expect.poll(() => page.evaluate(() => (window as any).__timing.ticks.length)).toBe(12);
  expect(await page.evaluate(() => (window as any).__timing.ticks.slice(9))).toEqual([false,false,false]);
  // Native ordinary sample edits must not invoke preroll.
  await page.evaluate(() => { (window as any).__molsimFreezeAfterTicks = 0; });
  await page.getByRole('button', {name: 'New species', exact: true}).click();
  expect(await page.evaluate(() => (window as any).__timing.prerolls)).toEqual([]);
  await page.getByTestId('band-0').click({force: true, modifiers:['Meta']});
  await expect(page.locator('[data-testid^="loupe-canvas-"]')).toBeVisible();
  const prerolls = await page.evaluate(() => (window as any).__timing.prerolls as number[]);
  // Development StrictMode remounts the engine; every detail update uses 100 ticks.
  expect(prerolls.length).toBeGreaterThan(0);
  expect(prerolls.every(n => n === 100)).toBe(true);
  await page.getByRole('button', {name: 'New species', exact: true}).click();
  await expect.poll(() => page.evaluate(() => (window as any).__timing.prerolls.length)).toBeGreaterThan(prerolls.length);
  expect(await page.evaluate(() => (window as any).__timing.prerollStartingCounts.every((n: number) => n === 0))).toBe(true);
});
