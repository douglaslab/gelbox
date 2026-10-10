import { useEffect, useRef, useState } from 'react';
import { LAYOUT } from '../../lib/layout/layout';
import { sampleKeyAction } from '../../lib/gel/sampleKeyboard';
import { useGelState, useGelDispatch, useGelStore } from '../gel/GelContext';
import { getVisibleSampleLane } from '../../lib/gel/gelState';
import { resolveAssetUrl, dprFallbackOnError } from '../../lib/layout/assets';
import { MolecularSimCanvas } from './MolecularSimCanvas';

/**
 * Middle "Sample" panel. Hosts the molecular-sim canvas and
 * the C++-style header (microtube glyph in a blue circle + "Sample" text).
 *
 * The panel slot itself is sized + positioned by `<Stage>`. Inside, we
 * render a square background rect (matching `mMolecularSimBkgndColor`)
 * with the canvas filling it.
 */
export function SampleView() {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const store = useGelStore();
  const [focused,setFocused] = useState(false);
  const [hovered,setHovered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
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

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false); }}
      onPointerDownCapture={() => rootRef.current?.focus({ preventScroll: true })}
      onKeyDown={e => {
        const action = sampleKeyAction(e.key, e.shiftKey, state);
        if (action) { e.preventDefault(); e.stopPropagation(); dispatch(action); }
      }}
      data-testid="sample-view"
      data-lane-index={visibleLane ?? -1}
      style={{ position: 'relative', width: '100%', height: '100%', outline: 'none' }}
    >
      <button type="button" aria-label="New species" data-testid="new-species"
        onClick={() => {
          if (visibleLane === null) return;
          store.createSpecies(visibleLane);
          rootRef.current?.focus({ preventScroll: true });
        }}
        style={{ position: 'absolute', right: 0, top: '100%', marginTop: LAYOUT.btnGutter,
          width: 32, height: 32, border: 0, padding: 0, background: 'transparent', cursor: 'pointer' }}>
        <img src={resolveAssetUrl('/assets/new-btn.png')} onError={dprFallbackOnError} alt="" width={32} height={32} />
      </button>
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
        }}
      >
        <img
          data-testid="sample-header-tube"
          src={resolveAssetUrl('/assets/microtube1500ul.png')}
          alt=""
          onError={dprFallbackOnError}
          style={{
            position: 'absolute',
            left: r - LAYOUT.sampleViewMicrotubeWidth / 2,
            bottom: LAYOUT.sampleViewMicrotubeGutter - LAYOUT.sampleViewMicrotubeBkgndGutter,
            width: LAYOUT.sampleViewMicrotubeWidth,
            height: 'auto',
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

      {/* Native square frame: inset shadow, thin border and focus rings. */}
      <div aria-hidden style={{position:'absolute',left:2,top:4,right:2,height:'100%',
        background:`rgba(0,0,0,${focused ? .25 : .15})`}}/>
      <div
        ref={innerRef}
        data-testid="sample-frame"
        onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}
        style={{
          position: 'absolute',
          inset: 0,
          background: LAYOUT.molecularSimBkgndColor,
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        {visibleLane !== null && size && size.w > 0 && size.h > 0 && (
          <MolecularSimCanvas laneIndex={visibleLane} width={size.w} height={size.h} />
        )}
      </div>
      <div aria-hidden style={{position:'absolute',inset:0,pointerEvents:'none',
        outline:`1px solid ${focused || hovered ? '#666' : '#ccc'}`,
        boxShadow:focused ? '0 0 0 2px rgba(0,0,255,.1), inset 0 0 0 2px rgba(0,0,255,.1)' : undefined}}/>
    </div>
  );
}
