import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const root = '../reference/native/modern/ordered-texture-scenes/';
const cases = JSON.parse(fs.readFileSync(root + 'cases.json', 'utf8'));
const textures = JSON.parse(fs.readFileSync(root + 'textures.json', 'utf8'));
const scenes = JSON.parse(fs.readFileSync(root + 'manifest.json', 'utf8')).cases;

for (const scale of [1, 2]) test.describe(`ordered texture operations DPR${scale}`, () => {
  test.use({ viewport: { width: 400, height: 600 }, deviceScaleFactor: scale });
  test('native texture alpha, sampling and ordered overlap', async ({ page }, info) => {
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
    await page.evaluate(async ({backend,scale,textures}) => {
      const canvas=document.createElement('canvas');canvas.dataset.testid='shared-composition';
      canvas.width=64*scale;canvas.height=64*scale;
      canvas.style.cssText='position:fixed;left:0;top:0;width:64px;height:64px;z-index:999';
      document.body.append(canvas);
      let draw:(scene:any)=>void;
      let handles:any[];
      if(backend==='webgl2'){
        const {configureGl2Context}=await import('/src/lib/gpu/gl/context.ts');
        const {createGlGelPresentation}=await import('/src/lib/gel/present-gl.ts');
        const {gl}=configureGl2Context(canvas);
        handles=textures.map((t:any)=>{
          const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
          t.levels.forEach((m:any,i:number)=>gl.texImage2D(gl.TEXTURE_2D,i,gl.RGBA8,m.width,m.height,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(m.rgba)));
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAX_LEVEL,t.levels.length-1);return texture;
        });
        const presentation=createGlGelPresentation(gl,{width:canvas.width,height:canvas.height});
        draw=scene=>presentation.draw(scene,scene.wells,scale);
      }else{
        const {requestDevice}=await import('/src/lib/gpu/device.ts');
        const {configureContext}=await import('/src/lib/gpu/context.ts');
        const {createGelPresentation}=await import('/src/lib/gel/present.ts');
        const {device}=await requestDevice();const {context,format}=configureContext(canvas,device);
        handles=textures.map((t:any)=>{
          const texture=device.createTexture({size:[t.levels[0].width,t.levels[0].height],mipLevelCount:t.levels.length,format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
          t.levels.forEach((m:any,i:number)=>device.queue.writeTexture({texture,mipLevel:i},new Uint8Array(m.rgba),{bytesPerRow:m.width*4},[m.width,m.height]));return texture.createView();
        });
        const presentation=createGelPresentation(device,format,{width:canvas.width,height:canvas.height});
        draw=scene=>{const encoder=device.createCommandEncoder();presentation.draw(encoder,scene,context.getCurrentTexture().createView(),scene.wells,scale);device.queue.submit([encoder.finish()]);};
      }
      let current:any;
      (window as any).__particleScene=(next:any)=>{
        const commands=next.ops.map((op:any)=>{
          const common={blend:op.blend,transform:op.transform,
            scissor:op.scissor?{x:op.scissor[0]*scale,y:op.scissor[1]*scale,width:op.scissor[2]*scale,height:op.scissor[3]*scale}:undefined};
          if(op.texture===undefined)return {...common,mesh:{data:new Float32Array(op.vertices),vertexCount:op.vertices.length/6}};
          const rect=(v:number[])=>({x1:v[0],y1:v[1],x2:v[2],y2:v[3]});
          return {...common,texture:handles[op.texture],rect:rect(op.rect),uv:rect(op.uv),tint:op.tint,alpha:op.alpha,
            sampling:{minFilter:op.filter,magFilter:op.filter,mipmapFilter:op.mipmap,addressModeU:op.address==='repeat'?'repeat':'clamp-to-edge',addressModeV:op.address==='repeat'?'repeat':'clamp-to-edge'},colorSpace:'native-unorm'};
        });
        current={commands,wells:[],background:[.15,.2,.25]};
      };
      const frame=()=>{if(current){try{draw(current);}catch(e){(window as any).__drawError=String(e);}}requestAnimationFrame(frame);};requestAnimationFrame(frame);
    }, {backend,scale,textures});
    const canvas = page.getByTestId('shared-composition');
    await expect(canvas).toHaveAttribute('width', String(64 * scale));
    await expect(canvas).toHaveAttribute('data-probe-context', backend);
    const selectedScenes=scenes.filter((s:any)=>s.scale===scale);
    expect(selectedScenes.map((s:any)=>s.scene).sort()).toEqual(['clipped-flipped-tint','linear-alpha','mip-and-filter-switch','premultiplied-tint','repeat-and-additive']);
    const results = [];
    for (const scene of selectedScenes) {
      const { id } = scene;
      await page.evaluate(scene=>(window as any).__particleScene(scene),cases.find((c:any)=>c.id===scene.scene));
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      expect(await page.evaluate(()=>(window as any).__drawError)).toBeUndefined();
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
