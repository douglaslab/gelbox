import { NavLink } from 'react-router-dom';

export interface TabDef {
  to: string;
  label: string;
}

export function TabNav({ tabs }: { tabs: TabDef[] }) {
  if (tabs.length === 0) return null;
  return (
    <nav style={{ display: 'flex', gap: '12px', padding: '0 16px', borderBottom: '1px solid var(--color-grid)' }}>
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          style={({ isActive }) => ({
            padding: '10px 4px',
            color: isActive ? 'var(--color-ink)' : 'var(--color-ink-muted)',
            textDecoration: 'none',
            borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
            fontWeight: isActive ? 600 : 500,
          })}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
