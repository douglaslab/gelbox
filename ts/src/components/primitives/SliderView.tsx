import {SliderScenePaint} from './SliderScenePaint';
import {useSharedPresentation} from '../gel/ScenePresentation';
import {useNativeButtonTint} from '../gel/useNativeButtonTint';
import { useCallback, useRef, useState, useLayoutEffect, type CSSProperties } from 'react';
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
  presentation?: {viewKey:string;order:number};
}

const DEFAULT_ICON_SIZE   = { x: 26, y: 26 };
const DEFAULT_ICON_GUTTER = 16;
const DEFAULT_WIDTH       = 217;
const DEFAULT_SNAP_DIST_PX = 4;

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
  presentation,
}: SliderViewProps) {
  const registry=useSharedPresentation(),element=useRef<HTMLDivElement>(null);
  const shared=Boolean(registry&&presentation&&config.style!=='bar');
  const enabled = config.enabled !== false;
  const trackRef = useRef<HTMLDivElement | null>(null);

  const normalized = calcNormalizedValue(value, config);

  const dragRef = useRef<{pointerId:number;startX:number;startValue:number;
    handle:boolean;lastX:number;lastY:number}|null>(null);

  const valueAtNormalized = useCallback((t:number,width:number):number => {
    const snapped = applyNotchSnap(
      Math.max(0,Math.min(1,t)), config.notches ?? [],
      config.notchAction ?? 'none',
      config.notchSnapDist ?? DEFAULT_SNAP_DIST_PX / width,
    );
    return getMappedValue(snapped,config);
  },[config]);

  function onPointerDownTrack(e:React.PointerEvent<HTMLDivElement>) {
    if(!enabled||e.button!==0||dragRef.current)return;
    const r=e.currentTarget.getBoundingClientRect();
    const center=r.left+normalized*r.width;
    const handle=config.style==='slider'&&Math.abs(e.clientX-center)<=8&&
      e.clientY>=r.top&&e.clientY<=r.bottom;
    const inTrack=e.clientX>=r.left&&e.clientX<=r.right&&
      e.clientY>=r.top&&e.clientY<=r.bottom;
    if(!handle&&!inTrack)return;
    e.preventDefault();
    dragRef.current={pointerId:e.pointerId,startX:e.clientX,startValue:normalized,
      handle,lastX:e.clientX,lastY:e.clientY};
    e.currentTarget.setPointerCapture(e.pointerId);
    // Native stores the pre-click value even when mouseDown maps a track hit.
    if(inTrack)onChange(valueAtNormalized((e.clientX-r.left)/r.width,r.width));
  }

  function onPointerMoveTrack(e:React.PointerEvent<HTMLDivElement>) {
    const drag=dragRef.current;
    if(!enabled||!drag||drag.pointerId!==e.pointerId||e.buttons!==1)return;
    if(!e.currentTarget.hasPointerCapture(e.pointerId)) {dragRef.current=null;return;}
    if(e.clientX===drag.lastX&&e.clientY===drag.lastY)return;
    e.preventDefault();drag.lastX=e.clientX;drag.lastY=e.clientY;
    const r=e.currentTarget.getBoundingClientRect();
    const t=drag.handle?drag.startValue+(e.clientX-drag.startX)/r.width:
      (e.clientX-r.left)/r.width;
    onChange(valueAtNormalized(t,r.width));
  }

  function endTrackGesture(e:React.PointerEvent<HTMLDivElement>) {
    if(dragRef.current?.pointerId!==e.pointerId)return;
    dragRef.current=null;
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function onIconClick(which: 'lo' | 'hi') {
    if (!enabled) return;
    if(config.style==='graph'&&graphValues&&onGraphChange) {
      const next=graphValues.map(()=>0);
      if(next.length)next[which==='lo'?0:next.length-1]=1;
      graphLatest.current=next;onGraphChange(next);
    } else onChange(which === 'lo' ? config.valueMin : config.valueMax);
  }

  const graphLatest=useRef(graphValues);
  useLayoutEffect(()=>{graphLatest.current=graphValues;},[graphValues]);
  const graphPointer=useRef<number|null>(null);
  function updateGraph(e:React.PointerEvent<HTMLDivElement>) {
    const current=graphLatest.current;
    if(!current?.length||!onGraphChange)return;
    const r=e.currentTarget.getBoundingClientRect();
    const index=Math.max(0,Math.min(current.length-1,
      Math.round((e.clientX-r.left)/r.width*current.length-.5)));
    const quantized=getMappedValue((r.bottom-e.clientY)/r.height,
      {valueMin:0,valueMax:1,quantize:config.quantize});
    const value=applyNotchSnap(quantized,config.notches??[],config.notchAction??'none',
      config.notchSnapDist??DEFAULT_SNAP_DIST_PX/r.height);
    const next=current.slice();next[index]=value;
    graphLatest.current=next;onGraphChange(next);
  }
  function onGraphPointerDown(e:React.PointerEvent<HTMLDivElement>) {
    if(!enabled||e.button!==0||graphPointer.current!==null||!onGraphChange)return;
    e.preventDefault();graphPointer.current=e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);updateGraph(e);
  }
  function onGraphPointerMove(e:React.PointerEvent<HTMLDivElement>) {
    if(!enabled||graphPointer.current!==e.pointerId||e.buttons!==1)return;
    if(!e.currentTarget.hasPointerCapture(e.pointerId)){graphPointer.current=null;return;}
    e.preventDefault();updateGraph(e);
  }
  function endGraphGesture(e:React.PointerEvent<HTMLDivElement>) {
    if(graphPointer.current!==e.pointerId)return;
    graphPointer.current=null;
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }

  const labelStr = config.formatValue?.(value);

  return (
    <div
      ref={element}
      className={`${styles.root} ${enabled ? '' : styles.disabled}`}
      style={{ width, ...(config.style==='graph'?{height:iconSize.y}:{}), ...style, opacity:shared?0:style?.opacity }}
      data-testid={testId}
      aria-disabled={!enabled || undefined}
    >
      {shared&&presentation&&<SliderScenePaint element={element} viewKey={presentation.viewKey} order={presentation.order} config={config} normalized={normalized} iconLo={iconLo} iconHi={iconHi} iconSize={iconSize} iconGutter={iconGutter} graphValues={graphValues} label={labelStr}/>}
      {iconLo && (
        <SliderIcon
          path={iconLo}
          slot={iconSize}
          natural={config.style !== 'bar'}
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
          onPointerUp={endTrackGesture}
          onPointerCancel={endTrackGesture}
          onLostPointerCapture={endTrackGesture}
          data-testid={testId ? `${testId}-track` : undefined}
        >
          <SliderDrawing normalized={normalized} enabled={enabled}
            notches={config.notchAction !== 'none' ? config.notches ?? [] : []}
            testId={testId ? `${testId}-handle` : undefined} />
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
          onPointerUp={endTrackGesture}
          onPointerCancel={endTrackGesture}
          onLostPointerCapture={endTrackGesture}
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
        <div className={styles.graph}
          onPointerDown={onGraphPointerDown} onPointerMove={onGraphPointerMove}
          onPointerUp={endGraphGesture} onPointerCancel={endGraphGesture}
          onLostPointerCapture={endGraphGesture}>
          <div className={styles.graphCap} />
          {graphValues.map((v, i) => (
            <div
              key={i}
              className={styles.graphCol}
              style={{ height: `${v * 100}%` }}
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
          natural={config.style !== 'bar'}
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
  const src=resolveAssetUrl(path),button=useNativeButtonTint();
  const [decoded,setDecoded]=useState<{src:string;x:number;y:number}|null>(null);
  const size=natural&&decoded?.src===src?decoded:slot;
  // Native roundf snaps absolute positions. The low icon starts at x=0;
  // the high icon starts at a positive integer position within the slider.
  const round=(v:number)=>Math.sign(v)*Math.round(Math.abs(v));
  const dx=(slot.x-size.x)/2,dy=(slot.y-size.y)/2;
  return <span className={styles.iconSlot} style={{width:slot.x,height:slot.y}} onClick={onClick} {...button.events}>
    <img src={src} alt="" className={styles.icon} data-testid={testId} data-slider-icon={high?1:0} data-highlighted={button.tint[0]===.7}
      onLoad={e=>{
        const img=e.currentTarget,scale=src.endsWith('@2x.png')?2:1;
        setDecoded({src,x:img.naturalWidth/scale,y:img.naturalHeight/scale});
      }}
      style={{position:'absolute',left:high?Math.round(dx):round(dx),top:round(dy),
        width:size.x,height:size.y,maxWidth:'none'}}/>
  </span>;
}

/** Keep native drawing bounds separate from the unsnapped gesture hit rectangle. */
function SliderDrawing({normalized,enabled,notches,testId}:{normalized:number;enabled:boolean;notches:number[];testId?:string}) {
  const ref=useRef<HTMLDivElement>(null);
  const [surface,setSurface]=useState({width:0,dpr:1});
  useLayoutEffect(()=>{
    const track=ref.current!.parentElement!;
    const measure=()=>setSurface(previous=>{
      const width=track.getBoundingClientRect().width,dpr=window.devicePixelRatio||1;
      return previous.width===width&&previous.dpr===dpr?previous:{width,dpr};
    });
    const observer=new ResizeObserver(measure);observer.observe(track);
    let resolution:MediaQueryList;
    const watchResolution=()=>{
      resolution?.removeEventListener('change',watchResolution);
      measure();resolution=matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      resolution.addEventListener('change',watchResolution);
    };
    watchResolution();window.addEventListener('resize',measure);
    return ()=>{observer.disconnect();resolution.removeEventListener('change',watchResolution);
      window.removeEventListener('resize',measure);};
  },[]);
  const color=enabled?[73,144,226]:[164,199.5,240.5];
  return <>
    <svg className={styles.line} aria-hidden="true" style={{height:1,top:'50%',width:'100%',overflow:'visible'}}>
      <line x1="0" x2="100%" y1="0.5" y2="0.5" stroke="currentColor" strokeWidth={1/surface.dpr}/>
    </svg>
    {notches.map((n,i)=><div key={i} data-part="notch" className={styles.notch}
      style={{left:Math.round(n*surface.width)}} />)}
    <div ref={ref} className={styles.handle} data-testid={testId}
    style={{left:Math.round(normalized*surface.width-8)}}>
    <svg width="16" height="20" style={{overflow:'visible',pointerEvents:'none'}} aria-hidden="true">
      {enabled&&<rect data-part="shadow" x="0.5" y="3.5" width="15" height="19" rx="4"
        fill="black" fillOpacity="0.15" />}
      <rect data-part="fill" x="0.5" y="0.5" width="15" height="19" rx="4"
        fill={`rgb(${color.join(',')})`} />
      <rect data-part="outline" x="0.5" y="0.5" width="15" height="19" rx="4"
        fill="none" stroke={`rgb(${color.map(c=>c*.5).join(',')})`}
        strokeOpacity="0.5" strokeWidth={1/surface.dpr} />
    </svg>
  </div></>;
}
