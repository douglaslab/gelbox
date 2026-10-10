import {createContext,useContext,useEffect,useLayoutEffect,useRef,useState,useSyncExternalStore,type ReactNode,type PointerEvent} from 'react';
import {ReferenceImageStore,type ReferenceImage} from '../../lib/gel/referenceImages';
import {imageGesture,imageGestureMode,imageIntersectsWindow,type Point} from '../../lib/gel/imageGeometry';
import type {Rect} from '../../lib/sim/band';
import {useViewLayer} from './useViewLayer';
const Context=createContext<ReferenceImageStore|null>(null);
export function ReferenceImageProvider({children}:{children:ReactNode}){
 const [store]=useState(()=>new ReferenceImageStore());
 useEffect(()=>{store.activate();return()=>store.dispose();},[store]);
 return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useReferenceImages(){const store=useContext(Context);if(!store)throw new Error('Missing reference image provider');return store;}
const point=(e:{clientX:number;clientY:number}):Point=>({x:Math.trunc(e.clientX),y:Math.trunc(e.clientY)});
function ImageView({image}:{image:ReferenceImage}){
 const store=useReferenceImages(),root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [focused,setFocused]=useState(false);
 const {zIndex}=useViewLayer(`image-${image.id}`);
 const gesture=useRef<{pointerId:number;mode:'drag'|'resize';start:Rect;down:Point;frame:Rect;previous:Point}|null>(null);
 useLayoutEffect(()=>{
  const ctx=canvas.current!.getContext('2d')!;ctx.drawImage(image.bitmap,0,0);
  root.current?.focus({preventScroll:true});
 },[image.bitmap]);
 const end=(e:PointerEvent,removeOutside:boolean)=>{
  const g=gesture.current;if(!g||g.pointerId!==e.pointerId)return;
  gesture.current=null;
  if(root.current?.hasPointerCapture(e.pointerId))root.current.releasePointerCapture(e.pointerId);
  if(removeOutside&&!imageIntersectsWindow(g.frame,window.innerWidth,window.innerHeight))store.remove(image.id);
 };
 return <div ref={root} tabIndex={-1} data-testid={`reference-image-${image.id}`} data-reference-image={image.id} aria-label="Reference image"
  onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} onContextMenu={e=>e.preventDefault()}
  onKeyDown={e=>{if(['Delete','Backspace','Escape','Tab'].includes(e.key)){e.preventDefault();e.stopPropagation();if(e.key==='Delete'||e.key==='Backspace')store.remove(image.id);}}}
  onPointerDown={e=>{
   if(gesture.current)return;e.preventDefault();e.stopPropagation();root.current?.focus({preventScroll:true});
   const p=point(e);gesture.current={pointerId:e.pointerId,mode:imageGestureMode(image.frame,p),start:image.frame,down:p,frame:image.frame,previous:p};
   e.currentTarget.setPointerCapture(e.pointerId);
  }}
  onPointerMove={e=>{
   const g=gesture.current;if(!g||g.pointerId!==e.pointerId)return;
   if(!e.currentTarget.hasPointerCapture(e.pointerId)){gesture.current=null;return;}
   const current=point(e);
   g.frame=imageGesture(g.mode==='drag'?g.frame:g.start,g.mode==='drag'?g.previous:g.down,current,{x:image.bitmap.width,y:image.bitmap.height},g.mode);
   g.previous=current;store.update(image.id,g.frame);
  }}
  onPointerUp={e=>end(e,true)} onPointerCancel={e=>end(e,true)} onLostPointerCapture={()=>{gesture.current=null;}}
  style={{position:'fixed',left:image.frame.x1,top:image.frame.y1,width:image.frame.x2-image.frame.x1,height:image.frame.y2-image.frame.y1,zIndex,outline:focused?'4px solid rgb(255,255,128)':'none',outlineOffset:0,touchAction:'none',userSelect:'none'}}>
  <canvas ref={canvas} data-testid={`reference-image-canvas-${image.id}`} width={image.bitmap.width} height={image.bitmap.height} style={{display:'block',width:'100%',height:'100%',pointerEvents:'none'}}/>
  <div data-testid={`reference-image-handle-${image.id}`} style={{position:'absolute',right:0,bottom:0,width:16,height:16,background:'rgb(191,191,191)',outline:'1px solid rgb(89,89,89)',outlineOffset:'-.5px',pointerEvents:'none'}}/>
 </div>;
}
export function ReferenceImageLayer(){const store=useReferenceImages(),images=useSyncExternalStore(store.subscribe,store.getSnapshot);return <>{images.map(image=><ImageView key={image.id} image={image}/>)}</>;}
