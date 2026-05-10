import type { ReactNode } from 'react';
import { useGelState } from '../gel/GelContext';
import { FragmentView } from './FragmentView';
import { SampleSettingsView } from './SampleSettingsView';
import { LAYOUT } from '../../lib/layout/layout';

/**
 * Routes the right-panel content based on inspector mode + selection state.
 *
 * Mode resolution (matches C++ Gelbox behavior):
 * - inspectorMode === 'gel-settings'                            → GelSettingsView (M17 stub)
 * - microtube selected, fragment NOT selected, sample exists    → SampleSettingsView "Buffer + Dyes" (M16 stub)
 * - else (default)                                              → FragmentView "Species"
 */
export function InspectorPanel() {
  const state = useGelState();
  const sample = state.samples[state.selectedLane];

  if (state.inspectorMode === 'gel-settings') {
    return (
      <PanelShell heading={LAYOUT.gelSettingsHeaderStr}>
        <ModeStub label="Gel settings — coming in M17" />
      </PanelShell>
    );
  }

  if (sample !== null && state.selectedFragmentIndex === null) {
    return (
      <div data-testid="inspector-panel" style={{ width: '100%', height: '100%' }}>
        <SampleSettingsView />
      </div>
    );
  }

  // Default: FragmentView renders its own heading internally.
  return (
    <div data-testid="inspector-panel" style={{ width: '100%', height: '100%' }}>
      <FragmentView />
    </div>
  );
}

function PanelShell({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div
      data-testid="inspector-panel"
      style={{ width: '100%', height: '100%', position: 'relative', background: '#FFFFFF' }}
    >
      <h2
        style={{
          position: 'absolute',
          left:     `${LAYOUT.gelSettingsHeaderBaselinePos.x}px`,
          top:      `${LAYOUT.gelSettingsHeaderBaselinePos.y}px`,
          margin:   0,
          font:     `${LAYOUT.headFontWeight} ${LAYOUT.headFontSize}px ${LAYOUT.headFont}`,
          color:    LAYOUT.headFontColor,
          lineHeight: 1,
        }}
      >
        {heading}
      </h2>
      <div style={{ paddingTop: 60 }}>{children}</div>
    </div>
  );
}

function ModeStub({ label }: { label: string }) {
  return (
    <div style={{ padding: 24, color: '#666', fontFamily: 'Inter', fontSize: 13 }}>
      {label}
    </div>
  );
}
