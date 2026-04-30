import { useEffect, useRef, useState } from 'react';
import { selectBackend } from '../lib/gel/backend';
import type { Sample } from '../lib/sim/sample';
import type { Band } from '../lib/sim/band';
import type { SimContext } from '../lib/sim/gelSim';

type BootState =
  | { status: 'pending' }
  | { status: 'ready' }
  | { status: 'error'; message: string };

const GEL_SIZE = { width: 320, height: 240 };
const PIXELS_PER_UNIT = 1;

export function DevSimPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [boot, setBoot] = useState<BootState>({ status: 'pending' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let rendererGpu: ReturnType<typeof import('../lib/gel/render').createGelRenderer> | null = null;
    let rendererGl: ReturnType<typeof import('../lib/gel/render-gl').createGlGelRenderer> | null = null;

    (async () => {
      try {
        const sample = (await import('../../fixtures/states/ladder-1kb.json')).default as unknown as Sample;
        canvas.width = GEL_SIZE.width * PIXELS_PER_UNIT;
        canvas.height = GEL_SIZE.height * PIXELS_PER_UNIT;

        // Compute bands via the sim
        const { fragToBands } = await import('../lib/sim/gelSim');
        const ctx: SimContext = {
          voltage: 70, time: 0.5, ySpaceScale: 200,
          wellDamage: 0, gelBuffer: sample.buffer, sampleBuffer: sample.buffer,
        };
        const wellRect = { x1: 140, y1: 8, x2: 180, y2: 18 };  // single centered well
        const bands: Band[] = [];
        for (let i = 0; i < sample.fragments.length; i++) {
          bands.push(...fragToBands(sample, i, wellRect, 0, ctx));
        }

        const backend = selectBackend();
        if (backend === 'webgl2') {
          await mountWebGl2(canvas, bands, () => cancelled, (r) => { rendererGl = r; });
        } else {
          await mountWebGpu(canvas, bands, () => cancelled, (r) => { rendererGpu = r; });
        }
        if (!cancelled) setBoot({ status: 'ready' });
      } catch (err) {
        if (!cancelled) setBoot({ status: 'error', message: (err as Error).message });
      }
    })();

    return () => {
      cancelled = true;
      rendererGpu?.destroy();
      rendererGl?.destroy();
    };
  }, []);

  return (
    <section style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Dev / Sim</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>
        1 kb ladder rendered by GelSim → GelRenderer pipeline.
      </p>
      <div data-testid="renderer-status" style={{ margin: '12px 0', color: 'var(--color-ink-muted)' }}>
        {boot.status === 'error' ? `boot error: ${boot.message}` : `renderer: ${boot.status}`}
      </div>
      <canvas
        ref={canvasRef}
        data-testid="gel-canvas"
        style={{ width: '320px', height: '240px', display: 'block', border: '1px solid var(--color-grid)', imageRendering: 'pixelated' }}
      />
    </section>
  );
}

