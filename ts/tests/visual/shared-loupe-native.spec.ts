import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const root = '../reference/native/modern/shared-loupe-scenes/';
const cases = JSON.parse(fs.readFileSync(root + 'cases.json', 'utf8'));
const scenes = JSON.parse(fs.readFileSync(root + 'manifest.json', 'utf8')).cases;

for (const scale of [1, 2]) test.describe(`shared loupe composition DPR${scale}`, () => {
  test.use({ viewport: { width: 400, height: 300 }, deviceScaleFactor: scale });
  test('native loupe callout, frame and particle composition', async ({ page }, info) => {
    const backend = info.project.name.endsWith('webgl2') ? 'webgl2' : 'webgpu';
    await page.addInitScript(b => {
      localStorage.setItem('gelBackend', b);localStorage.setItem('gelSharedPresentation','1');
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type: any, options: any) {
        const context = getContext.call(this, type, options);
        if (context) this.setAttribute('data-probe-context', type);
        return context;
      } as typeof getContext;
    }, backend);
    await page.goto('/#/dev');
    await page.evaluate(async initial => {
      const { default: React } = await import('/node_modules/.vite/deps/react.js');
      const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
      const { GelProvider, useGelStore } = await import('/src/components/gel/GelContext.tsx');
      const { FragmentWell } = await import('/src/components/inspector/FragmentWell.tsx');
      const { Loupe } = await import('/src/components/gel/Loupe.tsx');
      const { useSharedPresentation } = await import('/src/components/gel/ScenePresentation.tsx');
      const { solidSceneRect } = await import('/src/lib/gel/scenePresentation.ts');
      const { MolecularView } = await import('/src/lib/gel/molecularRuntime.ts');
      const { CinderRand } = await import('/src/lib/sim/rng.ts');
      const r=initial.sampleRect;
      const view=new MolecularView('reference',new CinderRand(1),{bounds:{x1:0,y1:0,x2:r.width,y2:r.height}});
      const Fixture=()=>{
        const store=useGelStore(),registry=useSharedPresentation(),[scene,setScene]=React.useState(initial);
        store.getMolecularView=()=>view;
        React.useLayoutEffect(()=>{store.dispatch({type:'SET_SELECTED',laneIndex:0,index:0});store.dispatch({type:'ADD_LOUPE',anchor:initial.anchor});store.hoverEvent({type:'enable',value:true});store.hoverEvent({type:'move',point:initial.anchor});return registry.register('gel',()=>[solidSceneRect(0,0,400,300,[.1,.2,.35])]);},[store,registry]);
        React.useLayoutEffect(()=>{const key=scene.transient?'hover-0':'loupe-1';store.raiseLayer(scene.sampleLast?'inspector-fragment':key);store.raiseLayer(scene.sampleLast?key:'inspector-fragment');},[store,scene]);
        (window as any).__particleScene=(next:any)=>{view.sim.parts=[next.part];setScene(next);};
        return React.createElement(React.Fragment,null,
          React.createElement('div',{style:{position:'absolute',left:0,top:0,width:390,height:520}},
            React.createElement(Loupe,{loupe:{id:1,frame:{x:scene.sampleRect.left,y:scene.sampleRect.top},anchor:scene.anchor},transient:scene.transient,sample:{fragments:[]},sourceRefs:[]})),
          React.createElement('div',{style:{position:'absolute',left:scene.fragmentOrigin.x+77,top:scene.fragmentOrigin.y+71}},
            React.createElement(FragmentWell,{fragmentIndex:0})));
      };
      const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:999;background:white';document.body.append(host);
      createRoot(host).render(React.createElement(GelProvider,null,React.createElement(Fixture)));
    },cases[0]);
    const canvas = page.getByTestId('shared-scene');
    await expect(canvas).toHaveAttribute('width', String(400 * scale));
    await expect(canvas).toHaveAttribute('data-probe-context', backend);
    const selected=scenes.filter((s:any)=>s.scale===scale);
    expect(selected.map((s:any)=>s.scene).sort()).toEqual(['anchor-hover','focused','fragment-last','idle','inside','transient']);
    const results = [];
    for (const scene of selected) {
      const {id,scene:key}=scene;
      await page.evaluate(next=>(window as any).__particleScene(next),cases.find((c:any)=>c.id===key));
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const input=cases.find((c:any)=>c.id===key);
      const loupe=page.getByTestId(input.transient?'hover-loupe-canvas':'loupe-canvas-1');
      await expect(loupe).toHaveAttribute('data-shared-ready','1');
      expect(await loupe.getAttribute('data-probe-context')).toBeNull();
      await page.mouse.move(input.hover?input.anchor.x:0,input.hover?input.anchor.y:0);
      if(input.focused)await page.getByTestId('loupe-frame-1').focus();else await page.evaluate(()=>{(document.activeElement as HTMLElement)?.blur();});
      await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
      await expect(page.getByRole('alert')).toHaveCount(0);
      const png = await page.screenshot({ clip: { x: 0, y: 0, width: 400, height: 300 } });
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
    expect(results).toHaveLength(6);
    expect(results.filter(r => r.differentChannels)).toEqual([]);
  });
});
