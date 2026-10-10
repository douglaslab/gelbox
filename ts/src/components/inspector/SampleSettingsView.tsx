import {InspectorHeadings} from './InspectorHeadings';
import { LAYOUT } from '../../lib/layout/layout';
import { useGelDispatch, useGelState } from '../gel/GelContext';
import { BufferView } from './BufferView';
import { DyeRow } from './DyeRow';
import { DYE_COUNT } from '../../lib/sim/dye';
import type { Buffer } from '../../lib/sim/buffer';

/**
 * "Buffer + Dyes" inspector — port of `SampleSettingsView.cpp`.
 *
 * Layout (from Layout.h, ported field-by-field into LAYOUT.ts):
 *   - Heading at `sampleSettingsHeaderBaselinePos`.
 *   - BufferView block at `sampleBufferViewTopLeft`, `bufferViewSize` tall.
 *   - "Dyes" subhead at `sampleSettingsRuleTopLeft`.
 *   - Four dye rows starting at `sampleSettingsSlidersTopLeft`, vertical
 *     stride `sampleSettingsSliderVOffset`.
 *
 * All slider edits round-trip through the gelState reducer
 * (`SET_SAMPLE_BUFFER`, `SET_DYE_MASS`).
 */
export function SampleSettingsView() {
  const state    = useGelState();
  const dispatch = useGelDispatch();

  // The lane the inspector is targeting — `selectedLane` for now (M18 will
  // unify all "what does the inspector apply to?" logic into a single
  // selector). If there's no sample, render an empty stub.
  const lane = state.selectedLane;
  const sample = state.samples[lane];

  if (!sample) {
    return (
      <div data-testid="sample-settings-view" style={{ padding: 24, color: '#666' }}>
        No sample to edit.
      </div>
    );
  }

  // Find current per-dye mass: lookup the dye fragment, default to 0 if not
  // present (create on first write, including zero — see SET_DYE_MASS).
  const dyeMass = (dye: number): number => {
    const f = sample.fragments.find((f) => f.dye === dye);
    return f ? f.mass : 0;
  };

  function setBuffer(next: Buffer) {
    dispatch({ type: 'SET_SAMPLE_BUFFER', laneIndex: lane, buffer: next });
  }
  function setDyeMass(dye: number, mass: number) {
    dispatch({ type: 'SET_DYE_MASS', laneIndex: lane, dye, mass });
  }

  // The first dye row sits at sampleSettingsSlidersTopLeft. The "Dyes" subhead
  // sits one `sampleSettingsSlidersToDyeLabel` above the first row.
  const slidersTop = LAYOUT.sampleSettingsSlidersTopLeft.y;

  return (
    <div
      data-testid="sample-settings-view"
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <InspectorHeadings kind="sample-settings"/>

      {/* Buffer panel — its own absolute coords inside the SampleSettingsView. */}
      <BufferView
        buffer={sample.buffer}
        onChange={setBuffer}
        topLeft={LAYOUT.sampleBufferViewTopLeft}
        testId="sample-buffer-view"
      />

      {/* 4 dye rows. */}
      {Array.from({ length: DYE_COUNT }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left:  LAYOUT.sampleSettingsSlidersTopLeft.x - 90,
            top:   slidersTop + i * LAYOUT.sampleSettingsSliderVOffset,
            width: LAYOUT.bufferViewSliderBarSize.x + 90 + LAYOUT.bufferViewSlidersIconGutter + 26,
          }}
        >
          <DyeRow
            dye={i}
            mass={dyeMass(i)}
            onChange={(m) => setDyeMass(i, m)}
            width={LAYOUT.bufferViewSliderBarSize.x}
          />
        </div>
      ))}
    </div>
  );
}
