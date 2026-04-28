import { useEffect, useRef, useState } from 'react';
import { requestDevice } from '../lib/gpu/device';
import { configureContext } from '../lib/gpu/context';
import { selectBackend } from '../lib/gel/backend';

type BootState =
  | { status: 'pending' }
  | { status: 'ready' }
  | { status: 'error'; message: string };

const SAMPLE_WINDOW = 60;

type PerfFixture = {
  gelSize: { width: number; height: number };
  pixelsPerUnit: number;
  bands: unknown[];
  globalWarp: { h2oDistort: boolean; randSeed: number };
};

async function mountWebGpu(
  canvas: HTMLCanvasElement,
  fixture: PerfFixture,
  isCancelled: () => boolean,
  onRenderer: (r: ReturnType<typeof import('../lib/gel/render').createGelRenderer>) => void,
  setAvgMs: (ms: number) => void,
  getRafId: () => number,
  setRafId: (id: number) => void,
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
  renderer.setGlobalWarp(fixture.globalWarp);

  // Reuse blit pipeline across frames
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
    label: 'perf-blit',
    layout: device.createPipelineLayout({ bindGroupLayouts: [bgl] }),
    vertex:   { module: vs, entryPoint: 'vs_main', buffers: [quad.layout] },
    fragment: { module: fs, entryPoint: 'fs_main', targets: [{ format }] },
    primitive: { topology: 'triangle-strip' },
  });
  const sampler = device.createSampler({
    magFilter: 'linear', minFilter: 'linear',
    addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
  });
  const uPass = createUniformBuffer(device, 48, 'perf-blit-pass-uniforms');
  const dv = uPass.view;
  const w = canvas.width, h = canvas.height;
  dv.setFloat32(0,  0, true); dv.setFloat32(4,  0, true);
  dv.setFloat32(8,  w, true); dv.setFloat32(12, h, true);
  dv.setFloat32(16, 0, true); dv.setFloat32(20, 0, true);
  dv.setFloat32(24, 1, true); dv.setFloat32(28, 1, true);
  dv.setFloat32(32, w, true); dv.setFloat32(36, h, true);
  dv.setFloat32(40, 0, true); dv.setFloat32(44, 0, true);
  uPass.upload(queue);

  const samples: number[] = [];
  let last = performance.now();
  function frame() {
    if (isCancelled()) return;
    const now = performance.now();
    samples.push(now - last);
    if (samples.length > SAMPLE_WINDOW) samples.shift();
    last = now;

    if (samples.length === SAMPLE_WINDOW) {
      const sum = samples.reduce((a, b) => a + b, 0);
      setAvgMs(sum / samples.length);
    }

    renderer.render();
    // Rebuild bind group each frame because composite ping-pong may have
    // swapped (overcook on means an extra swap that flips current/next).
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

    setRafId(requestAnimationFrame(frame));
  }
  setRafId(requestAnimationFrame(frame));
  void getRafId; // suppress unused warning
}

async function mountWebGl2(
  canvas: HTMLCanvasElement,
  fixture: PerfFixture,
  isCancelled: () => boolean,
  onRenderer: (r: ReturnType<typeof import('../lib/gel/render-gl').createGlGelRenderer>) => void,
  setAvgMs: (ms: number) => void,
  getRafId: () => number,
  setRafId: (id: number) => void,
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
  renderer.setGlobalWarp(fixture.globalWarp);
  onRenderer(renderer);

  // Set up blit pipeline once outside the loop.
  const blit = createGlProgram(gl, passthroughVertSrc.default, gelPassthroughSrc.default, 'gl-blit');
  const quad = createGlQuad(gl);

  const samples: number[] = [];
  let last = performance.now();
  function frame() {
    if (isCancelled()) return;
    const now = performance.now();
    samples.push(now - last);
    if (samples.length > SAMPLE_WINDOW) samples.shift();
    last = now;
    if (samples.length === SAMPLE_WINDOW) {
      const sum = samples.reduce((a, b) => a + b, 0);
      setAvgMs(sum / samples.length);
    }

    renderer.render();

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
    gl.uniform2f(blit.uniform('uTexCoordOffset'), 0, 0);
    gl.uniform2f(blit.uniform('uTexCoordScale'),  1, 1);
    gl.uniform2f(blit.uniform('uGelSize'),        fixture.gelSize.width, fixture.gelSize.height);
    bindQuadAttribs(gl, quad.buffer, blit.attrib('aPos'), blit.attrib('aTexCoord'));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    setRafId(requestAnimationFrame(frame));
  }
  setRafId(requestAnimationFrame(frame));
  void getRafId; // suppress unused warning
}

export function DevPerfPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [boot, setBoot] = useState<BootState>({ status: 'pending' });
  const [avgMs, setAvgMs] = useState<number | null>(null);
  // Use a ref so helpers can write/read rafId without stale closure issues.
  const rafIdRef = useRef(0);
  const setAvgMsRef = useRef(setAvgMs);
  setAvgMsRef.current = setAvgMs;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let rendererGpu: ReturnType<typeof import('../lib/gel/render').createGelRenderer> | null = null;
    let rendererGl: ReturnType<typeof import('../lib/gel/render-gl').createGlGelRenderer> | null = null;

    (async () => {
      try {
        const fixture = (await import('../../fixtures/states/50-band.json')).default;
        canvas.width  = fixture.gelSize.width  * fixture.pixelsPerUnit;
        canvas.height = fixture.gelSize.height * fixture.pixelsPerUnit;

        const backend = selectBackend();

        if (backend === 'webgl2') {
          await mountWebGl2(
            canvas, fixture,
            () => cancelled,
            (r) => { rendererGl = r; },
            (ms) => setAvgMsRef.current(ms),
            () => rafIdRef.current,
            (id) => { rafIdRef.current = id; },
          );
        } else {
          await mountWebGpu(
            canvas, fixture,
            () => cancelled,
            (r) => { rendererGpu = r; },
            (ms) => setAvgMsRef.current(ms),
            () => rafIdRef.current,
            (id) => { rafIdRef.current = id; },
          );
        }
        if (!cancelled) setBoot({ status: 'ready' });
      } catch (err) {
        if (!cancelled) setBoot({ status: 'error', message: (err as Error).message });
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafIdRef.current);
      rendererGpu?.destroy();
      rendererGl?.destroy();
    };
  }, []);

  const avgText = avgMs == null ? 'measuring…' : `avg-frame-ms: ${avgMs.toFixed(2)}`;

  return (
    <section style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Dev / Perf</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>
        50 bands rendered in a rAF loop. Rolling average over last {SAMPLE_WINDOW} frames.
      </p>
      <div data-testid="renderer-status" style={{ margin: '12px 0', color: 'var(--color-ink-muted)' }}>
        {boot.status === 'error' ? `boot error: ${boot.message}` : `renderer: ${boot.status}`}
      </div>
      <div data-testid="frame-avg" style={{ margin: '12px 0', fontFamily: 'monospace' }}>
        {avgText}
      </div>
      <canvas
        ref={canvasRef}
        data-testid="gel-canvas"
        style={{ width: '320px', height: '240px', display: 'block', border: '1px solid var(--color-grid)', imageRendering: 'pixelated' }}
      />
    </section>
  );
}
