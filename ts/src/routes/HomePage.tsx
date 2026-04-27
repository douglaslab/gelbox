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
      <h1 style={{ marginTop: 0 }}>Dash</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>
        A starting point for static, file://-deployable dashboards. Read{' '}
        <code>docs/principles.md</code> and <code>docs/recipe.md</code> before
        adding tabs.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v18M3 12h18" />
        </svg>
        <span style={{ color: 'var(--color-ink-muted)' }}>
          Toggle the theme — this icon and the panel both follow.
        </span>
      </div>
    </article>
  );
}
