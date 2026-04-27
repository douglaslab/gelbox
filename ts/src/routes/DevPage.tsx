import { useEffect, useState } from 'react';
import { detectGpuCapability, type GpuCapability } from '../lib/gpu/adapter';

export function DevPage() {
  const [cap, setCap] = useState<GpuCapability | null>(null);

  useEffect(() => {
    let cancelled = false;
    detectGpuCapability().then((c) => {
      if (!cancelled) setCap(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <h1 style={{ color: 'var(--color-ink)', marginTop: 0 }}>Dev</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>
        Visual debugging playground.
      </p>

      <h2 style={{ color: 'var(--color-ink)' }}>GPU capability</h2>
      {cap === null ? (
        <p style={{ color: 'var(--color-ink-muted)' }}>Detecting…</p>
      ) : (
        <pre
          data-testid="gpu-capability"
          style={{
            color: 'var(--color-ink)',
            background: 'var(--color-surface-raised)',
            padding: '1rem',
            border: '1px solid var(--color-grid)',
            borderRadius: '4px',
            overflow: 'auto',
            maxWidth: '720px',
            fontSize: '12px',
            lineHeight: 1.5,
          }}
        >
          {JSON.stringify(cap, null, 2)}
        </pre>
      )}
    </section>
  );
}
