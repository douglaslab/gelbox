import {useSharedPresentation} from '../gel/ScenePresentation';
import {useViewLayer,useViewZIndex} from '../gel/useViewLayer';
import { useEffect, useState, type ReactNode } from 'react';
import { LAYOUT } from '../../lib/layout/layout';
import styles from './Stage.module.css';

export interface StageProps {
  left: ReactNode;
  middle: ReactNode;
  right: ReactNode;
  brace?: ReactNode;
  inspectorBesideGel?: boolean;
  inspectorKind?: string;
}

/** Native fixed-size view layout, including GelboxApp's window-resize offsets. */
export function Stage({ left, middle, right, brace, inspectorBesideGel = false, inspectorKind = 'fragment' }: StageProps) {
  const shared=useSharedPresentation();
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const dx = viewport.width - LAYOUT.windowSize.x;
  const dy = viewport.height - LAYOUT.windowSize.y;
  const x = Math.max(LAYOUT.gelTopLeftMin.x, Math.round(LAYOUT.gelTopLeft.x + dx * (dx > 0 ? 0.4 : 0.8)));
  const y = Math.max(LAYOUT.gelTopLeftMin.y, Math.round(LAYOUT.gelTopLeft.y + dy * 0.5));
  const middleX = x + LAYOUT.gelSize.x + LAYOUT.gelToSampleGutter;
  const inspectorX = inspectorBesideGel ? middleX : middleX + LAYOUT.sampleSize.x + LAYOUT.sampleToBraceGutter;
  const rightEdge = right ? inspectorX + LAYOUT.gelSettingsSize.x
    : middle ? middleX + LAYOUT.sampleSize.x : x + LAYOUT.gelSize.x;
  const slot = (left: number, width: number) => ({ left, top: y, width, height: LAYOUT.gelSize.y });

  return (
    <div className={styles.stage} data-testid="stage" style={{ background:shared?'transparent':undefined,width: Math.max(viewport.width, rightEdge + 8), height: Math.max(viewport.height, y + LAYOUT.gelSize.y + 112) }}>
      <div className={styles.slot} style={slot(x, LAYOUT.gelSize.x)} data-testid="stage-left">{left}</div>
      {middle && <LayerSlot name="sample" above="gel" style={slot(middleX, LAYOUT.sampleSize.x)} testId="stage-middle">{middle}</LayerSlot>}
      {brace && <BraceLayer name={`inspector-${inspectorKind}`} left={inspectorX} top={y + Math.round((LAYOUT.gelSize.y - LAYOUT.braceSize.y) / 2)}>{brace}</BraceLayer>}
      {right && <LayerSlot key={inspectorKind} name={`inspector-${inspectorKind}`} above={inspectorKind==='gel-settings'?'gel':inspectorKind==='sample-settings'?'sample':undefined} style={slot(inspectorX, LAYOUT.gelSettingsSize.x)} testId="stage-right">{right}</LayerSlot>}
    </div>
  );
}

function LayerSlot({name,above,style,testId,children}:{name:string;above?:string;style:React.CSSProperties;testId:string;children:ReactNode}){
 const {zIndex}=useViewLayer(name,above);
 return <div className={styles.slot} style={{...style,zIndex}} data-testid={testId}>{children}</div>;
}
function BraceLayer({name,left,top,children}:{name:string;left:number;top:number;children:ReactNode}){
 const zIndex=useViewZIndex(name);
 return <div className={styles.braceWrap} data-testid="stage-brace" style={{left,top,width:LAYOUT.braceSize.x,height:LAYOUT.braceSize.y,zIndex}}>{children}</div>;
}
