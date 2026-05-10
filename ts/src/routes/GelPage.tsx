import { useMemo, useState } from 'react';
import { GelProvider, useGelState, useGelDispatch } from '../components/gel/GelContext';
import { GelCanvas } from '../components/gel/GelCanvas';
import { GelOverlay, type BandLaneFragment } from '../components/gel/GelOverlay';
import { MicrotubeRow } from '../components/gel/MicrotubeRow';
import { SettingsButton } from '../components/gel/SettingsButton';
import { TimelineSlider } from '../components/gel/TimelineSlider';
import { LoupePortalLayer } from '../components/gel/LoupePortalLayer';
import { Stage } from '../components/stage/Stage';
import { Brace } from '../components/stage/Brace';
import { SampleViewPlaceholder } from '../components/stage/SampleViewPlaceholder';
import { InspectorPanel } from '../components/inspector/InspectorPanel';
import { fragToBands } from '../lib/sim/gelSim';
import { deserializeFile } from '../lib/gel/serialize';
import { getVisibleSampleLane, isInspectorVisible } from '../lib/gel/gelState';
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

  // Left panel: microtube row floats above the gel rect (in the same vertical
  // band as the Sample/Gel panel headers). The gel canvas + overlay fill the
  // panel, and the time slider sits below.
  const MICROTUBE_ROW_H = 44;
  const leftPanel = (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: -MICROTUBE_ROW_H,
          height: MICROTUBE_ROW_H,
        }}
      >
        <MicrotubeRow />
      </div>
      <GelCanvas bands={bands} gelSize={state.gelSize} pixelsPerUnit={state.pixelsPerUnit} />
      <GelOverlay bands={bands} bandToLaneFragment={bandToLaneFragment} />
      <div style={{ position: 'absolute', right: -40, bottom: -40 }}>
        <SettingsButton />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 40,
          top: '100%',
          marginTop: 16,
        }}
      >
        <TimelineSlider />
      </div>
    </div>
  );

  return (
    <div
      data-testid="gel-page"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{ minHeight: '100vh', overflow: 'hidden' }}
    >
      <Stage
        left={leftPanel}
        middle={getVisibleSampleLane(state) !== null ? <SampleViewPlaceholder /> : null}
        right={isInspectorVisible(state) ? <InspectorPanel /> : null}
        brace={isInspectorVisible(state) ? <Brace /> : null}
      />
      <div
        data-testid="selection-info"
        style={{
          position: 'fixed',
          bottom: 8,
          left: 8,
          fontSize: 13,
          color: 'var(--color-ink-muted)',
          background: 'rgba(255,255,255,0.85)',
          padding: '2px 6px',
          borderRadius: 3,
          pointerEvents: 'none',
        }}
      >
        {selectedFrag
          ? `lane ${state.selectedLane} fragment ${state.selectedFragmentIndex}: ${selectedFrag.bases} bp, ${selectedFrag.mass} ng`
          : selectedSample
            ? `lane ${state.selectedLane}: ${selectedSample.fragments.length} fragments — click or tab through bands`
            : `lane ${state.selectedLane}: empty`}
      </div>
      {dropError && (
        <div
          data-testid="drop-error"
          style={{
            position: 'fixed',
            top: 8,
            right: 8,
            color: '#c44',
            fontSize: 12,
            background: '#fff',
            padding: '4px 8px',
            borderRadius: 4,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          {dropError}
        </div>
      )}
      <LoupePortalLayer />
    </div>
  );
}

export function GelPage() {
  return (
    <GelProvider>
      <GelInner />
    </GelProvider>
  );
}
