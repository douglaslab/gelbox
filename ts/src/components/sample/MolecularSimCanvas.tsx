import { useCallback, useEffect, useRef, useState } from 'react';
import { useGelState, useGelDispatch } from '../gel/GelContext';
import { LAYOUT } from '../../lib/layout/layout';
import { linearRgbToSrgbHex } from '../../lib/sim/molecularSim';
import { MolecularSim, MOLECULAR_SIM_TUNING } from '../../lib/sim/molecularSimEngine';

// C++ Part::makeMesh translates each multimer by
//   m.mLoc * min(radius.x, radius.y) * (1 - mMultimerAdhereOverlapFrac) * 2
// so that adjacent multimers overlap by `mMultimerAdhereOverlapFrac` of their
// minor radius. We replicate that here so multi parts visibly cluster.
const MULTIMER_LOC_SCALE = (1 - MOLECULAR_SIM_TUNING.multimerAdhereOverlapFrac) * 2;

/**
 * Phase-3 M21 — middle-panel canvas backed by a live `MolecularSim`
 * engine. Particles spawn/cull/fade per the C++ tick semantics; this
 * component just renders them as flat ellipses for now (toon shader is
 * M24).
 *
 * Wiring contract (unchanged from M15):
 *   - Hover a particle → SET_ROLLOVER for its (lane, fragment).
 *   - Click a particle → SET_SELECTED for its (lane, fragment).
 *   - Reads state.rollover + state.selection to ring matching particles.
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
  const simRef = useRef<MolecularSim | null>(null);
  // Bumping this forces a redraw when the engine state changes outside
  // React's normal flow (e.g. on tick).
  const [, setTick] = useState(0);

  const sample = state.samples[laneIndex];

  // Lazily construct + maintain the engine in a ref so per-frame ticks
  // don't churn React state.
  useEffect(() => {
    if (!simRef.current) {
      simRef.current = new MolecularSim({
        bounds: { x1: 0, y1: 0, x2: width, y2: height },
        seed:   laneIndex * 31 + 1,
      });
    }
    simRef.current.setBounds({ x1: 0, y1: 0, x2: width, y2: height });
  }, [width, height, laneIndex]);

  // Reconcile the engine to the latest sample whenever the sample shape
  // changes (fragments added/removed, masses changed). Position-only
  // re-renders happen in the rAF tick loop, not here.
  useEffect(() => {
    if (!simRef.current) return;
    simRef.current.setSample(sample ?? null);
    if (sample) simRef.current.preroll(60);
    setTick((t) => t + 1);
  }, [sample]);

  // rAF tick loop. Stops when the canvas unmounts.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (simRef.current) simRef.current.tick(1);
      setTick((t) => (t + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Selection / rollover come from React state; recompute each render.
  const selectedFragForLane =
    state.selection?.lane === laneIndex ? state.selection.fragmentIndex : null;
  const rolloverFragForLane =
    state.rollover?.lane  === laneIndex ? state.rollover.fragmentIndex  : null;
  const classicSelectedFrag =
    state.selectedLane === laneIndex ? state.selectedFragmentIndex : null;

  // Draw on every render (the rAF tick loop schedules them).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !simRef.current) return;
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

    for (const p of simRef.current.parts) {
      const isSelected =
        p.fragment === selectedFragForLane
        || p.fragment === classicSelectedFrag;
      const isRollover =
        p.fragment === rolloverFragForLane && !isSelected;
      // Each multimer slot draws as one ellipse rotated by p.angle + m.angle.
      // m.loc is in radius units; the overlap-fraction scale is applied so
      // adjacent multimers overlap visibly (matches C++ Part::makeMesh).
      const minR = Math.min(p.radius.x, p.radius.y);
      // Slice-mode degradation (M23): clip the unit ellipse to a left-anchored
      // rectangle whose area is `4 * wholeness²` in unit-space — preserves
      // wholeness² of the visible area, matching C++ makeDegradeIntersectShape.
      // Width-only slice (height stays 2). Floor at 0.05 to keep particles
      // pickable when fully degraded.
      const sliceW = 2 * Math.max(0.05, p.wholeness * p.wholeness);
      for (const m of p.multi) {
        const cx = p.loc.x + m.loc.x * minR * MULTIMER_LOC_SCALE;
        const cy = p.loc.y + m.loc.y * minR * MULTIMER_LOC_SCALE;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(p.angle + m.angle);
        ctx.scale(p.radius.x, p.radius.y);
        // Clip first (slice rect), then fill the unit ellipse inside the clip.
        if (sliceW < 2) {
          ctx.beginPath();
          ctx.rect(-1, -1, sliceW, 2);
          ctx.clip();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, Math.PI * 2);
        ctx.globalAlpha = p.fade;
        ctx.fillStyle = linearRgbToSrgbHex(p.color);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
        if (isSelected || isRollover) {
          // Stroke the FULL undeformed outline so the selection ring is
          // always a clean ellipse; matches C++ which strokes pre-slice.
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(p.angle + m.angle);
          ctx.scale(p.radius.x + ringWidth, p.radius.y + ringWidth);
          ctx.beginPath();
          ctx.arc(0, 0, 1, 0, Math.PI * 2);
          ctx.restore();
          ctx.strokeStyle = isSelected ? selectColor : hoverColor;
          ctx.lineWidth   = ringWidth;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
  });

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
    if (!c || !simRef.current) return;
    const fragIdx = simRef.current.pickFragment(c.x, c.y);
    if (fragIdx >= 0) {
      dispatch({ type: 'SET_ROLLOVER', ref: { lane: laneIndex, fragmentIndex: fragIdx } });
    } else if (state.rollover?.lane === laneIndex) {
      dispatch({ type: 'SET_ROLLOVER', ref: null });
    }
  }, [eventCoords, dispatch, laneIndex, state.rollover]);

  const onPointerLeave = useCallback(() => {
    if (state.rollover?.lane === laneIndex) {
      dispatch({ type: 'SET_ROLLOVER', ref: null });
    }
  }, [dispatch, laneIndex, state.rollover]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || !simRef.current) return;
    const c = eventCoords(e);
    if (!c) return;
    const fragIdx = simRef.current.pickFragment(c.x, c.y);
    if (fragIdx >= 0) {
      e.preventDefault();
      dispatch({ type: 'SET_SELECTED', laneIndex, index: fragIdx });
    }
  }, [eventCoords, dispatch, laneIndex]);

  // Also expose a snapshot of the live alive-particle count so e2e tests can
  // assert. Updated on render, which the rAF loop drives.
  const aliveCount = simRef.current?.parts.filter((p) => p.alive).length ?? 0;

  return (
    <canvas
      ref={canvasRef}
      data-testid="molecular-sim-canvas"
      data-lane-index={laneIndex}
      data-alive-count={aliveCount}
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