async function mountWebGpu(
  canvas: HTMLCanvasElement,
  bands: Band[],
  isCancelled: () => boolean,
  onRenderer: (r: ReturnType<typeof import('../lib/gel/render').createGelRenderer>) => void,
): Promise<void> {
  const { requestDevice } = await import('../lib/gpu/device');
  const { configureContext } = await import('../lib/gpu/context');
  const { device, queue } = await requestDevice();
  if (isCancelled()) return;
  const { context, format } = configureContext(canvas, device);

  const [
    { createGelRenderer },
    { createQuad },
    { createShaderModule },
    { createUniformBuffer },
    passVertSrc,
    gelPassthroughSrc,
  ] = await Promise.all([
    import('../lib/gel/render'),
    import('../lib/gpu/quad'),
    import('../lib/gpu/shader'),
    import('../lib/gpu/uniforms'),
    import('../shaders/passthrough.vert.wgsl?raw'),
    import('../shaders/gel-passthrough.frag.wgsl?raw'),
  ]);

  const renderer = createGelRenderer(device, GEL_SIZE, PIXELS_PER_UNIT);
  renderer.setBands(bands);
  renderer.render();
  if (isCancelled()) return;
  onRenderer(renderer);

  // Same blit pipeline as DevMultiPage / DevPage
  const quad = createQuad(device);
  const vs = createShaderModule(device, passVertSrc.default, 'passthrough.vert');
  const fs = createShaderModule(device, gelPassthroughSrc.default, 'gel-passthrough.frag');
  const bgl = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX,   buffer:  { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
    ],
  });
  const pipeline = device.createRenderPipeline({
    label: 'sim-blit',
    layout: device.createPipelineLayout({ bindGroupLayouts: [bgl] }),
    vertex: { module: vs, entryPoint: 'vs_main', buffers: [quad.layout] },
    fragment: { module: fs, entryPoint: 'fs_main', targets: [{ format }] },
    primitive: { topology: 'triangle-strip' },
  });
  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' });
  const uPass = createUniformBuffer(device, 48, 'sim-blit-pass-uniforms');
  const dv = uPass.view, w = canvas.width, h = canvas.height;
  dv.setFloat32(0,  0, true); dv.setFloat32(4,  0, true);
  dv.setFloat32(8,  w, true); dv.setFloat32(12, h, true);
  dv.setFloat32(16, 0, true); dv.setFloat32(20, 0, true);
  dv.setFloat32(24, 1, true); dv.setFloat32(28, 1, true);
  dv.setFloat32(32, w, true); dv.setFloat32(36, h, true);
  dv.setFloat32(40, 0, true); dv.setFloat32(44, 0, true);
  uPass.upload(queue);
  const bg = device.createBindGroup({
    layout: bgl,
    entries: [
      { binding: 0, resource: { buffer: uPass.buffer } },
      { binding: 1, resource: renderer.output.view },
      { binding: 2, resource: sampler },
    ],
  });
  const enc = device.createCommandEncoder();
  const pass = enc.beginRenderPass({
    colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }],
  });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bg);
  pass.setVertexBuffer(0, quad.buffer);
  pass.draw(quad.vertexCount);
  pass.end();
  queue.submit([enc.finish()]);
}

async function mountWebGl2(
  canvas: HTMLCanvasElement,
  bands: Band[],
  isCancelled: () => boolean,
  onRenderer: (r: ReturnType<typeof import('../lib/gel/render-gl').createGlGelRenderer>) => void,
): Promise<void> {
  const { configureGl2Context } = await import('../lib/gpu/gl/context');
  const { gl } = configureGl2Context(canvas);
  if (isCancelled()) return;

  const [
    { createGlGelRenderer },
    { createGlProgram },
    { createGlQuad, bindQuadAttribs },
    passthroughVertSrc,
    gelPassthroughSrc,
  ] = await Promise.all([
    import('../lib/gel/render-gl'),
    import('../lib/gpu/gl/program'),
    import('../lib/gpu/gl/quad'),
    import('../shaders/passthrough.vert.glsl?raw'),
    import('../shaders/gel-passthrough.frag.glsl?raw'),
  ]);

  const renderer = createGlGelRenderer(gl, GEL_SIZE, PIXELS_PER_UNIT);
  renderer.setBands(bands);
  renderer.render();
  if (isCancelled()) return;
  onRenderer(renderer);

  const blit = createGlProgram(gl, passthroughVertSrc.default, gelPassthroughSrc.default, 'gl-blit');
  const quad = createGlQuad(gl);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(blit.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, renderer.output.texture);
  gl.uniform1i(blit.uniform('uTex0'), 0);
  gl.uniform2f(blit.uniform('uPositionOffset'), 0, 0);
  gl.uniform2f(blit.uniform('uPositionScale'), GEL_SIZE.width, GEL_SIZE.height);
  gl.uniform2f(blit.uniform('uTexCoordOffset'), 0, 0);
  gl.uniform2f(blit.uniform('uTexCoordScale'), 1, 1);
  gl.uniform2f(blit.uniform('uGelSize'), GEL_SIZE.width, GEL_SIZE.height);
  bindQuadAttribs(gl, quad.buffer, blit.attrib('aPos'), blit.attrib('aTexCoord'));
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
