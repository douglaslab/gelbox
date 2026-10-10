import { useCallback, useRef, useState, type CSSProperties } from 'react';
import {
  type SliderConfig,
  applyNotchSnap,
  calcNormalizedValue,
  getMappedValue,
} from '../../lib/slider/slider';
import { resolveAssetUrl } from '../../lib/layout/assets';
import styles from './SliderView.module.css';

export interface SliderViewProps {
  config: SliderConfig;
  value: number;
  onChange: (mappedValue: number) => void;
  iconLo?: string;
  iconHi?: string;
  iconSize?: { x: number; y: number };
  iconGutter?: number;
  width?: number;
  graphValues?: number[];
  onGraphChange?: (values: number[]) => void;
  /** Bar style only — fill color (left of handle). Defaults to LAYOUT.bufferViewSliderFillColor. */
  barFillColor?:  string;
  /** Bar style only — empty color (right of handle). Defaults to LAYOUT.bufferViewSliderEmptyColor. */
  barEmptyColor?: string;
  /** Bar style only — corner radius in px. Defaults to 4. */
  barCornerRadius?: number;
  /** Bar style only — track height in px. Defaults to 23. */
  barHeight?: number;
  style?: CSSProperties;
  testId?: string;
}

const DEFAULT_ICON_SIZE   = { x: 26, y: 26 };
const DEFAULT_ICON_GUTTER = 16;
const DEFAULT_WIDTH       = 217;
const DEFAULT_SNAP_DIST   = 0.04;

