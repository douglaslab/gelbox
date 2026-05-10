import { useEffect, useRef, useState } from 'react';
import { LAYOUT } from '../../lib/layout/layout';
import { useGelState } from '../gel/GelContext';
import { getVisibleSampleLane } from '../../lib/gel/gelState';
import { resolveAssetUrl, dprFallbackOnError } from '../../lib/layout/assets';
import { MolecularSimCanvas } from './MolecularSimCanvas';

/**
 * Middle "Sample" panel. Hosts the (placeholder) molecular-sim canvas and
 * the C++-style header (microtube glyph in a blue circle + "Sample" text).
 *
 * The panel slot itself is sized + positioned by `<Stage>`. Inside, we
 * render a rounded background rect (matching `mMolecularSimBkgndColor`)
 * with the canvas filling it.
 */
export function SampleView() {
  const state = useGelState();
  const visibleLane = getVisibleSampleLane(state);
  const innerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    function update() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    }
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Mirror C++ SampleView::drawHeader (SampleView.cpp:154):
  //   - blue circle at upperLeft + (r, -r - gutter)
  //   - microtube icon centered in the circle
  //   - "Sample" heading at sampleViewHeaderBaselinePos
  const r = LAYOUT.sampleViewMicrotubeBkgndRadius;          // 20
  const gutter = LAYOUT.sampleViewMicrotubeBkgndGutter;     // 11
  const circleSize = r * 2;                                  // 40
  const circleTop  = -r - gutter - r;                        // = -2r - gutter (top edge of circle)
  // Microtube glyph height: keep visually consistent with MicrotubeRow's
  // 36px icon. Width auto-resolves via the PNG's natural 47:89 aspect.
  const tubeHeight = 32;

  return (
    <div
      data-testid="sample-view"
      data-lane-index={visibleLane ?? -1}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {/* Selected-lane blue circle in upper-left of panel. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top:  circleTop,
          width:  circleSize,
          height: circleSize,
          borderRadius: '50%',
          background: LAYOUT.gelMicrotubeBkgndColorSelected,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={resolveAssetUrl('/assets/microtube1500ul.png')}
          alt=""
          onError={dprFallbackOnError}
          style={{
            height: tubeHeight,
            width:  'auto',
            display: 'block',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      </div>

      {/* "Sample" heading text. */}
      <h2
        style={{
          position: 'absolute',
          left:     `${LAYOUT.sampleViewHeaderBaselinePos.x}px`,
          top:      `${LAYOUT.sampleViewHeaderBaselinePos.y}px`,
          margin:   0,
          font:     `${LAYOUT.headFontWeight} ${LAYOUT.headFontSize}px ${LAYOUT.headFont}`,
          color:    LAYOUT.headFontColor,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {LAYOUT.sampleViewHeaderStr}
      </h2>

      {/* Rounded background + canvas. */}
      <div
        ref={innerRef}
        style={{
          position: 'absolute',
          inset: 0,
          background: LAYOUT.molecularSimBkgndColor,
          borderRadius: LAYOUT.gelMicrotubeBkgndCornerRadius,
          overflow: 'hidden',
        }}
      >
        {visibleLane !== null && size && size.w > 0 && size.h > 0 && (
          <MolecularSimCanvas laneIndex={visibleLane} width={size.w} height={size.h} />
        )}
      </div>
    </div>
  );
}
