import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const cases = JSON.parse(readFileSync('../reference/native/numerical/warp-cases.json', 'utf8'));
const refs = JSON.parse(readFileSync('../reference/native/numerical/warp-outputs.json', 'utf8'));

test('renderers upload native controls at fractional output resolution', async ({ page }, info) => {
  test.skip(process.platform === 'linux', 'Requires a real GPU backend');
  const input = cases.find((c: any) => c.id === 'smile-71-1-42');
  const reference = ['smile-71-1-42', 'damage-71-0.7-73', 'water-71-3.5-42']
    .map(id => refs.find((r: any) => r.id === id).warp);
  await page.goto('/#/gel');
  const actual = await page.evaluate(async ({ input, useGl }) => {
    const { createGelRenderer } = await import('/src/lib/gel/render.ts');
    const { createGlGelRenderer } = await import('/src/lib/gel/render-gl.ts');
    const gel = { width: input.width, height: input.height };
    const uploads: number[][] = [];
    let renderer, device: GPUDevice | undefined;
    if (useGl) {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) throw Error('Missing WebGL2');
      const original = gl.texSubImage2D.bind(gl);
      gl.texSubImage2D = ((...args: any[]) => {
        uploads.push(Array.from(args[8]));
        return (original as any)(...args);
      }) as typeof gl.texSubImage2D;
      renderer = createGlGelRenderer(gl, gel, input.ppu);
    } else {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) throw Error('Missing WebGPU');
      device = await adapter.requestDevice();
      const original = device.queue.writeTexture.bind(device.queue);
      device.queue.writeTexture = (...args) => {
        uploads.push(Array.from(args[1] as Uint8Array));
        return original(...args);
      };
      renderer = createGelRenderer(device, gel, input.ppu);
    }
    const [x1, y1, x2, y2] = input.rect;
    renderer.setBands([{
      rect: { x1, y1, x2, y2 }, smearAbove: 0, smearBelow: 0,
      smearBrightnessAbove: [0, 0], smearBrightnessBelow: [0, 0], flameHeight: 0,
      smileHeight: 1, smileExp: 1.7, blur: 0, brightness: 1, color: [1, 1, 1],
      randSeed: 42, wellDamage: .7, wellDamageRandSeed: 73, mass: 50, aggregate: 1, degrade: 0,
    }]);
    renderer.setGlobalWarp({ h2oDistort: true, randSeed: 42 });
    renderer.render();
    if (device) await device.queue.onSubmittedWorkDone();
    const dimensions = [renderer.output.width, renderer.output.height];
    renderer.destroy();
    device?.destroy();
    return { dimensions, uploads };
  }, { input, useGl: info.project.name === 'chromium-webgl2' });
  expect(actual.dimensions).toEqual([reference[2].width, reference[2].height]);
  expect(actual.uploads).toEqual(reference.map((r: any) => r.data));
});
