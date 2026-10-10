import {useViewLayer} from './useViewLayer';
import {useEffect,useMemo,useRef,useState, type PointerEvent as ReactPointerEvent} from 'react';
import {sampleFragRefEq, type SampleFragRef} from '../../lib/gel/sampleFragRef';
import {loupeHull} from '../../lib/gel/loupeGeometry';
import type {DegradeFilter} from '../../lib/sim/sampleFromGel';
import { useGelDispatch, useGelState, useGelStore } from './GelContext';
import type { LoupeRef } from '../../lib/gel/gelState';
import type { Sample } from '../../lib/sim/sample';
import { SampleSimCanvas } from '../sample/SampleSimCanvas';
const SIZE=171, RADIUS=10.4;
interface LoupeProps { transient?:boolean; loupe:LoupeRef; sample:Sample; sourceRefs:SampleFragRef[]; degradeFilter?:DegradeFilter; }
export function Loupe({loupe,sourceRefs,transient=false}:LoupeProps) {
 const dispatch=useGelDispatch(),state=useGelState();
 const viewKey=transient?"hover":`loupe-${loupe.id}`;
 const view=useGelStore().getMolecularView(viewKey);
 const layer=useViewLayer(transient?`hover-${state.documentRevision}`:`loupe-${loupe.id}`);
 const root=useRef<HTMLDivElement>(null),frame=useRef<HTMLDivElement>(null);
 const [focused,setFocused]=useState(false),[hover,setHover]=useState(false),[anchorHover,setAnchorHover]=useState(false);
 const drag=useRef<{mode:'frame'|'anchor'|'both';x:number;y:number;pointerId:number}|null>(null);
 const hovered=useRef<SampleFragRef|null>(null);
 const source=(index:number):SampleFragRef|null=>{return sourceRefs[index]??null;};
 const selected=useMemo(()=>new Set(sourceRefs.flatMap((ref,i)=>sampleFragRefEq(state.selection,ref)?[i]:[])),[sourceRefs,state.selection]);
 const rollover=useMemo(()=>new Set(sourceRefs.flatMap((ref,i)=>sampleFragRefEq(state.rollover,ref)?[i]:[])),[sourceRefs,state.rollover]);
 useEffect(()=>{if(!transient)frame.current?.focus();return()=>{if(hovered.current)dispatch({type:'CLEAR_ROLLOVER_IF',ref:hovered.current});};},[dispatch,transient]);
 const point=(e:{clientX:number;clientY:number})=>{const r=root.current!.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*state.gelSize.width,y:(e.clientY-r.top)/r.height*state.gelSize.height};};
 const begin=(e:ReactPointerEvent,mode:'frame'|'anchor'|'both')=>{
  if(transient||e.button!==0)return;
  e.preventDefault();e.stopPropagation();frame.current?.focus();dispatch({type:'RAISE_LOUPE',id:loupe.id});layer.raise();
  if(mode!=='frame')dispatch({type:'SET_SELECTION',ref:null});
  const p=point(e);
  // Native pickLoupe wins even when the opaque frame covers its anchor.
  // Canvas particle selection already ran before this bubbling handler.
  const dragMode=Math.hypot(p.x-loupe.anchor.x,p.y-loupe.anchor.y)<=RADIUS?'anchor':mode;
  drag.current={mode:dragMode,...p,pointerId:e.pointerId};
  root.current?.setPointerCapture(e.pointerId);
 };
 useEffect(()=>{
  if(transient)return;
  const move=(e:PointerEvent)=>{const d=drag.current;if(!d||d.pointerId!==e.pointerId)return;if(!root.current?.hasPointerCapture(e.pointerId)){drag.current=null;return;}const p=point(e);dispatch({type:'MOVE_LOUPE',id:loupe.id,mode:d.mode,delta:{x:p.x-d.x,y:p.y-d.y}});drag.current={...d,...p};};
  const end=(e:PointerEvent)=>{if(drag.current?.pointerId===e.pointerId){drag.current=null;if(root.current?.hasPointerCapture(e.pointerId))root.current.releasePointerCapture(e.pointerId);}};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
  return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end);};
 },[dispatch,loupe.id,state.gelSize,transient]);
 const ringFocus=focused||anchorHover;
 const hull=loupeHull(loupe.frame,loupe.anchor).map(p=>`${p.x},${p.y}`).join(' ');
 if(!view)return null;
 return <div ref={root} data-testid={transient?"hover-loupe":`loupe-${loupe.id}`} data-loupe-id={transient?undefined:loupe.id}
  onLostPointerCapture={()=>{drag.current=null;}}
  onPointerEnter={()=>setHover(true)} onPointerLeave={()=>setHover(false)}
  style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:layer.zIndex,userSelect:'none'}}>
  <svg width="100%" height="100%" viewBox={`0 0 ${state.gelSize.width} ${state.gelSize.height}`} style={{position:'absolute',overflow:'visible',pointerEvents:'none'}}>
   <polygon data-testid={`loupe-wedge-${loupe.id}`} points={hull} fill="rgba(255,255,255,.25)" stroke="rgba(255,255,255,.15)" style={{pointerEvents:transient?'none':'auto',touchAction:'none'}} onPointerDown={e=>begin(e,'both')}/>
   {!transient&&<><circle cx={loupe.anchor.x} cy={loupe.anchor.y+2} r={RADIUS} fill="none" stroke={`rgba(0,0,0,${ringFocus ? .35 : .1})`} strokeWidth={ringFocus?1.5:1.1}/>
   <circle data-testid={`loupe-anchor-${loupe.id}`} cx={loupe.anchor.x} cy={loupe.anchor.y} r={RADIUS} fill="transparent" stroke={`rgba(255,255,255,${ringFocus ? 1 : .6})`} strokeWidth={ringFocus?1.5:1.1} style={{pointerEvents:'auto',touchAction:'none'}} onPointerEnter={()=>setAnchorHover(true)} onPointerLeave={()=>setAnchorHover(false)} onPointerDown={e=>begin(e,'anchor')}/></>}
  </svg>
  <div ref={frame} tabIndex={transient?undefined:-1} data-testid={transient?"hover-loupe-frame":`loupe-frame-${loupe.id}`}
   onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
   onPointerDown={e=>begin(e,'frame')}
   onKeyDown={e=>{if(transient)return;if(['Delete','Backspace','Escape'].includes(e.key)){e.preventDefault();e.stopPropagation();dispatch({type:'REMOVE_LOUPE',id:loupe.id});}else if(e.key==='Tab'){e.preventDefault();e.stopPropagation();}}}
   style={{position:'absolute',left:loupe.frame.x,top:loupe.frame.y,width:SIZE,height:SIZE,pointerEvents:'auto',outline:'none',touchAction:'none'}}>
   <div style={{position:'absolute',left:2,top:4,width:SIZE-4,height:SIZE,background:`rgba(0,0,0,${focused ? .25 : .15})`,zIndex:-1}}/>
   <SampleSimCanvas view={view} viewKey={viewKey} width={SIZE} height={SIZE} selectedFragment={selected} rolloverFragment={rollover}
    onPickFragment={index=>{const ref=source(index);if(ref)dispatch({type:'SET_SELECTION',ref});}}
    onPickBackground={()=>dispatch({type:'SET_SELECTION',ref:null})}
    onHoverFragment={index=>{const ref=index===null?null:source(index);if(ref)dispatch({type:'SET_ROLLOVER',ref});else if(hovered.current)dispatch({type:'CLEAR_ROLLOVER_IF',ref:hovered.current});hovered.current=ref;}}
    data-testid={transient?"hover-loupe-canvas":`loupe-canvas-${loupe.id}`}/>
   <div style={{position:'absolute',inset:0,pointerEvents:'none',outline:`1px solid ${focused||hover?'#666':'#ccc'}`,boxShadow:focused?'0 0 0 2px rgba(0,0,255,.1), inset 0 0 0 2px rgba(0,0,255,.1)':undefined}}/>
  </div>
 </div>;
}
