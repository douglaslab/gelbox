import { useMemo, useState } from 'react';
import { GelProvider, useGelState, useGelDispatch } from '../components/gel/GelContext';
import { GelCanvas } from '../components/gel/GelCanvas';
import { GelOverlay, type BandLaneFragment } from '../components/gel/GelOverlay';
import { GelControls } from '../components/chrome/GelControls';
import { FileControls } from '../components/chrome/FileControls';
import { MicrotubeRow } from '../components/gel/MicrotubeRow';
import { LoupePortalLayer } from '../components/gel/LoupePortalLayer';
import { fragToBands } from '../lib/sim/gelSim';
import { deserializeFile } from '../lib/gel/serialize';
import type { Band } from '../lib/sim/band';

function GelInner() {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const [dropError, setDropError] = useState<string | null>(null);

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

  async function onDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    setDropError(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = deserializeFile(text);
      if (result.kind === 'sample') {
        dispatch({ type: 'LOAD_FIXTURE', key: file.name.replace(/\.json$/i, ''), sample: result.sample, lane: state.selectedLane });
      } else {
        dispatch({ type: 'LOAD_GEL_STATE', samples: result.samples, numLanes: result.numLanes, ctx: result.ctx });
      }
    } catch (err) {
      setDropError(`Drop failed: ${(err as Error).message}`);
    }
  }

  return (
    <section
      data-testid="gel-page"
      style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <h1 style={{ marginTop: 0 }}>Gel</h1>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <GelControls />
          <FileControls />
        </div>
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
      {dropError && (
        <div data-testid="drop-error" style={{ marginTop: 8, color: 'var(--color-danger, #c44)', fontSize: 12 }}>
          {dropError}
        </div>
      )}
      <LoupePortalLayer />
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
