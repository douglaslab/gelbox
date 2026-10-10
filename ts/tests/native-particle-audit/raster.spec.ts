import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const root = '../reference/native/modern/particle-scenes/';
const cases = JSON.parse(fs.readFileSync('../reference/native/numerical/mesh-cases.json', 'utf8'));
const meshes = JSON.parse(fs.readFileSync('../reference/native/numerical/mesh-outputs.json', 'utf8'));
const scenes = JSON.parse(fs.readFileSync(root + 'manifest.json', 'utf8')).cases;
for (const scale of [1, 2]) test.describe(`particle raster DPR${scale}`, () => {
  test.use({ viewport: { width: 400, height: 300 }, deviceScaleFactor: scale });
  test('native and web-generated meshes against native CGL pixels', async ({ page }, info) => {
    const backend = info.project.name.endsWith('webgl2') ? 'webgl2' : 'webgpu';
    await page.goto('/#/dev');
    await page.evaluate(async ({ backend, scale }) => {
      const { buildMoleculesMesh } = await import('/src/lib/sim/molecularSimMesh.ts');
      const canvas = document.createElement('canvas'); canvas.id = 'particle-probe';
      canvas.width = canvas.height = 64 * scale;
      canvas.style.cssText = 'position:fixed;left:0;top:0;width:64px;height:64px;z-index:999';
      document.body.append(canvas);
      let draw: (mesh: any) => void;
      if (backend === 'webgl2') {
        const { configureGl2Context } = await import('/src/lib/gpu/gl/context.ts');
        const { createGlMeshBatch } = await import('/src/lib/gpu/gl/meshBatch.ts');
        const { gl } = configureGl2Context(canvas);
        const batch = createGlMeshBatch(gl, { viewport: { width: 64, height: 64 }, blend: 'over' });
        draw = mesh => batch.draw({ framebuffer: null, width: canvas.width, height: canvas.height }, mesh,
          { clear: true, clearColor: [241 / 255, 241 / 255, 242 / 255, 1] });
      } else {
        const { requestDevice } = await import('/src/lib/gpu/device.ts');
        const { configureContext } = await import('/src/lib/gpu/context.ts');
        const { createMeshBatch } = await import('/src/lib/gpu/meshBatch.ts');
        const { device } = await requestDevice();
        const { context, format } = configureContext(canvas, device);
        const batch = createMeshBatch(device, { viewport: { width: 64, height: 64 }, blend: 'over', format });
        draw = mesh => {
          const encoder = device.createCommandEncoder();
          batch.draw(encoder, context.getCurrentTexture().createView(), mesh,
            { clear: true, clearColor: { r: 241 / 255, g: 241 / 255, b: 242 / 255, a: 1 }, callIdx: 0 });
          device.queue.submit([encoder.finish()]);
        };
      }
      (window as any).__drawParticle = (data: number[], scene: any, useWebMesh: boolean) => {
        const mesh = useWebMesh ? buildMoleculesMesh([scene.part], scene.selected ? 0 : null, scene.rollover ? 0 : null,
          { numCirclePartVertices: 32, multimerAdhereOverlapFrac: .1, outlineWidth: 4, selectColor: [0, 0, 0], hoverColor: [1, 1, 0] })
          : { data: new Float32Array(data), vertexCount: data.length / 6 };
        for (let i = 0; i < mesh.data.length; i += 6) { mesh.data[i] -= 68; mesh.data[i + 1] -= 68; }
        draw(mesh);
      };
    }, { backend, scale });
    const results = [];
    for (const scene of scenes.filter((s: any) => s.scale === scale)) for (const source of ['native', 'web']) {
      await page.evaluate(({ data, scene, web }) => (window as any).__drawParticle(data, scene, web),
        { data: meshes.find((r: any) => r.id === scene.mesh).data, scene: cases.find((c: any) => c.id === scene.mesh), web: source === 'web' });
      const png = await page.locator('#particle-probe').screenshot();
      await fs.promises.writeFile(info.outputPath(`${scene.id}-${source}.png`), png);
      const result = await page.evaluate(async ({ png, native, scale }) => {
        const decode = async (src: string) => {
          const im = new Image(); im.src = 'data:image/png;base64,' + src; await im.decode();
          if (im.width !== 64 * scale || im.height !== 64 * scale) throw Error('Wrong dimensions');
          const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
          const ctx = c.getContext('2d')!; ctx.drawImage(im, 0, 0); return ctx.getImageData(0, 0, c.width, c.height).data;
        };
        const [a, b] = await Promise.all([decode(native), decode(png)]);
        let different = 0, max = 0, absolute = 0;
        for (let i = 0; i < a.length; i++) if (i % 4 !== 3) {
          const delta = Math.abs(a[i] - b[i]); if (delta) { different++; max = Math.max(max, delta); absolute += delta; }
        }
        return { differentChannels: different, maxChannelDifference: max, absoluteChannelDifference: absolute };
      }, { png: png.toString('base64'), native: fs.readFileSync(root + scene.id + '.png').toString('base64'), scale });
      results.push({ id: scene.id, source, ...result });
    }
    await fs.promises.writeFile(info.outputPath('comparison.json'), JSON.stringify(results, null, 2));
    // This audit intentionally fails until native raster parity is established.
    expect(results.filter(r => r.differentChannels)).toEqual([]);
  });
});
