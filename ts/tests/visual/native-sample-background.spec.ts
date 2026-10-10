import {test, expect} from '@playwright/test';

test('sample background uses native framebuffer RGB in idle, hover and pressed states', async ({page}, info) => {
  await page.addInitScript(backend => {
    localStorage.setItem('gelBackend', backend);
    (window as any).__molsimFreezeAfterTicks = 0;
  }, info.project.name.endsWith('webgl2') ? 'webgl2' : 'webgpu');
  await page.goto('/#/gel');
  await page.getByTestId('microtube-0').click();
  const canvas = page.getByTestId('molecular-sim-canvas');
  await expect(canvas).toHaveAttribute('data-frozen','1');
  const contextType = info.project.name.endsWith('webgl2') ? 'webgl2' : 'webgpu';
  expect(await canvas.evaluate((el,type) => (el as HTMLCanvasElement).getContext(type) !== null, contextType)).toBe(true);
  async function pixel() {
    const png = await canvas.screenshot();
    return page.evaluate(async bytes => {
      const image = await createImageBitmap(new Blob([new Uint8Array(bytes)], {type:'image/png'}));
      const c = new OffscreenCanvas(image.width,image.height), ctx = c.getContext('2d')!;
      ctx.drawImage(image,0,0); image.close();
      return Array.from(ctx.getImageData(100,100,1,1).data).slice(0,3);
    }, [...png]);
  }
  // Layout.h F1F1F2; recorded native replay background is within one byte.
  for (const [state,scale] of [['idle',1],['hover',0.97],['pressed',0.9]] as const) {
    if (state==='hover') await canvas.hover();
    if (state==='pressed') await page.mouse.down();
    const rgb = await pixel();
    for (let i=0;i<3;i++) expect.soft(Math.abs(rgb[i]-[241,241,242][i]*scale),state).toBeLessThanOrEqual(1);
  }
  await page.mouse.up();
});
