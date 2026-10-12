import {useRef,useState,type PointerEvent,type MouseEvent} from 'react';

/** ButtonView owns a press until release; every mouse button activates inside. */
export function useNativeButton(activate:()=>void){
 const pointer=useRef<number|null>(null);
 const [hover,setHover]=useState(false),[down,setDown]=useState(false);
 const inside=(e:PointerEvent<HTMLElement>)=>{
  const r=e.currentTarget.getBoundingClientRect();
  return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
 };
 const clear=(e:PointerEvent<HTMLElement>)=>{
  if(pointer.current!==e.pointerId)return;
  pointer.current=null;setDown(false);
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 };
 const shade=down && hover ? 0.7 : hover ? 0.9 : 1;
 return {tint:[shade,shade,shade,1] as const,events:{
  onPointerEnter:()=>setHover(true),onPointerLeave:()=>setHover(false),
  onPointerDown:(e:PointerEvent<HTMLElement>)=>{
   if(pointer.current!==null)return;
   e.preventDefault();pointer.current=e.pointerId;setDown(true);setHover(true);
   e.currentTarget.setPointerCapture(e.pointerId);
  },
  onPointerMove:(e:PointerEvent<HTMLElement>)=>setHover(inside(e)),
  onPointerUp:(e:PointerEvent<HTMLElement>)=>{
   if(pointer.current!==e.pointerId)return;
   const hit=inside(e);clear(e);setHover(hit);if(hit)activate();
  },
  onPointerCancel:clear,onLostPointerCapture:clear,
  onContextMenu:(e:MouseEvent<HTMLElement>)=>e.preventDefault(),
  onClick:(e:MouseEvent<HTMLElement>)=>{e.preventDefault();if(e.detail===0)activate();},
  onAuxClick:(e:MouseEvent<HTMLElement>)=>e.preventDefault(),
 }};
}
