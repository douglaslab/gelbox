import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const root = '../reference/native/modern/ordered-mesh-scenes/';
const cases = JSON.parse(fs.readFileSync(root + 'cases.json', 'utf8'));
const scenes = JSON.parse(fs.readFileSync(root + 'manifest.json', 'utf8')).cases;

for (const scale of [1, 2]) test.describe(`ordered mesh operations DPR${scale}`, () => {
  test.use({ viewport: { width: 400, height: 600 }, deviceScaleFactor: scale });
  test('native transforms, blend transitions and clipping', async ({ page }, info) => {
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
      const canvas=document.createElement('canvas');canvas.dataset.testid='shared-composition';
      canvas.width=64*scale;canvas.height=64*scale;
      canvas.style.cssText='position:fixed;left:0;top:0;width:64px;height:64px;z-index:999';
      document.body.append(canvas);
      let draw:(scene:any)=>void;
      if(backend==='webgl2'){
        const {configureGl2Context}=await import('/src/lib/gpu/gl/context.ts');
        const {createGlGelPresentation}=await import('/src/lib/gel/present-gl.ts');
        const {gl}=configureGl2Context(canvas);
        const presentation=createGlGelPresentation(gl,{width:canvas.width,height:canvas.height},{meshBlend:'over'});
        draw=scene=>presentation.draw(scene,scene.wells,scale);
      }else{
        const {requestDevice}=await import('/src/lib/gpu/device.ts');
        const {configureContext}=await import('/src/lib/gpu/context.ts');
        const {createGelPresentation}=await import('/src/lib/gel/present.ts');
        const {device}=await requestDevice();const {context,format}=configureContext(canvas,device);
        const presentation=createGelPresentation(device,format,{width:canvas.width,height:canvas.height},{meshBlend:'over'});
        draw=scene=>{const encoder=device.createCommandEncoder();presentation.draw(encoder,scene,context.getCurrentTexture().createView(),scene.wells,scale);device.queue.submit([encoder.finish()]);};
      }
      let current:any;
      (window as any).__particleScene=(next:any)=>{
        const layers=next.ops.map((op:any)=>({
          mesh:{data:new Float32Array(op.vertices),vertexCount:op.vertices.length/6},
          topology:op.topology,blend:op.blend??'over',transform:op.transform,
          scissor:op.scissor?{x:op.scissor[0]*scale,y:op.scissor[1]*scale,width:op.scissor[2]*scale,height:op.scissor[3]*scale}:undefined,
        }));
        current={wells:next.wells??[],mesh:{data:new Float32Array(),vertexCount:0},underlay:layers,background:[.15,.2,.25]};
      };
      const frame=()=>{if(current)draw(current);requestAnimationFrame(frame);};requestAnimationFrame(frame);
    }, {backend,scale});
    const canvas = page.getByTestId('shared-composition');
    await expect(canvas).toHaveAttribute('width', String(64 * scale));
    await expect(canvas).toHaveAttribute('data-probe-context', backend);
    const selectedScenes=scenes.filter((s:any)=>s.scale===scale);
    expect(selectedScenes.map((s:any)=>s.scene).sort()).toEqual(['clip-before-wells','empty-and-reset','empty-scene','mixed-blends','transform-and-clip']);
    const results = [];
    for (const scene of selectedScenes) {
      const { id } = scene;
      await page.evaluate(scene=>(window as any).__particleScene(scene),cases.find((c:any)=>c.id===scene.scene));
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(page.getByRole('alert')).toHaveCount(0);
      const png = await page.screenshot({ clip: { x: 0, y: 0, width: 64, height: 64 } });
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
    expect(results).toHaveLength(5);
    expect(results.filter(r => r.differentChannels)).toEqual([]);
  });
});
