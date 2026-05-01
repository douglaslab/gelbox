import { LAYOUT } from '../../lib/layout/layout';

/**
 * Placeholder for the middle "Sample" panel. M15 will replace this with a
 * proper SampleView containing the molecular simulation canvas.
 */
export function SampleViewPlaceholder() {
  return (
    <div
      style={{
        width:  '100%',
        height: '100%',
        position: 'relative',
        background: LAYOUT.molecularSimBkgndColor,
        borderRadius: LAYOUT.gelMicrotubeBkgndCornerRadius,
      }}
      data-testid="sample-view-placeholder"
    >
      <h2
        style={{
          position: 'absolute',
          left:     `${LAYOUT.sampleViewHeaderBaselinePos.x}px`,
          top:      `${LAYOUT.sampleViewHeaderBaselinePos.y}px`,
          margin:   0,
          font:     `${LAYOUT.headFontWeight} ${LAYOUT.headFontSize}px ${LAYOUT.headFont}`,
          color:    LAYOUT.headFontColor,
          lineHeight: 1,
        }}
      >
        {LAYOUT.sampleViewHeaderStr}
      </h2>
    </div>
  );
}
