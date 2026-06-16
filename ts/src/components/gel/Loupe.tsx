import { useGelDispatch } from './GelContext';
import type { LoupeRef } from '../../lib/gel/gelState';
import type { Sample } from '../../lib/sim/sample';
import type { DegradeFilter } from '../../lib/sim/sampleFromGel';
import { SampleSimCanvas } from '../sample/SampleSimCanvas';

const LOUPE_SIZE = 171;   // C++ Layout::mLoupeSize

interface LoupeProps {
  loupe:          LoupeRef;
  sample:         Sample;
  degradeFilter?: DegradeFilter;
}

export function Loupe({ loupe, sample, degradeFilter }: LoupeProps) {
  const dispatch = useGelDispatch();
  return (
    <div
      data-testid={`loupe-${loupe.id}`}
      data-loupe-id={loupe.id}
      style={{
        position: 'fixed',
        left: loupe.screen.x,
        top: loupe.screen.y,
        width: LOUPE_SIZE,
        height: LOUPE_SIZE,
        background: 'var(--color-surface-raised, #14131a)',
        border: '1px solid var(--color-grid, #444)',
        borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      <button
        data-testid={`loupe-close-${loupe.id}`}
        onClick={() => dispatch({ type: 'REMOVE_LOUPE', id: loupe.id })}
        style={{
          position: 'absolute', top: 4, right: 4, zIndex: 1,
          width: 22, height: 22, padding: 0,
          background: 'transparent', border: 'none',
          color: 'var(--color-ink-muted, #888)', cursor: 'pointer',
          fontSize: 16, lineHeight: '20px',
        }}
        aria-label="Close loupe"
      >×</button>
      <SampleSimCanvas
        sample={sample}
        width={LOUPE_SIZE}
        height={LOUPE_SIZE}
        seed={Math.floor(loupe.anchor.x) * 19 + Math.floor(loupe.anchor.y) * 1723}
        degradeFilter={degradeFilter}
        data-testid={`loupe-canvas-${loupe.id}`}
      />
    </div>
  );
}
