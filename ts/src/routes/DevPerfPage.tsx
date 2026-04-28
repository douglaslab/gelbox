import { useEffect, useRef, useState } from 'react';
import { requestDevice } from '../lib/gpu/device';
import { configureContext } from '../lib/gpu/context';

type BootState =
  | { status: 'pending' }
  | { status: 'ready' }
  | { status: 'error'; message: string };

const SAMPLE_WINDOW = 60;

export function DevPerfPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [boot, setBoot] = useState<BootState>({ status: 'pending' });
  const [avgMs, setAvgMs] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: ReturnType<typeof import('../lib/gel/render').createGelRenderer> | null = null;
    let cancelled = false;
    let rafId = 0;

    (async () => {
      try {
        const fixture = (await import('../../fixtures/states/50-band.json')).default;
        canvas.width  = fixture.gelSize.width  * fixture.pixelsPerUnit;
        canvas.height = fixture.gelSize.height * fixture.pixelsPerUnit;

        const { device, queue } = await requestDevice();
        if (cancelled) return;
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

        renderer = createGelRenderer(device, fixture.gelSize, fixture.pixelsPerUnit);
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

        if (!cancelled) setBoot({ status: 'ready' });

        const samples: number[] = [];
        let last = performance.now();
        function frame() {
          if (cancelled) return;
          const now = performance.now();
          samples.push(now - last);
          if (samples.length > SAMPLE_WINDOW) samples.shift();
          last = now;

          if (samples.length === SAMPLE_WINDOW) {
            const sum = samples.reduce((a, b) => a + b, 0);
            setAvgMs(sum / samples.length);
          }

          renderer!.render();
          // Rebuild bind group each frame because composite ping-pong may have
          // swapped (overcook on means an extra swap that flips current/next).
          const bg = device.createBindGroup({
            layout: bgl,
            entries: [
              { binding: 0, resource: { buffer: uPass.buffer } },
              { binding: 1, resource: renderer!.output.view },
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

          rafId = requestAnimationFrame(frame);
        }
        rafId = requestAnimationFrame(frame);
      } catch (err) {
        if (!cancelled) setBoot({ status: 'error', message: (err as Error).message });
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      renderer?.destroy();
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
