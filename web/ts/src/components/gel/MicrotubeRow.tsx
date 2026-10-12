import {isNativeAccelerator} from '../../lib/gel/nativeAccelerator';
import {acquireSceneAsset} from '../../lib/gel/sceneAssets';
import type {SceneTexture} from '../../lib/gel/scenePresentation';
import type {PresentationCommand,PresentationSampling} from '../../lib/gel/presentationTypes';
import {useDisplayScale} from '../../lib/gpu/useDisplayScale';
import {useSharedPresentation} from './ScenePresentation';
import {solidRoundedRect} from '../../lib/gel/fragmentWellGeometry';
import {LAYOUT} from '../../lib/layout/layout';
import {hexToUnormRgb} from '../../lib/layout/color';
import { useEffect,useState,useRef,useMemo,useLayoutEffect } from 'react';
import { tubeGeometry } from '../../lib/layout/tubeGeometry';
import type { Rect } from '../../lib/sim/band';
import { sampleKeyAction } from '../../lib/gel/sampleKeyboard';
import { useGelState, useGelDispatch } from './GelContext';
import { resolveAssetUrl, dprFallbackOnError } from '../../lib/layout/assets';
import styles from './MicrotubeRow.module.css';

const sampling:PresentationSampling={minFilter:'linear',magFilter:'linear',mipmapFilter:'linear',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'};

/**
 * Per-lane microtube row above the gel canvas. Each tube is a rounded
 * background rect with the microtube1500ul.png icon centered inside.
 * Background follows LAYOUT.gelMicrotubeBkgndColor / gelMicrotubeBkgndColorSelected.
 */
export function MicrotubeRow() {
  const registry=useSharedPresentation();
  const state = useGelState();
  const dispatch = useGelDispatch();
  const rowRef = useRef<HTMLDivElement>(null);
  useDisplayScale();const iconUrl=resolveAssetUrl('/assets/microtube1500ul.png');
  const asset=useRef<ReturnType<typeof acquireSceneAsset>|null>(null);
  const [ghost,setGhost]=useState<Rect|null>(null);
  useEffect(()=>{
    if(!registry)return;const owned=acquireSceneAsset(registry,iconUrl);asset.current=owned;
    return()=>{if(asset.current===owned)asset.current=null;owned.release();rowRef.current?.removeAttribute('data-shared-ready');};
  },[registry,iconUrl]);

  const geometry = useMemo(()=>Array.from({ length: state.numLanes }, (_, i) =>
    tubeGeometry(state.gelSize.width, state.gelSize.height, state.numLanes, i)),[state.gelSize.width,state.gelSize.height,state.numLanes]);
  const rowTop = geometry[0].well.y1;
  const backgrounds=useMemo(()=>geometry.map((g,i)=>solidRoundedRect(g.background,g.radius,
    hexToUnormRgb(state.lastSampleLane===i?LAYOUT.gelMicrotubeBkgndColorSelected:LAYOUT.gelMicrotubeBkgndColor))),[geometry,state.lastSampleLane]);
  useLayoutEffect(()=>registry?.register('gel',()=>{
    // Geometry is gel-local. Reconstructing this origin from the row's top
    // introduces CSS subpixel rounding (the fractional row top is quantized).
    const rect=rowRef.current?.parentElement?.getBoundingClientRect();if(!rect)return [];
    const texture=asset.current?.texture(registry.getGraphics());
    const transform=[1,0,0,1,rect.left,rect.top] as const;
    const commands:PresentationCommand<SceneTexture>[]=[];
    backgrounds.forEach((op,i)=>{
      commands.push({...op,transform});
      if(texture&&state.samples[i])commands.push({texture,rect:geometry[i].icon,transform,alpha:'straight',colorSpace:'native-unorm',sampling});
    });
    if(texture&&rowRef.current)rowRef.current.dataset.sharedReady='1';return commands;
  },-10),[registry,backgrounds,geometry,state.samples]);
  useLayoutEffect(()=>registry?.register('gel',()=>{
    if(state.drag?.type!=='sample'||!ghost)return [];
    const rect=rowRef.current?.parentElement?.getBoundingClientRect(),texture=asset.current?.texture(registry.getGraphics());if(!rect||!texture)return [];
    return [{texture,rect:ghost,transform:[1,0,0,1,rect.left,rect.top],alpha:'straight',colorSpace:'native-unorm',sampling}];
  },50),[registry,ghost,state.drag?.type]);
  const rectStyle = (r: Rect) => ({ left: r.x1, top: r.y1 - rowTop,
    width: r.x2 - r.x1, height: r.y2 - r.y1 });
  const pointer = useRef<{ id: number; lane: number; x: number; y: number; selected: boolean } | null>(null);

  const creatingLoupe=useRef<{id:number;pointerId:number;x:number;y:number}|null>(null);
  function gelPoint(e:{clientX:number;clientY:number}){
    const r=rowRef.current!.parentElement!.getBoundingClientRect();
    return {x:(e.clientX-r.left)/r.width*state.gelSize.width,y:(e.clientY-r.top)/r.height*state.gelSize.height};
  }

  function laneAtPoint(x: number, y: number): number {
    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect || y < rect.top || y > rect.bottom || x < rect.left || x >= rect.right) return -1;
    const px = (x - rect.left) * state.gelSize.width / rect.width;
    const py = (y - rect.top) * (-rowTop) / rect.height + rowTop;
    return geometry.findIndex(({ hit }) => px >= hit.x1 && px <= hit.x2 && py >= hit.y1 && py <= hit.y2);
  }

  function focusDraggedSample() {
    queueMicrotask(() => {
      const sample = document.querySelector<HTMLElement>('[data-testid="sample-view"]');
      (sample ?? rowRef.current)?.focus({ preventScroll: true });
    });
  }

  function onTubePointerDown(laneIndex: number, e: React.PointerEvent<HTMLButtonElement>) {
    if (pointer.current || creatingLoupe.current) return;
    e.preventDefault();
    // GelView picks tube hit regions outside its frame, then handles Meta
    // before right-click creation or ordinary sample selection.
    if(isNativeAccelerator(e)){
      const anchor=gelPoint(e);
      creatingLoupe.current={id:state.loupeNextId,pointerId:e.pointerId,...anchor};
      rowRef.current?.setPointerCapture(e.pointerId);
      dispatch({type:'ADD_LOUPE',anchor});
      return;
    }
    if(e.button===2)return;
    pointer.current = { id: e.pointerId, lane: laneIndex, x: e.clientX, y: e.clientY,
      selected: state.lastSampleLane === laneIndex };
    rowRef.current?.setPointerCapture(e.pointerId);
    rowRef.current?.focus({ preventScroll: true });
    dispatch({ type: 'BEGIN_SAMPLE_DRAG', laneIndex, clone: e.altKey });
    // GelView::mouseDown gives the opened SampleView keyboard ownership.
    focusDraggedSample();
  }

  function endPointer(e: React.PointerEvent<HTMLDivElement>, cancel = false) {
    if(creatingLoupe.current?.pointerId===e.pointerId){
      creatingLoupe.current=null;
      if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
      return;
    }
    const down = pointer.current;
    if (!down || down.id !== e.pointerId) return;
    pointer.current = null;setGhost(null);
    dispatch({ type: 'END_SAMPLE_DRAG' });
    if (!cancel && down.selected && state.lastSampleLane === down.lane &&
        Math.hypot(e.clientX - down.x, e.clientY - down.y) < 3) dispatch({ type: 'CLOSE_SAMPLE' });
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <div className={styles.row} ref={rowRef} data-testid="microtube-row" tabIndex={-1}
      style={{ top: rowTop, height: -rowTop, outline: 'none', touchAction: 'none' }}
      onContextMenu={e=>e.preventDefault()}
      onPointerMove={e => {
        const loupe=creatingLoupe.current;
        if(loupe?.pointerId===e.pointerId){
          if(!e.currentTarget.hasPointerCapture(e.pointerId)){creatingLoupe.current=null;return;}
          const p=gelPoint(e);
          dispatch({type:'MOVE_LOUPE',id:loupe.id,mode:'both',delta:{x:p.x-loupe.x,y:p.y-loupe.y}});
          creatingLoupe.current={...loupe,...p};return;
        }
        if (pointer.current?.id === e.pointerId) {
          const lane=laneAtPoint(e.clientX,e.clientY),down=pointer.current;
          if(lane===-1){
            const icon=tubeGeometry(state.gelSize.width,state.gelSize.height,state.numLanes,down.lane).icon;
            const dx=Math.trunc(e.clientX)-Math.trunc(down.x),dy=Math.trunc(e.clientY)-Math.trunc(down.y);
            setGhost({x1:icon.x1+dx,y1:icon.y1+dy,x2:icon.x2+dx,y2:icon.y2+dy});
          }else setGhost(null);
          dispatch({ type: 'UPDATE_SAMPLE_DRAG', laneIndex: lane });
          // Crossing gaps can close/remount the sample panel during capture.
          focusDraggedSample();
        }
      }}
      onPointerUp={e => endPointer(e)}
      onPointerCancel={e => endPointer(e, true)}
      onLostPointerCapture={e => endPointer(e, true)}
      onKeyDown={e => {
        const action = sampleKeyAction(e.key, e.shiftKey, state);
        if (action) { e.preventDefault(); dispatch(action); }
      }}
    >
      {Array.from({ length: state.numLanes }, (_, i) => {
        const isSelected = state.lastSampleLane === i;
        const g = geometry[i];
        const hasSample  = state.samples[i] !== null;
        return (
          <div
            className={styles.cell}
            key={i}
            data-selected={isSelected || undefined}
            data-loaded={hasSample || undefined}
          >
            <div className={styles.underlay} style={{ ...rectStyle(g.background), borderRadius: g.radius,opacity:registry?0:undefined }} />
            <button
              type="button"
              aria-label={`Lane ${i + 1}${hasSample ? " sample" : " empty"}`}
              className={styles.tube}
              data-testid={`microtube-${i}`}
              data-lane-index={i}
              data-selected={isSelected || undefined}
              data-empty={!hasSample || undefined}
              onPointerDown={(e) => onTubePointerDown(i, e)}
              style={rectStyle(g.hit)}
              onClick={e => {
                // Browser keyboard activation has no pointer sequence.
                if (e.detail === 0) dispatch(state.lastSampleLane === i
                  ? { type: 'CLOSE_SAMPLE' } : { type: 'SET_SELECTED_LANE', laneIndex: i });
              }}
            >
              {hasSample && <img
                src={iconUrl}
                alt={`lane ${i + 1}`}
                className={styles.icon}
                style={{ left: g.icon.x1 - g.hit.x1, top: g.icon.y1 - g.hit.y1,
                  width: g.icon.x2 - g.icon.x1, height: g.icon.y2 - g.icon.y1,opacity:registry?0:undefined }}
                data-empty={!hasSample || undefined}
                onError={dprFallbackOnError}
              />}
            </button>
          </div>
        );
      })}
      {ghost&&state.drag?.type==='sample'&&<img data-testid="drag-microtube" src={iconUrl} alt="" draggable={false} onError={dprFallbackOnError}
        style={{position:'absolute',...rectStyle(ghost),pointerEvents:'none',zIndex:1,opacity:registry?0:undefined}}/>}
    </div>
  );
}
