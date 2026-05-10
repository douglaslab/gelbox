import { useGelState } from '../gel/GelContext';
import { FragmentView } from './FragmentView';
import { SampleSettingsView } from './SampleSettingsView';
import { GelSettingsView } from './GelSettingsView';
import { selectInspectorView } from '../../lib/gel/gelState';

/**
 * Routes the right-panel content via `selectInspectorView` — the single
 * source of truth for the gel-settings / sample-settings / fragment swap
 * matrix. Returning 'none' means the panel is hidden by GelPage; this
 * component never renders for that case (GelPage gates the slot).
 */
export function InspectorPanel() {
  const state = useGelState();
  const view  = selectInspectorView(state);

  switch (view) {
    case 'gel-settings':
      return (
        <div data-testid="inspector-panel" data-view="gel-settings" style={{ width: '100%', height: '100%' }}>
          <GelSettingsView />
        </div>
      );
    case 'sample-settings':
      return (
        <div data-testid="inspector-panel" data-view="sample-settings" style={{ width: '100%', height: '100%' }}>
          <SampleSettingsView />
        </div>
      );
    case 'fragment':
      return (
        <div data-testid="inspector-panel" data-view="fragment" style={{ width: '100%', height: '100%' }}>
          <FragmentView />
        </div>
      );
    case 'none':
      return null;
  }
}

