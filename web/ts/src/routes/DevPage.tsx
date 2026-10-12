import { useEffect, useRef, useState } from 'react';
import { detectGpuCapability, type GpuCapability } from '../lib/gpu/adapter';
import { requestDevice } from '../lib/gpu/device';
import { configureContext } from '../lib/gpu/context';
import { selectBackend } from '../lib/gel/backend';

type BootState =
  | { status: 'pending' }
  | { status: 'ready' }
  | { status: 'error'; message: string };

async function mountWebGpu(
  canvas: HTMLCanvasElement,
  fixture: { gelSize: { width: number; height: number }; pixelsPerUnit: number; bands: unknown[] },
  isCancelled: () => boolean,
  onRenderer: (r: ReturnType<typeof import('../lib/gel/render').createGelRenderer>) => void
): Promise<void> {
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

  const renderer = createGelRenderer(device, fixture.gelSize, fixture.pixelsPerUnit);
  onRenderer(renderer);
  renderer.setBands(fixture.bands as unknown as Parameters<typeof renderer.setBands>[0]);
  renderer.render();
  if (isCancelled()) return;

  // TODO(M3): blit pipeline resources leak on unmount; replaced when GelCanvas owns the lifecycle.
  // Blit composite RT → canvas via passthrough fs_main (no tint, no blend).
  // Blit uses fs_main only (no tint, no blend) → 3-binding layout. fs_composite's
  // CompositeUniforms (binding 3) is declared in the shader module but unreachable
  // from fs_main, so it doesn't appear in this pipeline's resource interface.
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
    label: 'blit',
    layout: device.createPipelineLayout({ bindGroupLayouts: [bgl] }),
    vertex:   { module: vs, entryPoint: 'vs_main', buffers: [quad.layout] },
    fragment: { module: fs, entryPoint: 'fs_main', targets: [{ format }] },
    primitive: { topology: 'triangle-strip' },
  });
  const sampler = device.createSampler({
    magFilter: 'linear', minFilter: 'linear',
    addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
  });
  const uPass = createUniformBuffer(device, 48, 'blit-pass-uniforms');
  const dv = uPass.view;
  const w = canvas.width, h = canvas.height;
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
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear', storeOp: 'store',
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
    }],
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
  fixture: { gelSize: { width: number; height: number }; pixelsPerUnit: number; bands: unknown[] },
  isCancelled: () => boolean,
  onRenderer: (r: ReturnType<typeof import('../lib/gel/render-gl').createGlGelRenderer>) => void
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

  const renderer = createGlGelRenderer(gl, fixture.gelSize, fixture.pixelsPerUnit);
  renderer.setBands(fixture.bands as unknown as Parameters<typeof renderer.setBands>[0]);
  renderer.render();
  if (isCancelled()) return;
  onRenderer(renderer);

  // Blit composite → default framebuffer.
  // No GEL_COMPOSITE define → fs_main equivalent (sample + output, no tint).
  const blit = createGlProgram(gl, passthroughVertSrc.default, gelPassthroughSrc.default, 'gl-blit');
  const quad = createGlQuad(gl);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(blit.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, renderer.output.texture);
  gl.uniform1i(blit.uniform('uTex0'), 0);
  gl.uniform2f(blit.uniform('uPositionOffset'), 0, 0);
  gl.uniform2f(blit.uniform('uPositionScale'),  fixture.gelSize.width, fixture.gelSize.height);
  gl.uniform2f(blit.uniform('uTexCoordOffset'), 0, 1);
  gl.uniform2f(blit.uniform('uTexCoordScale'),  1, -1);
  gl.uniform2f(blit.uniform('uGelSize'),        fixture.gelSize.width, fixture.gelSize.height);
  bindQuadAttribs(gl, quad.buffer, blit.attrib('aPos'), blit.attrib('aTexCoord'));
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // NB: blit + quad allocate WebGL resources that leak when the page unmounts. Same TODO as the WebGPU path —
  // resolves when GelCanvas owns the lifecycle.
}

export function DevPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cap, setCap] = useState<GpuCapability | null>(null);
  const [boot, setBoot] = useState<BootState>({ status: 'pending' });

  useEffect(() => {
    let cancelled = false;
    detectGpuCapability().then((c) => { if (!cancelled) setCap(c); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let rendererGpu: ReturnType<typeof import('../lib/gel/render').createGelRenderer> | null = null;
    let rendererGl: ReturnType<typeof import('../lib/gel/render-gl').createGlGelRenderer> | null = null;

    (async () => {
      try {
        const fixture = (await import('../../fixtures/states/single-band.json')).default;
        // Hard-set canvas backing buffer to fixture size — bypass surface.ts's DPR scaling
        // so goldens are byte-stable regardless of devicePixelRatio (CI runs DPR=1, Retina dev DPR=2).
        canvas.width  = fixture.gelSize.width  * fixture.pixelsPerUnit;
        canvas.height = fixture.gelSize.height * fixture.pixelsPerUnit;

        const backend = selectBackend();

        if (backend === 'webgl2') {
          await mountWebGl2(canvas, fixture, () => cancelled, (r) => { rendererGl = r; });
        } else {
          await mountWebGpu(canvas, fixture, () => cancelled, (r) => { rendererGpu = r; });
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
      <h1 style={{ marginTop: 0 }}>Dev</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>
        Live GPU capability and renderer harness.
      </p>
      <pre data-testid="gpu-capability" style={{
        background: 'var(--color-surface-raised)', padding: '12px', borderRadius: '6px',
        border: '1px solid var(--color-grid)', overflowX: 'auto', color: 'var(--color-ink)',
      }}>{cap ? JSON.stringify(cap, null, 2) : 'detecting…'}</pre>
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
