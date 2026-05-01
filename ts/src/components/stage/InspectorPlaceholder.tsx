import { LAYOUT } from '../../lib/layout/layout';
import { GelControls } from '../chrome/GelControls';
import { FileControls } from '../chrome/FileControls';

/**
 * Placeholder for the right "Inspector" panel. M14/M16/M17 will replace this with
 * GelSettingsView / SampleSettingsView / FragmentView. For now, hosts the existing
 * GelControls + FileControls so the app stays usable.
 */
export function InspectorPlaceholder() {
  return (
    <div
      style={{
        width:    '100%',
        height:   '100%',
        position: 'relative',
        background: '#FFFFFF',
      }}
      data-testid="inspector-placeholder"
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
        {LAYOUT.gelSettingsHeaderStr}
      </h2>
      <div style={{ position: 'absolute', top: 32, left: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <GelControls />
        <FileControls />
      </div>
    </div>
  );
}
