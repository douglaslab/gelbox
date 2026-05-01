import { useEffect, useState, type ReactNode } from 'react';
import { LAYOUT } from '../../lib/layout/layout';
import styles from './Stage.module.css';

export interface StageProps {
  left:   ReactNode;
  middle: ReactNode;
  right:  ReactNode;
  brace?: ReactNode;
}

const NARROW_BREAKPOINT = 1024;

function useViewportScale(): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= LAYOUT.windowSize.x) {
        setScale(1);
      } else if (w >= NARROW_BREAKPOINT) {
        setScale(w / LAYOUT.windowSize.x);
      } else {
        setScale(1);
      }
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return scale;
}

/**
 * Three-panel stage matching the C++ Gelbox layout (1365x768).
 * - Wide (>= 1365px): static absolute-positioned panels at exact LAYOUT coords.
 * - Mid (1024-1364px): same layout, CSS-scaled to fit viewport width.
 * - Narrow (< 1024px): single-column stack (gel, sample, inspector); brace hidden.
 */
export function Stage({ left, middle, right, brace }: StageProps) {
  const scale = useViewportScale();

  const leftStyle = {
    left:   `${LAYOUT.gelTopLeft.x}px`,
    top:    `${LAYOUT.gelTopLeft.y}px`,
    width:  `${LAYOUT.gelSize.x}px`,
    height: `${LAYOUT.gelSize.y}px`,
  };

  const middleX = LAYOUT.gelTopLeft.x + LAYOUT.gelSize.x + LAYOUT.gelToSampleGutter;
  const middleStyle = {
    left:   `${middleX}px`,
    top:    `${LAYOUT.gelTopLeft.y}px`,
    width:  `${LAYOUT.sampleSize.x}px`,
    height: `${LAYOUT.sampleSize.y}px`,
  };

  const braceX = middleX + LAYOUT.sampleSize.x + LAYOUT.sampleToBraceGutter;
  const braceStyle = {
    left:   `${braceX}px`,
    top:    `${LAYOUT.gelTopLeft.y + (LAYOUT.gelSize.y - LAYOUT.braceSize.y) / 2}px`,
    width:  `${LAYOUT.braceSize.x}px`,
    height: `${LAYOUT.braceSize.y}px`,
  };

  const rightX = braceX + LAYOUT.braceSize.x;
  const rightStyle = {
    left:   `${rightX}px`,
    top:    `${LAYOUT.gelTopLeft.y}px`,
    width:  `${LAYOUT.gelSettingsSize.x}px`,
    height: `${LAYOUT.gelSettingsSize.y}px`,
  };

  const stageStyle = scale < 1 && scale > 0
    ? { transform: `scale(${scale})` }
    : undefined;

  return (
    <div className={styles.stage} style={stageStyle} data-testid="stage">
      <div className={styles.slot} style={leftStyle}   data-testid="stage-left">{left}</div>
      <div className={styles.slot} style={middleStyle} data-testid="stage-middle">{middle}</div>
      {brace && (
        <div className={styles.braceWrap} style={braceStyle} data-testid="stage-brace">{brace}</div>
      )}
      <div className={styles.slot} style={rightStyle}  data-testid="stage-right">{right}</div>
    </div>
  );
}
