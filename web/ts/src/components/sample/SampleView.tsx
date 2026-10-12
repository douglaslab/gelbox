import {SharedAssetPaint} from '../gel/SharedAssetPaint';
import {useNativeButton} from '../gel/useNativeButton';
import {useDisplayScale} from '../../lib/gpu/useDisplayScale';
import {sampleFrame} from '../../lib/gel/sampleFrame';
import {SampleHeader} from './SampleHeader';
import {useSharedPresentation} from '../gel/ScenePresentation';
import { useLayoutEffect, useRef, useState } from 'react';
import { LAYOUT } from '../../lib/layout/layout';
import { sampleKeyAction } from '../../lib/gel/sampleKeyboard';
import { useGelState, useGelDispatch, useGelStore } from '../gel/GelContext';
import { getVisibleSampleLane } from '../../lib/gel/gelState';
import { resolveAssetUrl, dprFallbackOnError } from '../../lib/layout/assets';
import { MolecularSimCanvas } from './MolecularSimCanvas';

/**
 * Middle "Sample" panel. Hosts the molecular-sim canvas and
 * the C++-style header (microtube glyph in a blue circle + "Sample" text).
 *
 * The panel slot itself is sized + positioned by `<Stage>`. Inside, we
 * render a square background rect (matching `mMolecularSimBkgndColor`)
 * with the canvas filling it.
 */
export function SampleView() {
  const shared=useSharedPresentation(),newButton=useRef<HTMLButtonElement>(null);
  useDisplayScale();const newButtonUrl=resolveAssetUrl('/assets/new-btn.png');
  const state = useGelState();
  const dispatch = useGelDispatch();
  const store = useGelStore();
  const [focused,setFocused] = useState(false);
  const [hovered,setHovered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const visibleLane = getVisibleSampleLane(state);
  const button=useNativeButton(()=>{
    if(visibleLane===null)return;
    store.createSpecies(visibleLane);
    rootRef.current?.focus({preventScroll:true});
  });
  const innerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    function update() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    }
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(()=>shared?.register('sample',()=>{
    const el=rootRef.current;if(!el)return [];
    const rect=el.getBoundingClientRect(),focused=el.contains(document.activeElement);
    el.dataset.sharedFrameReady='1';
    return sampleFrame(rect.width,rect.height,focused,hovered).map(op=>({...op,transform:[1,0,0,1,rect.left,rect.top] as const}));
  },50),[shared,hovered]);

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false); }}
      onPointerDownCapture={() => rootRef.current?.focus({ preventScroll: true })}
      onKeyDown={e => {
        const action = sampleKeyAction(e.key, e.shiftKey, state);
        if (action) { e.preventDefault(); e.stopPropagation(); dispatch(action); }
      }}
      data-testid="sample-view"
      data-lane-index={visibleLane ?? -1}
      style={{ position: 'relative', width: '100%', height: '100%', outline: 'none' }}
    >
      <button ref={newButton} {...button.events} type="button" aria-label="New species" data-testid="new-species"
        style={{ position: 'absolute', right: 0, top: '100%', marginTop: LAYOUT.btnGutter,
          width: 32, height: 32, border: 0, padding: 0, background: 'transparent', cursor: 'pointer',outline:shared?'none':undefined }}>
        <img src={newButtonUrl} onError={dprFallbackOnError} alt="" width={32} height={32} style={{opacity:shared?0:undefined}} />
        {shared&&<SharedAssetPaint registry={shared} viewKey="sample" element={newButton} url={newButtonUrl} tint={button.tint} order={100}/>}
      </button>
      <SampleHeader/>

      {/* Native square frame: inset shadow, thin border and focus rings. */}
      <div aria-hidden style={{position:'absolute',left:2,top:4,right:2,height:'100%',
        background:shared?'transparent':`rgba(0,0,0,${focused ? .25 : .15})`}}/>
      <div
        ref={innerRef}
        data-testid="sample-frame"
        onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}
        style={{
          position: 'absolute',
          inset: 0,
          background: shared?'transparent':LAYOUT.molecularSimBkgndColor,
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        {visibleLane !== null && size && size.w > 0 && size.h > 0 && (
          <MolecularSimCanvas laneIndex={visibleLane} width={size.w} height={size.h} />
        )}
      </div>
      <div aria-hidden style={{position:'absolute',inset:0,pointerEvents:'none',opacity:shared?0:undefined,
        outline:`1px solid ${focused || hovered ? '#666' : '#ccc'}`,
        boxShadow:focused ? '0 0 0 2px rgba(0,0,255,.1), inset 0 0 0 2px rgba(0,0,255,.1)' : undefined}}/>
    </div>
  );
}
