import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useGelState, useGelDispatch } from '../gel/GelContext';
import { LAYOUT } from '../../lib/layout/layout';
import {
  layoutDots,
  pickDot,
  linearRgbToSrgbHex,
  type DotLayout,
} from '../../lib/sim/molecularSim';

/**
 * Phase-2 placeholder middle-panel canvas. Scatters one colored dot per
 * fragment particle (count from `calcTargetPop`); rings selected/rolled-over
 * fragments. NOT visual parity with the C++ MolecularSim — that's Phase 3.
 *
 * Wiring contract:
 *   - Hover a dot → dispatch SET_ROLLOVER for its (lane, fragment).
 *   - Click a dot → dispatch SET_SELECTED for its (lane, fragment).
 *   - Reads state.rollover + state.selection to ring matching dots.
 */
export interface MolecularSimCanvasProps {
  /** Lane whose sample is shown. Caller decides via getVisibleSampleLane. */
  laneIndex: number;
  width:  number;
  height: number;
}

export function MolecularSimCanvas({ laneIndex, width, height }: MolecularSimCanvasProps) {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sample = state.samples[laneIndex];

  const dots: DotLayout[] = useMemo(() => {
    if (!sample) return [];
    return layoutDots({
      width,
      height,
      laneIndex,
      fragments: sample.fragments,
    });
  }, [sample, width, height, laneIndex]);

  // Selection / rollover are scoped to this lane only; cross-lane refs don't
  // light up dots in this lane.
  const selectedFragForLane =
    state.selection?.lane === laneIndex ? state.selection.fragmentIndex : null;
  const rolloverFragForLane =
    state.rollover?.lane  === laneIndex ? state.rollover.fragmentIndex  : null;
  // Also reflect classic per-lane fragment selection (the gel side writes
  // selectedFragmentIndex via SET_SELECTED, not just selection.* — keep both
  // in sync for the visual ring).
  const classicSelectedFrag =
    state.selectedLane === laneIndex ? state.selectedFragmentIndex : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    canvas.width  = Math.round(width  * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const selectColor = LAYOUT.sampleViewFragSelectColor;
    const hoverColor  = LAYOUT.sampleViewFragHoverColor;
    const ringWidth   = LAYOUT.sampleViewFragOutlineWidth;

    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.cx, d.cy, d.r, 0, Math.PI * 2);
      ctx.fillStyle = linearRgbToSrgbHex(d.color);
      ctx.fill();
      const isSelected =
        d.fragmentIndex === selectedFragForLane
        || d.fragmentIndex === classicSelectedFrag;
      const isRollover =
        d.fragmentIndex === rolloverFragForLane && !isSelected;
      if (isSelected || isRollover) {
        ctx.beginPath();
        ctx.arc(d.cx, d.cy, d.r + ringWidth, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? selectColor : hoverColor;
        ctx.lineWidth   = ringWidth;
        ctx.stroke();
      }
    }
  }, [dots, width, height, selectedFragForLane, rolloverFragForLane, classicSelectedFrag]);

  const eventCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width)  * width,
      y: ((e.clientY - rect.top)  / rect.height) * height,
    };
  }, [width, height]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = eventCoords(e);
    if (!c) return;
    const hit = pickDot(dots, c.x, c.y);
    if (hit) {
      dispatch({ type: 'SET_ROLLOVER', ref: { lane: laneIndex, fragmentIndex: hit.fragmentIndex } });
    } else if (state.rollover?.lane === laneIndex) {
      // Only clear if the active rollover came from this lane — don't stomp
      // a rollover the gel side just set on a different lane.
      dispatch({ type: 'SET_ROLLOVER', ref: null });
    }
  }, [dots, eventCoords, dispatch, laneIndex, state.rollover]);

  const onPointerLeave = useCallback(() => {
    if (state.rollover?.lane === laneIndex) {
      dispatch({ type: 'SET_ROLLOVER', ref: null });
    }
  }, [dispatch, laneIndex, state.rollover]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const c = eventCoords(e);
    if (!c) return;
    const hit = pickDot(dots, c.x, c.y);
    if (hit) {
      e.preventDefault();
      dispatch({ type: 'SET_SELECTED', laneIndex, index: hit.fragmentIndex });
    }
  }, [dots, eventCoords, dispatch, laneIndex]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="molecular-sim-canvas"
      data-lane-index={laneIndex}
      data-dot-count={dots.length}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      style={{
        width:  `${width}px`,
        height: `${height}px`,
        display: 'block',
        cursor: 'pointer',
        touchAction: 'none',
      }}
    />
  );
}
