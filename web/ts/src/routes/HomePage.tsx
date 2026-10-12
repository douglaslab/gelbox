export function HomePage() {
  return (
    <article style={{
      maxWidth: '640px',
      margin: '0 auto',
      padding: '24px',
      background: 'var(--color-surface-raised)',
      border: '1px solid var(--color-grid)',
      borderRadius: '8px',
      color: 'var(--color-ink)',
    }}>
      <h1 style={{ marginTop: 0 }}>Gelbox</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>
        A web port of the Douglas Lab gel electrophoresis simulator. Built on
        TypeScript + WebGPU with WebGL2 fallback.
      </p>
      <ul style={{ color: 'var(--color-ink-muted)', lineHeight: 1.8, marginTop: '20px', paddingLeft: '20px' }}>
        <li>
          <strong style={{ color: 'var(--color-ink)' }}>Gel</strong>
          {' — main app'}
        </li>
        <li>
          <strong style={{ color: 'var(--color-ink)' }}>Dev</strong>
          {' — debug playground (GPU capability, single-band tests)'}
        </li>
      </ul>
    </article>
  );
}
