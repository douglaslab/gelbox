import { test, expect } from '@playwright/test';

// Independent renderer wiring detects missing global effects even though the
// simulation itself already changes band smear when H2O is selected.
test('running-buffer controls apply and clear global rendering effects', async ({ page, context }, testInfo) => {
  const backend = testInfo.project.name === 'chromium-webgl2' ? 'webgl2' : 'webgpu';
  await context.addInitScript(b => localStorage.setItem('gelBackend', b), backend);
  await page.setViewportSize({ width: 1365, height: 768 });
  await page.goto('/#/gel');
  await page.getByTestId('settings-button').click();
  // Compare just the renderer surface, excluding the independently drawn wells.
  await page.addStyleTag({ content: '[data-testid="gel-overlay"] { visibility: hidden }' });
  for (const preset of ['H2O', 'TBE'] as const) {
    const fixture = await page.evaluate(async preset => {
      const statePath = '/src/lib/gel/gelState.ts';
      const simPath = '/src/lib/sim/gelSim.ts';
      const bufferPath = '/src/lib/sim/buffer.ts';
      const { initialGelState } = await import(statePath);
      const { fragToBands } = await import(simPath);
      const { BUFFER_H2O, BUFFER_TBE } = await import(bufferPath);
      const state = initialGelState();
      state.ctx.gelBuffer = preset === 'H2O' ? BUFFER_H2O : BUFFER_TBE;
      const bands = state.samples.flatMap((sample: any, lane: number) => sample
        ? sample.fragments.flatMap((_: any, i: number) => fragToBands(sample, i, state.wellRects[lane], lane, state.ctx))
        : []);
      return { gelSize: state.gelSize, pixelsPerUnit: 1, bands,
        globalWarp: { h2oDistort: preset === 'H2O', randSeed: 1 } };
    }, preset);
    const reference = await context.newPage();
    await reference.route('**/fixtures/states/50-band.json*', route => route.fulfill({
      contentType: 'application/javascript', body: `export default ${JSON.stringify(fixture)}`,
    }));
    await reference.goto('/#/dev/multi');
    await expect(reference.getByTestId('renderer-status')).toHaveText('renderer: ready');
    await reference.getByTestId('gel-canvas').evaluate(canvas => {
      Object.assign(canvas.style, { width: '390px', height: '520px', border: '0' });
    });
    const expected = await reference.getByTestId('gel-canvas').screenshot();
    await page.getByTestId(`gel-buffer-view-preset-${preset}`).click();
    await expect.poll(async () => (await page.getByTestId('gel-canvas').screenshot()).equals(expected),
      { message: `${preset} app pixels must match independently configured renderer` }).toBe(true);
    await reference.close();
  }
});
