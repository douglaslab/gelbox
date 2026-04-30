import { useGelDispatch } from './GelContext';
import type { LoupeRef } from '../../lib/gel/gelState';
import type { Fragment } from '../../lib/sim/sample';
import { mulberry32 } from '../../lib/sim/rng';

interface LoupeProps {
  loupe:    LoupeRef;
  fragment: Fragment;
}

const W = 180;
const H = 120;

export function Loupe({ loupe, fragment }: LoupeProps) {
  const dispatch = useGelDispatch();

  // Particle count proportional to mass, clamped [8, 30]
  const count = Math.max(8, Math.min(30, Math.round(fragment.mass * 0.2)));
  const rng = mulberry32(loupe.id * 1009 + fragment.bases);
  const particles = Array.from({ length: count }, () => ({
    x: rng() * (W - 24) + 12,
    y: rng() * (H - 56) + 32,
    r: 2 + rng() * 4,
  }));

  // Color: dye gets its own; fragment uses focusColor heuristic (we use frag.color)
  const [r, g, b] = fragment.color;
  const fill = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  const dyeName = fragment.dye >= 0
    ? ['Xylene', 'Cresol', 'Bromphenol', 'Orange G'][fragment.dye] ?? 'Dye'
    : null;

  return (
    <div
      data-testid={`loupe-${loupe.id}`}
      data-loupe-id={loupe.id}
      style={{
        position: 'fixed',
        left: loupe.x,
        top: loupe.y,
        width: W,
        height: H,
        background: 'var(--color-surface-raised, #14131a)',
        border: '1px solid var(--color-grid, #444)',
        borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      <button
        data-testid={`loupe-close-${loupe.id}`}
        onClick={() => dispatch({ type: 'REMOVE_LOUPE', id: loupe.id })}
        style={{
          position: 'absolute', top: 4, right: 4,
          width: 22, height: 22, padding: 0,
          background: 'transparent', border: 'none',
          color: 'var(--color-ink-muted, #888)', cursor: 'pointer',
          fontSize: 16, lineHeight: '20px',
        }}
        aria-label="Close loupe"
      >×</button>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W} height={H}
        style={{ display: 'block', position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {/* Particle scatter inset */}
        <rect x={8} y={28} width={W - 16} height={H - 60} fill="rgba(0,0,0,0.4)" rx={4} />
        {particles.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={fill} opacity={0.75} />
        ))}
        {/* Header label */}
        <text x={10} y={18} fontSize={11} fill="var(--color-ink, #ddd)" fontFamily="monospace">
          lane {loupe.lane} · frag {loupe.fragmentIndex}{dyeName ? ` · ${dyeName}` : ''}
        </text>
        {/* Footer */}
        <text x={10} y={H - 6} fontSize={11} fill="var(--color-ink-muted, #888)" fontFamily="monospace">
          {fragment.bases} bp · {fragment.mass.toFixed(0)} ng
        </text>
      </svg>
    </div>
  );
}
