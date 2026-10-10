import {useEffect,useState,type PointerEvent} from 'react';
/** ButtonView::stateColor: hover .9, held inside .7, otherwise unchanged. */
export function useNativeButtonTint(){
 const [hover,setHover]=useState(false),[down,setDown]=useState(false);
 useEffect(()=>{const release=()=>setDown(false);window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);return()=>{window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);};},[]);
 const shade=down&&hover?0.7:hover?0.9:1;
 return {tint:[shade,shade,shade,1] as const,events:{
  onPointerEnter:()=>setHover(true),onPointerLeave:()=>setHover(false),
  onPointerDown:(event:PointerEvent<HTMLElement>)=>{if(event.button===0)setDown(true);},
  onPointerUp:()=>setDown(false),onPointerCancel:()=>setDown(false),onLostPointerCapture:()=>setDown(false),
 }};
}
