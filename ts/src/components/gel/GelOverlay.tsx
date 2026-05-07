import { useCallback, useEffect, useRef } from 'react';
import type { Band } from '../../lib/sim/band';
import { useGelState, useGelDispatch } from './GelContext';
import { solveBasesForY } from '../../lib/sim/solver';
import { LAYOUT } from '../../lib/layout/layout';

function linearRgbToSrgbHex(rgb: readonly [number, number, number]): string {
  const toByte = (c: number) => {
    const srgb = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(srgb * 255)));
  };
  const [r, g, b] = rgb.map(toByte);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export interface BandLaneFragment {
  lane:     number;
  fragment: number;
}

interface GelOverlayProps {
  bands:               Band[];
  bandToLaneFragment:  BandLaneFragment[];
}

export function GelOverlay({ bands, bandToLaneFragment }: GelOverlayProps) {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const svgRef = useRef<SVGSVGElement>(null);

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
    if (e.key === 'Tab') {
      e.preventDefault();
      dispatch({ type: e.shiftKey ? 'SELECT_PREV' : 'SELECT_NEXT' });
    }
  };

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!state.drag || state.drag.type !== 'band' || !svgRef.current) return;
    if (state.modifiers.shift) {
      dispatch({
        type: 'SET_FRAGMENT_BASES',
        laneIndex: state.drag.laneIndex,
        index: state.drag.fragmentIndex,
        bases: state.drag.startBases,
      });
      return;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
    const sample = state.samples[state.drag.laneIndex];
    if (!sample) return;
    const frag = sample.fragments[state.drag.fragmentIndex];
    if (!frag) return;
    const newBases = solveBasesForY({
      targetY: y,
      frag,
      lane:    state.drag.laneIndex,
      ctx:     state.ctx,
      wellRect: state.wellRects[state.drag.laneIndex],
    });
    if (newBases !== frag.bases) {
      dispatch({
        type: 'SET_FRAGMENT_BASES',
        laneIndex: state.drag.laneIndex,
        index: state.drag.fragmentIndex,
        bases: newBases,
      });
    }
  }, [state.drag, state.modifiers.shift, state.samples, state.ctx, state.wellRects, state.gelSize.height, dispatch]);

  const onPointerUp = useCallback(() => {
    if (state.drag && state.drag.type === 'band') dispatch({ type: 'END_DRAG' });
  }, [state.drag, dispatch]);

  useEffect(() => {
    if (!state.drag || state.drag.type !== 'band') return;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [state.drag, onPointerMove, onPointerUp]);

  function onBandPointerDown(bandIdx: number, e: React.PointerEvent<SVGRectElement>) {
    e.preventDefault();
    const { lane, fragment } = bandToLaneFragment[bandIdx];
    const isCmd = e.metaKey || e.ctrlKey;
    if (isCmd) {
      // Cmd/Ctrl-click → open a loupe, do NOT start drag.
      dispatch({ type: 'ADD_LOUPE', lane, fragmentIndex: fragment, x: e.clientX, y: e.clientY });
      return;
    }
    if (e.altKey) {
      dispatch({ type: 'CLONE_FRAGMENT', laneIndex: lane, sourceIndex: fragment });
      const rect = svgRef.current!.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
      dispatch({ type: 'BEGIN_DRAG', laneIndex: lane, fragmentIndex: fragment + 1, startY: y });
    } else {
      const rect = svgRef.current!.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
      dispatch({ type: 'BEGIN_DRAG', laneIndex: lane, fragmentIndex: fragment, startY: y });
    }
  }

  return (
    <svg
      ref={svgRef}
      data-testid="gel-overlay"
      tabIndex={0}
      onKeyDown={onKeyDown}
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
      {bands.map((b, i) => {
        const upExt = Math.max(b.smearAbove, b.flameHeight);
        const x = b.rect.x1 - b.blur;
        const w = (b.rect.x2 - b.rect.x1) + 2 * b.blur;
        const y = b.rect.y1 - upExt - b.blur;
        const h = (b.rect.y2 - b.rect.y1) + upExt + b.smearBelow + 2 * b.blur;
        const lf = bandToLaneFragment[i];
        const selected = state.selectedLane === lf.lane && state.selectedFragmentIndex === lf.fragment;
        const hovered  = state.rollover?.lane === lf.lane && state.rollover?.fragmentIndex === lf.fragment;
        const frag = state.samples[lf.lane]?.fragments[lf.fragment];
        const speciesColor = frag ? linearRgbToSrgbHex(frag.color) : LAYOUT.sampleViewFragSelectColor;
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
            onPointerDown={(e) => onBandPointerDown(i, e)}
            onPointerEnter={() => dispatch({ type: 'SET_ROLLOVER', ref: { lane: lf.lane, fragmentIndex: lf.fragment } })}
            onPointerLeave={() => dispatch({ type: 'SET_ROLLOVER', ref: null })}
            style={{ cursor: 'ns-resize' }}
          />
        );
      })}
    </svg>
  );
}
