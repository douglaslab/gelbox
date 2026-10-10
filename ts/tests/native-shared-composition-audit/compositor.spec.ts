// Diagnostic prototype: existing presentation API only; not integrated app composition.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const root = '../reference/native/modern/fragment-edge-scenes/';
const cases = JSON.parse(fs.readFileSync(root + 'cases.json', 'utf8'));
const meshes = JSON.parse(fs.readFileSync(root + 'meshes.json', 'utf8'));
const scenes = JSON.parse(fs.readFileSync(root + 'manifest.json', 'utf8')).cases;

for (const scale of [1, 2]) test.describe(`shared composition prototype DPR${scale}`, () => {
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
    await page.evaluate(async ({backend,scale}) => {
      const { FRAGMENT_WELL_LAYERS } = await import('/src/lib/gel/fragmentWellGeometry.ts');
      const { buildRepresentativeMesh } = await import('/src/lib/sim/molecularSimMesh.ts');
      const { MOLECULAR_SIM_TUNING } = await import('/src/lib/sim/molecularSimEngine.ts');
      const { LAYOUT } = await import('/src/lib/layout/layout.ts');
      const canvas=document.createElement('canvas');canvas.dataset.testid='shared-composition';
      canvas.width=303*scale;canvas.height=520*scale;
      canvas.style.cssText='position:fixed;left:0;top:0;width:303px;height:520px;z-index:999';
      document.body.append(canvas);
      const tint=[217/255,45/255,81/255,1];
      const triangleData=new Float32Array([0,0,...tint,303,0,...tint,303,303,...tint]);
      const triangle={mesh:{data:triangleData,vertexCount:3}};
      let draw:(scene:any)=>void;
      if(backend==='webgl2'){
        const {configureGl2Context}=await import('/src/lib/gpu/gl/context.ts');
        const {createGlGelPresentation}=await import('/src/lib/gel/present-gl.ts');
        const {gl}=configureGl2Context(canvas);
        const presentation=createGlGelPresentation(gl,{width:canvas.width,height:canvas.height},{meshBlend:'over'});
        draw=scene=>presentation.draw(scene,[],scale);
      }else{
        const {requestDevice}=await import('/src/lib/gpu/device.ts');
        const {configureContext}=await import('/src/lib/gpu/context.ts');
        const {createGelPresentation}=await import('/src/lib/gel/present.ts');
        const {device}=await requestDevice();const {context,format}=configureContext(canvas,device);
        const presentation=createGelPresentation(device,format,{width:canvas.width,height:canvas.height},{meshBlend:'over'});
        draw=scene=>{const encoder=device.createCommandEncoder();presentation.draw(encoder,scene,context.getCurrentTexture().createView(),[],scale);device.queue.submit([encoder.finish()]);};
      }
      let current:any;
      (window as any).__particleScene=(next:any,background:number[],native:number[]|null)=>{
        const generated=buildRepresentativeMesh([next.part],next.part.fragment,{x:117,y:111},{
          numCirclePartVertices:MOLECULAR_SIM_TUNING.numCirclePartVertices,
          multimerAdhereOverlapFrac:MOLECULAR_SIM_TUNING.multimerAdhereOverlapFrac,
          outlineWidth:LAYOUT.sampleViewFragOutlineWidth,selectColor:[0,0,0],hoverColor:[0,0,0]});
        const empty=next.id==='underlay'||next.part.fade<=0;
        const mesh=empty?{data:new Float32Array(),vertexCount:0}:native?{data:new Float32Array(native),vertexCount:native.length/6}:generated;
        current={mesh,underlay:[triangle,...(next.id==='underlay'?[]:FRAGMENT_WELL_LAYERS)],background:background.map(v=>v/255)};
      };
      const frame=()=>{if(current)draw(current);requestAnimationFrame(frame);};requestAnimationFrame(frame);
    }, {backend,scale});
    const canvas = page.getByTestId('shared-composition');
    await expect(canvas).toHaveAttribute('width', String(303 * scale));
    await expect(canvas).toHaveAttribute('data-probe-context', backend);
    const selectedScenes=scenes.filter((s:any)=>s.scale===scale);
    expect(selectedScenes.map((s:any)=>s.mesh).sort()).toEqual(['empty','large-crossing','large-round','underlay']);
    const results = [];
    for (const mode of ['native-mesh','generated-mesh']) for (const scene of selectedScenes) {
      const { id, mesh, background } = scene;
      await page.evaluate(({scene,background,native}) => (window as any).__particleScene(scene,background,native), {scene:cases.find((c: any) => c.id === mesh),background,native:mode==='native-mesh'?meshes.find((m:any)=>m.id===mesh).data:null});
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(page.getByRole('alert')).toHaveCount(0);
      const png = await page.screenshot({ clip: { x: 0, y: 0, width: 303, height: 520 } });
      await fs.promises.writeFile(info.outputPath(mode+'-'+id + '.png'), png);
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
      results.push({ id, mode, ...comparison });
      await expect(canvas).toHaveAttribute('data-probe-context', backend);
    }
    await fs.promises.writeFile(info.outputPath('comparison.json'), JSON.stringify(results, null, 2));
    expect(results).toHaveLength(8);
    expect(results.filter(r => r.differentChannels)).toEqual([]);
  });
});
