import { useMemo } from 'react';
import { GelProvider, useGelState } from '../components/gel/GelContext';
import { GelCanvas } from '../components/gel/GelCanvas';
import { GelOverlay } from '../components/gel/GelOverlay';
import { GelControls } from '../components/chrome/GelControls';
import { fragToBands } from '../lib/sim/gelSim';
import type { Band } from '../lib/sim/band';

function GelInner() {
  const state = useGelState();

  // Compute bands per render. Each fragment emits 1+ bands. We build a parallel
  // bandToFragment[] mapping so the overlay can dispatch fragment-indexed actions.
  const { bands, bandToFragment } = useMemo(() => {
    const bands: Band[] = [];
    const bandToFragment: number[] = [];
    for (let i = 0; i < state.sample.fragments.length; i++) {
      const out = fragToBands(state.sample, i, state.wellRect, 0, state.ctx);
      for (const b of out) {
        bands.push(b);
        bandToFragment.push(i);
      }
    }
    return { bands, bandToFragment };
  }, [state.sample, state.ctx, state.wellRect]);

  const selectedFrag = state.selectedFragmentIndex !== null
    ? state.sample.fragments[state.selectedFragmentIndex]
    : null;

  return (
    <section style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Gel</h1>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
        <GelControls />
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <GelCanvas bands={bands} gelSize={state.gelSize} pixelsPerUnit={state.pixelsPerUnit} />
          <GelOverlay bands={bands} bandToFragment={bandToFragment} />
        </div>
      </div>
      <div data-testid="selection-info" style={{ marginTop: 16, fontSize: 13, color: 'var(--color-ink-muted)' }}>
        {selectedFrag
          ? `selected fragment ${state.selectedFragmentIndex}: ${selectedFrag.bases} bp, ${selectedFrag.mass} ng`
          : 'no selection — click or tab through bands'}
      </div>
    </section>
  );
}

export function GelPage() {
  return (
    <GelProvider>
      <GelInner />
    </GelProvider>
  );
}
