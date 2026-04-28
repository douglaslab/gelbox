import { useEffect, useRef, useState } from 'react';
import { detectGpuCapability, type GpuCapability } from '../lib/gpu/adapter';
import { createSurface } from '../lib/gpu/surface';
import { requestDevice } from '../lib/gpu/device';
import { configureContext } from '../lib/gpu/context';

type BootState =
  | { status: 'pending' }
  | { status: 'ready' }
  | { status: 'error'; message: string };

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
    let surface: ReturnType<typeof createSurface> | null = null;
    (async () => {
      try {
        surface = createSurface(canvas);
        const { device, queue } = await requestDevice();
        if (cancelled) return;
        const { context, format } = configureContext(canvas, device);

        const [
          { createQuad },
          { createShaderModule },
          { createImageGraphPipeline },
          { createUniformBuffer, writeVec2 },
          passthroughVert,
          gelPassthroughFrag,
        ] = await Promise.all([
          import('../lib/gpu/quad'),
          import('../lib/gpu/shader'),
          import('../lib/gpu/pipeline'),
          import('../lib/gpu/uniforms'),
          import('../shaders/passthrough.vert.wgsl?raw'),
          import('../shaders/gel-passthrough.frag.wgsl?raw'),
        ]);

        const quad = createQuad(device);
        const vs = createShaderModule(device, passthroughVert.default, 'passthrough.vert');
        const fs = createShaderModule(device, gelPassthroughFrag.default, 'gel-passthrough.frag');

        // 2×2 test texture: red, green, blue, white pixels (top row, then bottom row)
        const testTex = device.createTexture({
          size: { width: 2, height: 2 },
          format: 'rgba8unorm-srgb',
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        queue.writeTexture(
          { texture: testTex },
          new Uint8Array([
            255, 0, 0, 255,    0, 255, 0, 255,
            0, 0, 255, 255,  255, 255, 255, 255,
          ]),
          { bytesPerRow: 8, rowsPerImage: 2 },
          { width: 2, height: 2 }
        );

        const sampler = device.createSampler({
          magFilter: 'nearest', minFilter: 'nearest',
          addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
        });

        const bgl = device.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: GPUShaderStage.VERTEX,   buffer:  { type: 'uniform' } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
            { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
          ],
        });

        const pipeline = createImageGraphPipeline({
          device, vertex: vs, fragment: fs,
          vertexLayout: quad.layout, targetFormat: format,
          bindGroupLayout: bgl, label: 'passthrough',
        });

        const uPass = createUniformBuffer(device, 48, 'pass-uniforms'); // 6×vec2 = 48 B
        // Render the quad over the entire canvas in "gel space" (treat canvas px as gel px)
        const gelW = canvas.width;
        const gelH = canvas.height;
        writeVec2(uPass.view,  0, 0,    0);                  // positionOffset
        writeVec2(uPass.view,  8, gelW, gelH);               // positionScale
        writeVec2(uPass.view, 16, 0,    0);                  // texCoordOffset
        writeVec2(uPass.view, 24, 1,    1);                  // texCoordScale
        writeVec2(uPass.view, 32, gelW, gelH);               // gelSize
        writeVec2(uPass.view, 40, 0,    0);                  // pad
        uPass.upload(queue);

        const bg = device.createBindGroup({
          layout: bgl,
          entries: [
            { binding: 0, resource: { buffer: uPass.buffer } },
            { binding: 1, resource: testTex.createView() },
            { binding: 2, resource: sampler },
          ],
        });

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          }],
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bg);
        pass.setVertexBuffer(0, quad.buffer);
        pass.draw(quad.vertexCount);
        pass.end();
        queue.submit([encoder.finish()]);
        if (!cancelled) setBoot({ status: 'ready' });
      } catch (err) {
        if (!cancelled) setBoot({ status: 'error', message: (err as Error).message });
      }
    })();
    return () => { cancelled = true; surface?.dispose(); };
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
        style={{ width: '320px', height: '240px', display: 'block', border: '1px solid var(--color-grid)' }}
      />
    </section>
  );
}
