import { useMemo } from 'react';
import { GelProvider, useGelState } from '../components/gel/GelContext';
import { GelCanvas } from '../components/gel/GelCanvas';
import { GelOverlay, type BandLaneFragment } from '../components/gel/GelOverlay';
import { GelControls } from '../components/chrome/GelControls';
import { MicrotubeRow } from '../components/gel/MicrotubeRow';
import { fragToBands } from '../lib/sim/gelSim';
import type { Band } from '../lib/sim/band';

function GelInner() {
  const state = useGelState();

  const { bands, bandToLaneFragment } = useMemo(() => {
    const bands: Band[] = [];
    const bandToLaneFragment: BandLaneFragment[] = [];
    for (let lane = 0; lane < state.numLanes; lane++) {
      const sample = state.samples[lane];
      if (!sample) continue;
      for (let fragi = 0; fragi < sample.fragments.length; fragi++) {
        const out = fragToBands(sample, fragi, state.wellRects[lane], lane, state.ctx);
        for (const b of out) {
          bands.push(b);
          bandToLaneFragment.push({ lane, fragment: fragi });
        }
      }
    }
    return { bands, bandToLaneFragment };
  }, [state.samples, state.ctx, state.wellRects, state.numLanes]);

  const selectedSample = state.samples[state.selectedLane];
  const selectedFrag = selectedSample && state.selectedFragmentIndex !== null
    ? selectedSample.fragments[state.selectedFragmentIndex]
    : null;

  return (
    <section style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Gel</h1>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
        <GelControls />
        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <MicrotubeRow />
          <div style={{ position: 'relative' }}>
            <GelCanvas bands={bands} gelSize={state.gelSize} pixelsPerUnit={state.pixelsPerUnit} />
            <GelOverlay bands={bands} bandToLaneFragment={bandToLaneFragment} />
          </div>
        </div>
      </div>
      <div data-testid="selection-info" style={{ marginTop: 16, fontSize: 13, color: 'var(--color-ink-muted)' }}>
        {selectedFrag
          ? `lane ${state.selectedLane} fragment ${state.selectedFragmentIndex}: ${selectedFrag.bases} bp, ${selectedFrag.mass} ng`
          : selectedSample
            ? `lane ${state.selectedLane}: ${selectedSample.fragments.length} fragments — click or tab through bands`
            : `lane ${state.selectedLane}: empty`}
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
