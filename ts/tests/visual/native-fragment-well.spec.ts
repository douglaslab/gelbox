import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const root = '../reference/native/modern/fragment-well-scenes/';
const cases = JSON.parse(fs.readFileSync(root + 'cases.json', 'utf8'));
const scenes = JSON.parse(fs.readFileSync(root + 'manifest.json', 'utf8')).cases;

for (const scale of [1, 2]) test.describe(`fragment well compositor DPR${scale}`, () => {
  test.use({ viewport: { width: 400, height: 600 }, deviceScaleFactor: scale });
  test('native well and representative on the fragment panel', async ({ page }, info) => {
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
      const { FragmentWell } = await import('/src/components/inspector/FragmentWell.tsx');
      const { MolecularView } = await import('/src/lib/gel/molecularRuntime.ts');
      const { CinderRand } = await import('/src/lib/sim/rng.ts');
      const view = new MolecularView('reference', new CinderRand(1), { bounds: { x1: 0, y1: 0, x2: 303, y2: 520 } });
      const Fixture = () => {
        const store = useGelStore();
        // Static native particle snapshot, with the production well component
        // acquiring the actual view through its normal store accessor.
        store.getMolecularView = () => view;
        return React.createElement('div', { style: { position: 'absolute', left: 77, top: 71 } },
          React.createElement(FragmentWell, { fragmentIndex: 0 }));
      };
      const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;z-index:999;width:303px;height:520px;background:white'; document.body.append(host);
      createRoot(host).render(React.createElement(GelProvider, null, React.createElement(Fixture)));
      (window as any).__particleBackground = () => { host.style.background = 'rgb(255,0,255)'; };
      (window as any).__particleScene = (next: any) => { view.sim.parts = [next.part]; };
    });
    const canvas = page.getByTestId('fragment-representative');
    await expect(canvas).toHaveAttribute('width', String(303 * scale));
    await expect(canvas).toHaveAttribute('data-probe-context', backend);
    const results = [];
    for (const scene of scenes.filter((s: any) => s.scale === scale)) {
      const { id, mesh } = scene;
      await page.evaluate(scene => (window as any).__particleScene(scene), cases.find((c: any) => c.id === mesh));
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(page.getByRole('alert')).toHaveCount(0);
      const png = await page.screenshot({ clip: { x: 0, y: 0, width: 303, height: 520 } });
      await fs.promises.writeFile(info.outputPath(id + '.png'), png);
      const native = fs.readFileSync(root + id + '.png').toString('base64');
      const comparison = await page.evaluate(async ({ png, native }) => {
        const decode = async (src: string) => {
          const im = new Image(); im.src = 'data:image/png;base64,' + src; await im.decode();
          const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
          const ctx = c.getContext('2d')!; ctx.drawImage(im, 0, 0); return ctx.getImageData(0, 0, c.width, c.height).data;
        };
        const [a, b] = await Promise.all([decode(native), decode(png)]);
        if (a.length !== b.length) throw Error('Wrong dimensions');
        let different = 0, max = 0, absolute = 0;
        for (let i = 0; i < a.length; i++) if (i % 4 !== 3) {
          const delta = Math.abs(a[i] - b[i]); if (delta) { different++; max = Math.max(max, delta); absolute += delta; }
        }
        return { differentChannels: different, maxChannelDifference: max, absoluteChannelDifference: absolute };
      }, { png: png.toString('base64'), native });
      results.push({ id, ...comparison });
      await expect(canvas).toHaveAttribute('data-probe-context', backend);
    }
    await fs.promises.writeFile(info.outputPath('comparison.json'), JSON.stringify(results, null, 2));
    expect(results.filter(r => r.differentChannels)).toEqual([]);
    // The white native underlay applies only where geometry covers the panel.
    // A contrasting host exposes accidental opaque full-panel output. The
    // subquantum particle still covers white outside the well despite tiny fade.
    await page.evaluate(scene => {
      (window as any).__particleScene(scene);(window as any).__particleBackground();
    }, cases.find((c:any)=>c.id==='large-subquantum'));
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const png=await page.screenshot({clip:{x:0,y:0,width:303,height:520}});
    const pixels=await page.evaluate(async ({png,scale})=>{
      const im=new Image();im.src='data:image/png;base64,'+png;await im.decode();
      const c=document.createElement('canvas');c.width=im.width;c.height=im.height;
      const ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);
      return [[10,10],[117,111],[170,130]].map(([x,y])=>Array.from(ctx.getImageData(x*scale,y*scale,1,1).data));
    },{png:png.toString('base64'),scale});
    expect(pixels).toEqual([[255,0,255,255],[241,241,241,255],[255,255,255,255]]);
  });
});
