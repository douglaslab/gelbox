import { fragmentIndexIn } from '../../lib/gel/sampleFragRef';
import { newFragment, randomFragmentColor } from '../../lib/gel/newFragment';
import { sampleKeyAction } from '../../lib/gel/sampleKeyboard';
import { useCallback, useEffect, useRef } from 'react';
import type { Band } from '../../lib/sim/band';
import { useGelState, useGelDispatch } from './GelContext';
import { solveBasesForY } from '../../lib/sim/solver';
import { BUFFER_TBE } from '../../lib/sim/buffer';
import { LAYOUT } from '../../lib/layout/layout';
import { bandUIRect, pickBand, type BandLaneFragment } from '../../lib/sim/sampleFromGel';

export type { BandLaneFragment } from '../../lib/sim/sampleFromGel';

function rgbToHex(rgb: readonly [number, number, number]): string {
  const toByte = (c: number) => {
    return Math.max(0, Math.min(255, Math.round(c * 255)));
  };
  const [r, g, b] = rgb.map(toByte);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

interface GelOverlayProps {
  bands:               Band[];
  bandToLaneFragment:  BandLaneFragment[];
}

export function GelOverlay({ bands, bandToLaneFragment }: GelOverlayProps) {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const svgRef = useRef<SVGSVGElement>(null);
  const creatingLoupe=useRef<{id:number;x:number;y:number;pointerId:number}|null>(null);
  useEffect(()=>{
    const move=(e:PointerEvent)=>{const d=creatingLoupe.current;if(!d||d.pointerId!==e.pointerId||!svgRef.current)return;if(!svgRef.current.hasPointerCapture(e.pointerId)){creatingLoupe.current=null;return;}const r=svgRef.current.getBoundingClientRect();const p={x:(e.clientX-r.left)/r.width*state.gelSize.width,y:(e.clientY-r.top)/r.height*state.gelSize.height};dispatch({type:'MOVE_LOUPE',id:d.id,mode:'both',delta:{x:p.x-d.x,y:p.y-d.y}});creatingLoupe.current={...d,...p};};
    const end=(e:PointerEvent)=>{if(creatingLoupe.current?.pointerId===e.pointerId)creatingLoupe.current=null;};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
    return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end);};
  },[dispatch,state.gelSize]);

  useEffect(() => {
    const update = (e: KeyboardEvent) => {
      dispatch({ type: 'SET_MODIFIERS', modifiers: { shift: e.shiftKey, alt: e.altKey, meta: e.metaKey } });
    };
    window.addEventListener('keydown', update);
    window.addEventListener('keyup', update);
    return () => {
      window.removeEventListener('keydown', update);
      window.removeEventListener('keyup', update);
    };
  }, [dispatch]);

  const onKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    const action = sampleKeyAction(e.key, e.shiftKey, state);
    if (action) { e.preventDefault(); dispatch(action); }
  };

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!state.drag || state.drag.type !== 'band' || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    dispatch({ type: 'UPDATE_BAND_DRAG',
      x: ((e.clientX - rect.left) / rect.width) * state.gelSize.width,
      y: ((e.clientY - rect.top) / rect.height) * state.gelSize.height,
      shift: e.shiftKey });
  }, [state.drag, state.gelSize, dispatch]);

  const onPointerUp = useCallback(() => {
    if (state.drag && state.drag.type === 'band') dispatch({ type: 'END_DRAG' });
  }, [state.drag, dispatch]);

  useEffect(() => {
    if (!state.drag || state.drag.type !== 'band') return;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [state.drag, onPointerMove, onPointerUp]);

  function gelPoint(e: { clientX: number; clientY: number }) {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width * state.gelSize.width,
      y: (e.clientY - rect.top) / rect.height * state.gelSize.height };
  }

  function onBandPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      const anchor=gelPoint(e);
      creatingLoupe.current={id:state.loupeNextId,...anchor,pointerId:e.pointerId};
      svgRef.current?.setPointerCapture(e.pointerId);
      dispatch({type:'ADD_LOUPE',anchor});
      return;
    }
    const picked = pickBand(gelPoint(e), bands);
    if (!picked) { onBackgroundPointerDown(e); return; }
    const bandIdx = picked.index;
    e.preventDefault();
    svgRef.current?.focus();
    const { lane, fragment } = bandToLaneFragment[bandIdx];
    try { svgRef.current?.setPointerCapture(e.pointerId); }
    catch (error) {
      // The pointer may already be inactive; window listeners still end the drag.
      if (!(error instanceof DOMException) || error.name !== 'NotFoundError') throw error;
    }
    if (e.altKey) {
      dispatch({ type: 'CLONE_FRAGMENT', laneIndex: lane, sourceIndex: fragment, color: randomFragmentColor() });
      const rect = svgRef.current!.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
      // Native Alt clone switches to the slowest band of the copied species.
      const slowest = bands.filter((_, i) => bandToLaneFragment[i].lane === lane && bandToLaneFragment[i].fragment === fragment)
        .reduce((a, b) => a.rect.y1 <= b.rect.y1 ? a : b);
      dispatch({ type: 'BEGIN_DRAG', laneIndex: lane, fragmentIndex: state.samples[lane]!.fragments.length,
        startY: y, referenceY: slowest.rect.y1, aggregate: slowest.aggregate });
    } else {
      const rect = svgRef.current!.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
      dispatch({ type: 'BEGIN_DRAG', laneIndex: lane, fragmentIndex: fragment, startY: y,
        referenceY: bands[bandIdx].rect.y1, aggregate: bands[bandIdx].aggregate });
    }
  }

  function onBackgroundPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    // This path runs only when coordinate-based picking found no band.
    // A stroke-edge hit on a rectangle is not a background click.
    if (e.target !== e.currentTarget) return;
    if (state.selection?.fragmentIndex != null) {
      dispatch({ type: 'CLEAR_FRAGMENT_SELECTION' });
    }
  }

  return (
    <svg
      ref={svgRef}
      data-testid="gel-overlay"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onLostPointerCapture={() => {creatingLoupe.current=null;onPointerUp();}}
      onContextMenu={e => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * state.gelSize.width;
        const y = (e.clientY - rect.top) / rect.height * state.gelSize.height;
        const lane = Math.floor(x / state.gelSize.width * state.numLanes);
        if (lane < 0 || lane >= state.numLanes) return;
        const fragment = newFragment();
        fragment.bases = solveBasesForY({ targetY: y, frag: fragment, lane,
          ctx: { ...state.ctx, sampleBuffer: state.samples[lane]?.buffer ?? BUFFER_TBE }, wellRect: state.wellRects[lane] });
        dispatch({ type: 'ADD_FRAGMENT', laneIndex: lane, fragment });
        e.currentTarget.focus();
      }}
      onPointerDown={onBandPointerDown}
      onPointerMove={e => {
        const picked = pickBand(gelPoint(e), bands);
        const source = picked ? bandToLaneFragment[picked.index] : null;
        dispatch({ type: 'SET_ROLLOVER', ref: source ? { sample: state.samples[source.lane]!, fragmentIndex: source.fragment } : null });
      }}
      onPointerLeave={() => dispatch({ type: 'SET_ROLLOVER', ref: null })}
      viewBox={`0 0 ${state.gelSize.width} ${state.gelSize.height}`}
      style={{
        position: 'absolute',
        inset: 0,
        width:  `${state.gelSize.width  * state.pixelsPerUnit}px`,
        height: `${state.gelSize.height * state.pixelsPerUnit}px`,
        outline: 'none',
        pointerEvents: 'auto',
      }}
    >
      {state.wellRects.slice(0, state.numLanes).map((well, i) => (
        <rect key={`well-${i}`} data-testid={`gel-well-${i}`}
          x={well.x1} y={well.y1} width={well.x2 - well.x1} height={well.y2 - well.y1}
          fill="none" stroke="rgba(204,204,204,0.8)" strokeWidth={1} pointerEvents="none" />
      ))}
      {bands.map((b, i) => {
        const hit = bandUIRect(b);
        const x = hit.x1, y = hit.y1, w = hit.x2 - hit.x1, h = hit.y2 - hit.y1;
        const lf = bandToLaneFragment[i];
        const selected = fragmentIndexIn(state.selection, state.samples[lf.lane]) === lf.fragment;
        const hovered  = fragmentIndexIn(state.rollover, state.samples[lf.lane]) === lf.fragment;
        const frag = state.samples[lf.lane]?.fragments[lf.fragment];
        const speciesColor = frag ? rgbToHex(frag.color) : LAYOUT.sampleViewFragSelectColor;
        return (
          <rect
            key={i}
            data-testid={`band-${i}`}
            data-lane-index={lf.lane}
            data-fragment-index={lf.fragment}
            x={x} y={y} width={w} height={h}
            fill="transparent"
            stroke={
              selected
                ? speciesColor
                : (hovered ? LAYOUT.sampleViewFragHoverColor : 'transparent')
            }
            strokeWidth={LAYOUT.sampleViewFragOutlineWidth}
            style={{ cursor: 'ns-resize' }}
          />
        );
      })}
    </svg>
  );
}
