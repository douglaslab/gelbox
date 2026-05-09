import { useEffect, useState, type ReactNode } from 'react';
import { LAYOUT } from '../../lib/layout/layout';
import styles from './Stage.module.css';

export interface StageProps {
  left:   ReactNode;
  /** Contents of the middle Sample slot. Pass null to leave the slot empty. */
  middle: ReactNode;
  /** Contents of the right Inspector slot. Pass null to leave the slot empty. */
  right:  ReactNode;
  /** Brace decoration between Sample and Inspector. Pass null to omit. */
  brace?: ReactNode;
}

// Browser-friendly margins replacing the C++ desktop-app chrome offset.
// gelTopLeft (208, 124) is from a fixed-window app design; in the browser
// the surrounding chrome is the page itself, so we use small inner padding
// and let the panel labels (Sample/Gel) sit at PAD_Y - headingGutter.
const PAD_X = 32;
const PAD_Y = 60;
const STAGE_W_FULL = PAD_X * 2 + LAYOUT.gelSize.x + LAYOUT.gelToSampleGutter
              + LAYOUT.sampleSize.x + LAYOUT.sampleToBraceGutter
              + LAYOUT.braceSize.x + LAYOUT.gelSettingsSize.x;
const STAGE_W_GEL_ONLY = PAD_X * 2 + LAYOUT.gelSize.x;
const STAGE_H = PAD_Y + LAYOUT.gelSize.y + 80; // 80px under the gel for the time slider

// Below this viewport width we hide Sample/Species (gel-only) and uniformly
// scale the entire stage down. Above it, Sample/Species are shown if the
// user has selected something (via showRight prop).
const PANELS_BREAKPOINT = STAGE_W_FULL;
// Stop scaling further once the gel-only view becomes this size.
const NARROW_BREAKPOINT = STAGE_W_GEL_ONLY * 0.6;

function useViewportScale(targetWidth: number): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= targetWidth) setScale(1);
      else setScale(Math.max(NARROW_BREAKPOINT / targetWidth, w / targetWidth));
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [targetWidth]);

  return scale;
}

/**
 * Three-panel stage. Sample/Species/brace are only shown when the user has
 * engaged with something (via showRight prop) AND the viewport has room for
 * the full panel row. Below PANELS_BREAKPOINT we force gel-only and uniformly
 * scale the entire stage down to fit the viewport, clamping at NARROW_BREAKPOINT.
 * Multi-column reflow / single-column mobile is intentionally disabled.
 */
export function Stage({ left, middle, right, brace }: StageProps) {
  const [viewportW, setViewportW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : PANELS_BREAKPOINT,
  );
  useEffect(() => {
    const onR = () => setViewportW(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  // Below PANELS_BREAKPOINT we force the gel-only layout — there isn't room
  // for the right side at any reasonable scale. Above it we always reserve
  // all three slots so the gel doesn't shift when the sample/inspector
  // contents toggle on selection. Mobile/tablet revisit later.
  const showRightSlots = viewportW >= PANELS_BREAKPOINT;
  const stageWidth = showRightSlots ? STAGE_W_FULL : STAGE_W_GEL_ONLY;
  const scale = useViewportScale(stageWidth);

  const leftStyle = {
    left:   `${PAD_X}px`,
    top:    `${PAD_Y}px`,
    width:  `${LAYOUT.gelSize.x}px`,
    height: `${LAYOUT.gelSize.y}px`,
  };

  const middleX = PAD_X + LAYOUT.gelSize.x + LAYOUT.gelToSampleGutter;
  const middleStyle = {
    left:   `${middleX}px`,
    top:    `${PAD_Y}px`,
    width:  `${LAYOUT.sampleSize.x}px`,
    height: `${LAYOUT.sampleSize.y}px`,
  };

  const braceX = middleX + LAYOUT.sampleSize.x + LAYOUT.sampleToBraceGutter;
  const braceStyle = {
    left:   `${braceX}px`,
    top:    `${PAD_Y + (LAYOUT.gelSize.y - LAYOUT.braceSize.y) / 2}px`,
    width:  `${LAYOUT.braceSize.x}px`,
    height: `${LAYOUT.braceSize.y}px`,
  };

  const rightX = braceX + LAYOUT.braceSize.x;
  const rightStyle = {
    left:   `${rightX}px`,
    top:    `${PAD_Y}px`,
    width:  `${LAYOUT.gelSettingsSize.x}px`,
    height: `${LAYOUT.gelSettingsSize.y}px`,
  };

  const stageStyle = scale < 1 && scale > 0
    ? { transform: `scale(${scale})` }
    : undefined;

  // When scaling, the transformed stage's logical box still occupies its
  // un-scaled size in the document flow. Wrap in an outer box sized to the
  // visual (scaled) extents so the page layout reserves the right space and
  // we can center the stage horizontally within the viewport.
  const outerStyle: React.CSSProperties = {
    width:  stageWidth * scale,
    height: STAGE_H * scale,
    margin: '0 auto',
    position: 'relative',
  };

  return (
    <div style={outerStyle}>
      <div
        className={styles.stage}
        style={{
          width:  stageWidth,
          height: STAGE_H,
          margin: 0,
          ...stageStyle,
        }}
        data-testid="stage"
      >
        <div className={styles.slot} style={leftStyle}   data-testid="stage-left">{left}</div>
        {showRightSlots && (
          <>
            {/* Slot divs are always rendered when there's room — empty when
                the caller passes null contents — so the gel position never
                shifts when the user selects/deselects bands. */}
            <div className={styles.slot} style={middleStyle} data-testid="stage-middle">{middle}</div>
            {brace && (
              <div className={styles.braceWrap} style={braceStyle} data-testid="stage-brace">{brace}</div>
            )}
            <div className={styles.slot} style={rightStyle}  data-testid="stage-right">{right}</div>
          </>
        )}
      </div>
    </div>
  );
}
