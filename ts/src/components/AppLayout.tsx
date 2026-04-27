import { Outlet } from 'react-router-dom';
import { TabNav } from './TabNav';
import type { TabDef } from './TabNav';
import { ThemeToggle } from './ThemeToggle';

const TABS: TabDef[] = [
  { to: '/', label: 'Home' },
  { to: '/gel', label: 'Gel' },
  { to: '/dev', label: 'Dev' },
];

export function AppLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-grid)',
        background: 'var(--color-surface-raised)',
      }}>
        <strong style={{ color: 'var(--color-ink)' }}>Gelbox</strong>
        <ThemeToggle />
      </header>
      <TabNav tabs={TABS} />
      <main style={{ flex: 1, padding: '24px 16px', background: 'var(--color-surface)' }}>
        <Outlet />
      </main>
      <footer style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--color-grid)',
        color: 'var(--color-ink-muted)',
        fontSize: '12px',
      }}>
        Built {__BUILD_DATE__} · {__BUILD_SHA__}
      </footer>
    </div>
  );
}
