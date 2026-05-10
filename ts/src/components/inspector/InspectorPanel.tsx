import { useGelState } from '../gel/GelContext';
import { FragmentView } from './FragmentView';
import { SampleSettingsView } from './SampleSettingsView';
import { GelSettingsView } from './GelSettingsView';

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
      <div data-testid="inspector-panel" style={{ width: '100%', height: '100%' }}>
        <GelSettingsView />
      </div>
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

