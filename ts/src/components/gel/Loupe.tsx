import {useSharedPresentation} from './ScenePresentation';
import {loupeChrome} from '../../lib/gel/loupeChrome';
import {useViewLayer} from './useViewLayer';
import {useEffect,useLayoutEffect,useRef,useState, type PointerEvent as ReactPointerEvent} from 'react';
import {type SampleFragRef} from '../../lib/gel/sampleFragRef';
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
 const registry=useSharedPresentation();
 const viewKey=transient?"hover":`loupe-${loupe.id}`;
 const view=useGelStore().getMolecularView(viewKey);
 const presentationKey=transient?`hover-${state.documentRevision}`:`loupe-${loupe.id}`;
 const layer=useViewLayer(presentationKey);
 const root=useRef<HTMLDivElement>(null),frame=useRef<HTMLDivElement>(null);
 const [focused,setFocused]=useState(false),[hover,setHover]=useState(false),[anchorHover,setAnchorHover]=useState(false);
 const drag=useRef<{mode:'frame'|'anchor'|'both';x:number;y:number;pointerId:number}|null>(null);
 const hovered=useRef<SampleFragRef|null>(null);
 const pointer=useRef<{x:number;y:number}|null>(null);
 const rememberPointer=(e:{clientX:number;clientY:number})=>{pointer.current={x:e.clientX,y:e.clientY};};
 const source=(index:number):SampleFragRef|null=>{return sourceRefs[index]??null;};
 // Native background selection retains the derived sample with fragment -1.
 // GelView follows this off-gel sample on its next tick and closes the source panel.
 const selectBackground=()=>dispatch({type:'SET_SELECTION',ref:view?.sample?{sample:view.sample,fragmentIndex:null}:null});
 useEffect(()=>{if(!transient)frame.current?.focus();return()=>{if(hovered.current)dispatch({type:'CLEAR_ROLLOVER_IF',ref:hovered.current});};},[dispatch,transient]);
 const point=(e:{clientX:number;clientY:number})=>{const r=root.current!.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*state.gelSize.width,y:(e.clientY-r.top)/r.height*state.gelSize.height};};
 const begin=(e:ReactPointerEvent,mode:'frame'|'anchor'|'both')=>{
  if(transient)return;
  e.preventDefault();e.stopPropagation();frame.current?.focus();dispatch({type:'RAISE_LOUPE',id:loupe.id});layer.raise();
  if(mode!=='frame')selectBackground();
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
 useLayoutEffect(()=>{
  if(!registry||!view)return;
  const read=(which:'before'|'after')=>{
   const rect=frame.current?.getBoundingClientRect();if(!rect||!view.alive)return [];
   const focus=frame.current?.contains(document.activeElement)??false;
   return loupeChrome(loupe.frame,loupe.anchor,focus,hover,anchorHover,transient)[which].map(op=>({...op,transform:[1,0,0,1,rect.left,rect.top] as const}));
  };
  const before=registry.register(presentationKey,()=>read('before'),-1),after=registry.register(presentationKey,()=>read('after'),1);
  return()=>{before();after();};
 },[registry,view,presentationKey,loupe.frame,loupe.anchor,hover,anchorHover,transient]);
 if(!view)return null;
 return <div ref={root} data-testid={transient?"hover-loupe":`loupe-${loupe.id}`} data-loupe-id={transient?undefined:loupe.id}
  onContextMenu={e=>e.preventDefault()}
  onLostPointerCapture={()=>{drag.current=null;}}
  onPointerEnter={e=>{rememberPointer(e);setHover(true);}} onPointerMove={rememberPointer} onPointerLeave={()=>setHover(false)}
  style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:layer.zIndex,userSelect:'none'}}>
  <svg width="100%" height="100%" viewBox={`0 0 ${state.gelSize.width} ${state.gelSize.height}`} style={{position:'absolute',overflow:'visible',pointerEvents:'none',opacity:registry?0:undefined}}>
   <polygon data-testid={`loupe-wedge-${loupe.id}`} points={hull} fill="rgba(255,255,255,.25)" stroke="rgba(255,255,255,.15)" style={{pointerEvents:transient?'none':'auto',touchAction:'none'}} onPointerDown={e=>begin(e,'both')}/>
   {!transient&&<><circle cx={loupe.anchor.x} cy={loupe.anchor.y+2} r={RADIUS} fill="none" stroke={`rgba(0,0,0,${ringFocus ? .35 : .1})`} strokeWidth={ringFocus?1.5:1.1}/>
   <circle data-testid={`loupe-anchor-${loupe.id}`} cx={loupe.anchor.x} cy={loupe.anchor.y} r={RADIUS} fill="transparent" stroke={`rgba(255,255,255,${ringFocus ? 1 : .6})`} strokeWidth={ringFocus?1.5:1.1} style={{pointerEvents:'auto',touchAction:'none'}} onPointerEnter={()=>setAnchorHover(true)} onPointerLeave={()=>setAnchorHover(false)} onPointerDown={e=>begin(e,'anchor')}/></>}
  </svg>
  <div ref={frame} data-loupe-frame="true" tabIndex={transient?undefined:-1} data-testid={transient?"hover-loupe-frame":`loupe-frame-${loupe.id}`}
   onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
   onPointerDown={e=>begin(e,'frame')}
   onKeyDown={e=>{if(transient)return;if(['Delete','Backspace','Escape'].includes(e.key)){e.preventDefault();e.stopPropagation();dispatch({type:'REMOVE_LOUPE',id:loupe.id});}else if(e.key==='Tab'){e.preventDefault();e.stopPropagation();}}}
   style={{position:'absolute',left:loupe.frame.x,top:loupe.frame.y,width:SIZE,height:SIZE,pointerEvents:'auto',outline:'none',touchAction:'none'}}>
   <div style={{position:'absolute',left:2,top:4,width:SIZE-4,height:SIZE,background:`rgba(0,0,0,${focused ? .25 : .15})`,zIndex:-1,opacity:registry?0:undefined}}/>
   <SampleSimCanvas view={view} viewKey={viewKey} presentationKey={presentationKey} readBackgroundHighlight={canvasDown=>{
     const p=pointer.current,r=frame.current?.getBoundingClientRect();
     if(!p||!r||view.sim.pickFragment(p.x-r.left,p.y-r.top)>=0)return 0;
     return drag.current||canvasDown?2:hover?1:0;
    }} width={SIZE} height={SIZE}
    onPickFragment={index=>{const ref=source(index);if(ref)dispatch({type:'SET_SELECTION',ref});}}
    onPickBackground={selectBackground}
    onHoverFragment={index=>{
      const ref=index===null?null:source(index);
      // A frame can acquire rollover without a mouse callback. A miss/leave
      // must clear that current rollover too, not only hovered.current.
      dispatch({type:'SET_ROLLOVER',ref});hovered.current=ref;
    }}
    data-testid={transient?"hover-loupe-canvas":`loupe-canvas-${loupe.id}`}/>
   <div style={{position:'absolute',inset:0,pointerEvents:'none',opacity:registry?0:undefined,outline:`1px solid ${focused||hover?'#666':'#ccc'}`,boxShadow:focused?'0 0 0 2px rgba(0,0,255,.1), inset 0 0 0 2px rgba(0,0,255,.1)':undefined}}/>
  </div>
 </div>;
}
