import { useCallback, useEffect, useRef } from 'react';
import type { Band } from '../../lib/sim/band';
import { useGelState, useGelDispatch } from './GelContext';
import { solveBasesForY } from '../../lib/sim/solver';

interface GelOverlayProps {
  bands:    Band[];
  /** band index → fragment index. For M6's monomer-only fixtures, identity. */
  bandToFragment: number[];
}

export function GelOverlay({ bands, bandToFragment }: GelOverlayProps) {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const svgRef = useRef<SVGSVGElement>(null);

  // Track modifiers globally so drag handlers see the latest state.
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

  // Page-level Tab navigation when overlay has focus.
  const onKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      dispatch({ type: e.shiftKey ? 'SELECT_PREV' : 'SELECT_NEXT' });
    }
  };

  // Pointer move handler — installed on window during drag so the band can be
  // dragged outside its rect's bounds.
  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!state.drag || !svgRef.current) return;
    if (state.modifiers.shift) {
      // Shift-lock: snap bp back to startBases (band freezes at original Y).
      dispatch({ type: 'SET_FRAGMENT_BASES', index: state.drag.fragmentIndex, bases: state.drag.startBases });
      return;
    }
    // Map clientY to canvas-y (gel-space).
    const rect = svgRef.current.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
    const frag = state.sample.fragments[state.drag.fragmentIndex];
    if (!frag) return;
    const newBases = solveBasesForY({
      targetY: y,
      frag,
      lane:    0,
      ctx:     state.ctx,
      wellRect: state.wellRect,
    });
    if (newBases !== frag.bases) {
      dispatch({ type: 'SET_FRAGMENT_BASES', index: state.drag.fragmentIndex, bases: newBases });
    }
  }, [state.drag, state.modifiers.shift, state.sample, state.ctx, state.wellRect, state.gelSize.height, dispatch]);

  const onPointerUp = useCallback(() => {
    if (state.drag) dispatch({ type: 'END_DRAG' });
  }, [state.drag, dispatch]);

  // Subscribe global pointer move/up while dragging.
  useEffect(() => {
    if (!state.drag) return;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup',   onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup',   onPointerUp);
    };
  }, [state.drag, onPointerMove, onPointerUp]);

  function onBandPointerDown(bandIdx: number, e: React.PointerEvent<SVGRectElement>) {
    e.preventDefault();
    const fragIdx = bandToFragment[bandIdx];
    const altKey = e.altKey;
    if (altKey) {
      // Clone first; new fragment is inserted at fragIdx+1 and selected.
      dispatch({ type: 'CLONE_FRAGMENT', sourceIndex: fragIdx });
      // Begin drag on the clone (selection is now fragIdx+1 per the reducer).
      const rect = svgRef.current!.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
      dispatch({ type: 'BEGIN_DRAG', fragmentIndex: fragIdx + 1, startY: y });
    } else {
      const rect = svgRef.current!.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
      dispatch({ type: 'BEGIN_DRAG', fragmentIndex: fragIdx, startY: y });
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
        // SVG accepts pointer events on filled rects; also catch focus from Tab/click outside band
        pointerEvents: 'auto',
      }}
    >
      {bands.map((b, i) => {
        const upExt = Math.max(b.smearAbove, b.flameHeight);
        const x = b.rect.x1 - b.blur;
        const w = (b.rect.x2 - b.rect.x1) + 2 * b.blur;
        const y = b.rect.y1 - upExt - b.blur;
        const h = (b.rect.y2 - b.rect.y1) + upExt + b.smearBelow + 2 * b.blur;
        const fragIdx = bandToFragment[i];
        const selected = state.selectedFragmentIndex === fragIdx;
        return (
          <rect
            key={i}
            data-testid={`band-${i}`}
            data-fragment-index={fragIdx}
            x={x} y={y} width={w} height={h}
            fill="transparent"
            stroke={selected ? 'var(--color-accent, #66ccff)' : 'transparent'}
            strokeWidth={1}
            onPointerDown={(e) => onBandPointerDown(i, e)}
            style={{ cursor: 'ns-resize' }}
          />
        );
      })}
    </svg>
  );
}