export function SliderView({
  config,
  value,
  onChange,
  iconLo,
  iconHi,
  iconSize   = DEFAULT_ICON_SIZE,
  iconGutter = DEFAULT_ICON_GUTTER,
  width      = DEFAULT_WIDTH,
  graphValues,
  onGraphChange,
  barFillColor,
  barEmptyColor,
  barCornerRadius,
  barHeight,
  style,
  testId,
}: SliderViewProps) {
  const enabled = config.enabled !== false;
  const trackRef = useRef<HTMLDivElement | null>(null);

  const normalized = calcNormalizedValue(value, config);

  const valueAtPointer = useCallback((pointerX: number): number => {
    if (!trackRef.current) return value;
    const r = trackRef.current.getBoundingClientRect();
    const t = (pointerX - r.left) / r.width;
    const clamped = Math.max(0, Math.min(1, t));
    const snapped = applyNotchSnap(
      clamped,
      config.notches ?? [],
      config.notchAction ?? 'none',
      config.notchSnapDist ?? DEFAULT_SNAP_DIST,
    );
    return getMappedValue(snapped, config);
  }, [config, value]);

  function onPointerDownTrack(e: React.PointerEvent<HTMLDivElement>) {
    if (!enabled) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    onChange(valueAtPointer(e.clientX));
  }

  function onPointerMoveTrack(e: React.PointerEvent<HTMLDivElement>) {
    if (!enabled) return;
    if (e.buttons !== 1) return;
    e.preventDefault();
    onChange(valueAtPointer(e.clientX));
  }

  function onIconClick(which: 'lo' | 'hi') {
    if (!enabled) return;
    onChange(which === 'lo' ? config.valueMin : config.valueMax);
  }

  function onGraphPointerDown(idx: number) {
    return (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled || !graphValues || !onGraphChange) return;
      e.preventDefault();
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      const trackHeight = target.parentElement!.getBoundingClientRect().height;

      function update(clientY: number) {
        const r = target.parentElement!.getBoundingClientRect();
        const yFromBottom = r.bottom - clientY;
        const v = Math.max(0, Math.min(1, yFromBottom / trackHeight));
        const next = graphValues!.slice();
        next[idx] = v;
        onGraphChange!(next);
      }

      update(e.clientY);

      const move = (ev: PointerEvent) => update(ev.clientY);
      const up = () => {
        target.releasePointerCapture(e.pointerId);
        target.removeEventListener('pointermove', move);
        target.removeEventListener('pointerup', up);
      };
      target.addEventListener('pointermove', move);
      target.addEventListener('pointerup', up);
    };
  }

  const labelStr = config.formatValue?.(value);

  return (
    <div
      className={`${styles.root} ${enabled ? '' : styles.disabled}`}
      style={{ width, ...style }}
      data-testid={testId}
      aria-disabled={!enabled || undefined}
    >
      {iconLo && (
        <SliderIcon
          path={iconLo}
          slot={iconSize}
          natural={config.style === 'slider'}
          high={false}
          onClick={() => onIconClick('lo')}
          testId={testId ? `${testId}-icon-lo` : undefined}
        />
      )}

      {iconLo && <div style={{ width: iconGutter, flex: '0 0 auto' }} />}

      {config.style === 'slider' && (
        <div
          ref={trackRef}
          className={styles.track}
          onPointerDown={onPointerDownTrack}
          onPointerMove={onPointerMoveTrack}
          data-testid={testId ? `${testId}-track` : undefined}
        >
          <div className={styles.line} />
          {(config.notchAction !== 'none') && (config.notches ?? []).map((n, i) => (
            <div key={i} className={styles.notch} style={{ left: `${n * 100}%` }} />
          ))}
          <div
            className={styles.handle}
            style={{ left: `calc(${normalized * 100}% - 8px)` }}
            data-testid={testId ? `${testId}-handle` : undefined}
          />
          {labelStr && (
            <div className={styles.sliderLabel} style={{ left: `${normalized * 100}%` }}>
              {labelStr}
            </div>
          )}
        </div>
      )}

      {config.style === 'bar' && (
        <div
          ref={trackRef}
          className={styles.bar}
          style={{
            background: enabled ? barEmptyColor : `color-mix(in srgb, ${barEmptyColor ?? '#E8EBF1'} 50%, transparent)`,
            borderRadius:  barCornerRadius ?? undefined,
            height:        barHeight ?? undefined,
          }}
          onPointerDown={onPointerDownTrack}
          onPointerMove={onPointerMoveTrack}
          data-testid={testId ? `${testId}-track` : undefined}
        >
          <div
            className={styles.barFill}
            style={{
              width:      `${normalized * 100}%`,
              background: enabled ? barFillColor : `color-mix(in srgb, ${barFillColor ?? '#AEB6C3'} 50%, transparent)`,
            }}
          />
          {(config.notchAction === 'drawOnly' || config.notchAction === 'snap' || config.notchAction === 'nearest')
            && (config.notches ?? []).map((n, i) => (
              <div key={i} className={styles.notch} style={{ left: `${n * 100}%` }} />
            ))}
          {labelStr && (
            <div
              className={styles.barLabel}
              style={
                normalized > 0.5
                  ? { right: `calc(${(1 - normalized) * 100}% + 8px)` }
                  : { left:  `calc(${normalized * 100}% + 8px)` }
              }
            >
              {labelStr}
            </div>
          )}
        </div>
      )}

      {config.style === 'graph' && graphValues && (
        <div className={styles.graph}>
          <div className={styles.graphCap} />
          {graphValues.map((v, i) => (
            <div
              key={i}
              className={styles.graphCol}
              style={{ height: `${Math.max(1, v * 100)}%` }}
              onPointerDown={onGraphPointerDown(i)}
              data-testid={testId ? `${testId}-col-${i}` : undefined}
            />
          ))}
        </div>
      )}

      {iconHi && <div style={{ width: iconGutter, flex: '0 0 auto' }} />}

      {iconHi && (
        <SliderIcon
          path={iconHi}
          slot={iconSize}
          natural={config.style === 'slider'}
          high={true}
          onClick={() => onIconClick('hi')}
          testId={testId ? `${testId}-icon-hi` : undefined}
        />
      )}
    </div>
  );
}


/** Native Slider::doLayoutInWidth keeps image size separate from its pick slot. */
function SliderIcon({path,slot,natural,high,onClick,testId}:{
  path:string;slot:{x:number;y:number};natural:boolean;high:boolean;
  onClick:()=>void;testId?:string;
}) {
  const src=resolveAssetUrl(path);
  const [decoded,setDecoded]=useState<{src:string;x:number;y:number}|null>(null);
  const size=natural&&decoded?.src===src?decoded:slot;
  // Native roundf snaps absolute positions. The low icon starts at x=0;
  // the high icon starts at a positive integer position within the slider.
  const round=(v:number)=>Math.sign(v)*Math.round(Math.abs(v));
  const dx=(slot.x-size.x)/2,dy=(slot.y-size.y)/2;
  return <span className={styles.iconSlot} style={{width:slot.x,height:slot.y}} onClick={onClick}>
    <img src={src} alt="" className={styles.icon} data-testid={testId}
      onLoad={e=>{
        const img=e.currentTarget,scale=src.endsWith('@2x.png')?2:1;
        setDecoded({src,x:img.naturalWidth/scale,y:img.naturalHeight/scale});
      }}
      style={{position:'absolute',left:high?Math.round(dx):round(dx),top:round(dy),
        width:size.x,height:size.y,maxWidth:'none'}}/>
  </span>;
}
