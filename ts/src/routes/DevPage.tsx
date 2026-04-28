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
    let surface: ReturnType<typeof createSurface> | null = null;
    let cancelled = false;
    (async () => {
      try {
        surface = createSurface(canvas);
        const { device } = await requestDevice();
        if (cancelled) return;
        const { context } = configureContext(canvas, device);
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0.08, g: 0.10, b: 0.12, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          }],
        });
        pass.end();
        device.queue.submit([encoder.finish()]);
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
