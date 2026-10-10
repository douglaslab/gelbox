import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const cases = JSON.parse(fs.readFileSync('../reference/native/numerical/mesh-cases.json', 'utf8'));
const ids = ['whole-1-select-True-hover-False', 'whole-0.5-select-False-hover-True', 'multi-25-3-whole-0.5', 'narrow-25-3-whole-0.001-select-True'];
for (const scale of [1, 2]) test.describe(`molecular component DPR${scale}`, () => {
  test.use({ viewport: { width: 400, height: 300 }, deviceScaleFactor: scale });
  test('opaque shared canvas matches native particle pixels', async ({ page }, info) => {
    const backend = info.project.name.endsWith('webgl2') ? 'webgl2' : 'webgpu';
    await page.addInitScript(b => {
      localStorage.setItem('gelBackend', b);
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type: any, options: any) {
        const context = getContext.call(this, type, options);
        if (context) this.setAttribute('data-probe-context', type);
        return context;
      } as typeof getContext;
    }, backend);
    await page.goto('/#/dev');
    await page.evaluate(async () => {
      const { default: React } = await import('/node_modules/.vite/deps/react.js');
      const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
      const { GelProvider, useGelStore } = await import('/src/components/gel/GelContext.tsx');
      const { SampleSimCanvas } = await import('/src/components/sample/SampleSimCanvas.tsx');
      const { MolecularView } = await import('/src/lib/gel/molecularRuntime.ts');
      const { CinderRand } = await import('/src/lib/sim/rng.ts');
      const view = new MolecularView('reference', new CinderRand(1), { bounds: { x1: 0, y1: 0, x2: 200, y2: 200 } });
      let scene: any = { selected: false, rollover: false };
      const Fixture = () => {
        const store = useGelStore();
        // Control highlight input and a static engine snapshot; exercise the real
        // shared component, frame subscription, mesh builder and renderer.
        store.getMolecularHighlights = () => ({ selected: scene.selected ? 0 : null, rollover: scene.rollover ? 0 : null });
        return React.createElement(SampleSimCanvas, { view, viewKey: 'reference', width: 200, height: 200 });
      };
      const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;z-index:999'; document.body.append(host);
      createRoot(host).render(React.createElement(GelProvider, null, React.createElement(Fixture)));
      (window as any).__particleScene = (next: any) => { scene = next; view.sim.parts = [next.part]; };
    });
    const canvas = page.getByTestId('molecular-sim-canvas');
    await expect(canvas).toHaveAttribute('width', String(200 * scale));
    await expect(canvas).toHaveAttribute('data-probe-context', backend);
    for (const id of ids) {
      await page.evaluate(scene => (window as any).__particleScene(scene), cases.find((c: any) => c.id === id));
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(page.getByRole('alert')).toHaveCount(0);
      const png = await page.screenshot({ clip: { x: 68, y: 68, width: 64, height: 64 } });
      await fs.promises.writeFile(info.outputPath(id + '.png'), png);
      const native = fs.readFileSync(`../reference/native/modern/particle-scenes/${id}-${scale}.png`).toString('base64');
      const different = await page.evaluate(async ({ png, native }) => {
        const decode = async (src: string) => {
          const im = new Image(); im.src = 'data:image/png;base64,' + src; await im.decode();
          const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
          const ctx = c.getContext('2d')!; ctx.drawImage(im, 0, 0); return ctx.getImageData(0, 0, c.width, c.height).data;
        };
        const [a, b] = await Promise.all([decode(native), decode(png)]);
        if (a.length !== b.length) throw Error('Wrong dimensions');
        return a.reduce((count, value, i) => count + (i % 4 !== 3 && value !== b[i] ? 1 : 0), 0);
      }, { png: png.toString('base64'), native });
      expect(different, id).toBe(0);
      await expect(canvas).toHaveAttribute('data-probe-context', backend);
    }
  });
});
