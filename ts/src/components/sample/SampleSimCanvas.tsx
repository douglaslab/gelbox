import type {MolecularView} from '../../lib/gel/molecularRuntime';
import {useGelStore} from '../gel/GelContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LAYOUT } from '../../lib/layout/layout';
import { MOLECULAR_SIM_TUNING } from '../../lib/sim/molecularSimEngine';
import { buildMoleculesMesh, type MeshBuildTuning } from '../../lib/sim/molecularSimMesh';
import { computeBackgroundColor } from '../../lib/sim/molecularSimBackground';
import { resolveBackend } from '../../lib/gel/backend';
import { hexToLinearRgb } from '../../lib/layout/color';
import { isDyeFragment } from '../../lib/sim/sample';
import type { Sample } from '../../lib/sim/sample';
import { DYE_COUNT } from '../../lib/sim/dye';
import type { Mesh } from '../../lib/gel/mesh';

/**
 * Lane-agnostic presentational canvas backed by a live `MolecularSim` engine,
 * rendered through the GPU `meshBatch` primitive (WebGPU primary, WebGL2
 * fallback, 2D-canvas fallback when no GPU backend is available).
 *
 * Takes explicit props instead of reading gel state, so it can be used both
 * by `MolecularSimCanvas` (which wraps it and wires gel state) and by the
 * loupe (which drives it with a synthetic sample).
 */
export interface SampleSimCanvasProps {
  view: MolecularView;
  viewKey: string;
  width: number;
  height: number;
  /** Pointer-down on a particle → its fragment index (omit → non-interactive, e.g. loupe). */
  onPickFragment?: (fragment: number) => void;
  onPickBackground?: () => void;
  /** Pointer-move → hovered fragment index or null on leave/miss (omit → no hover dispatch). */
  onHoverFragment?: (fragment: number | null) => void;
  'data-testid'?: string;
}

// A backend-agnostic handle the mount effect fills in.
interface RenderHandle {
  resize(wpx: number, hpx: number, wcss: number, hcss: number): void;
  draw(mesh: Mesh, bgRgb: [number, number, number]): void;
  destroy(): void;
}

const SELECT_COLOR = hexToLinearRgb(LAYOUT.sampleViewFragSelectColor);
const HOVER_COLOR  = hexToLinearRgb(LAYOUT.sampleViewFragHoverColor);

const MESH_TUNING: MeshBuildTuning = {
  numCirclePartVertices: MOLECULAR_SIM_TUNING.numCirclePartVertices,
  multimerAdhereOverlapFrac: MOLECULAR_SIM_TUNING.multimerAdhereOverlapFrac,
  outlineWidth: LAYOUT.sampleViewFragOutlineWidth,
  selectColor: SELECT_COLOR,
  hoverColor:  HOVER_COLOR,
};

export function SampleSimCanvas({
  view,
  viewKey,
  width,
  height,
  onPickFragment,
  onPickBackground,
  onHoverFragment,
  'data-testid': testId = 'molecular-sim-canvas',
}: SampleSimCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const store = useGelStore();
  const sim = view.sim;
  const handleRef = useRef<RenderHandle | null>(null);
  const hoverRef = useRef(false);
  const downRef = useRef(false);
  const [, setTick] = useState(0);
  // GPU surface mount (mirrors GelCanvas.tsx). Falls back to 2D on throw.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    const wpx = Math.round(width * dpr);
    const hpx = Math.round(height * dpr);
    canvas.width = wpx;
    canvas.height = hpx;

    (async () => {
      try {
        const backend = await resolveBackend();
        if (cancelled) return;
        if (backend === 'webgl2') {
          const { configureGl2Context } = await import('../../lib/gpu/gl/context');
          const { createGlMeshBatch } = await import('../../lib/gpu/gl/meshBatch');
          if (cancelled) return;
          const { gl } = configureGl2Context(canvas);
          const batch = createGlMeshBatch(gl, { viewport: { width, height }, blend: 'over' });
          handleRef.current = {
            resize: (wp, hp, wc, hc) => { canvas.width = wp; canvas.height = hp; batch.setViewport(wc, hc); },
            draw: (mesh, bg) => {
              batch.draw(
                { framebuffer: null, width: canvas.width, height: canvas.height },
                mesh,
                { clear: true, clearColor: [bg[0], bg[1], bg[2], 1] },
              );
            },
            destroy: () => batch.destroy(),
          };
        } else {
          const { requestDevice } = await import('../../lib/gpu/device');
          const { configureContext } = await import('../../lib/gpu/context');
          const { createMeshBatch } = await import('../../lib/gpu/meshBatch');
          const { device } = await requestDevice();
          if (cancelled) return;
          const { context, format } = configureContext(canvas, device);
          const batch = createMeshBatch(device, { viewport: { width, height }, blend: 'over', format });
          handleRef.current = {
            resize: (_wp, _hp, wc, hc) => { batch.setViewport(wc, hc); },
            draw: (mesh, bg) => {
              const enc = device.createCommandEncoder({ label: 'molsim' });
              batch.draw(enc, context.getCurrentTexture().createView(), mesh, {
                clear: true,
                clearColor: { r: bg[0], g: bg[1], b: bg[2], a: 1 },
                callIdx: 0,
              });
              device.queue.submit([enc.finish()]);
            },
            destroy: () => batch.destroy(),
          };
        }
      } catch (err) {
        if (cancelled) return;
        console.warn('SampleSimCanvas: GPU unavailable, using 2D fallback', err);
        handleRef.current = make2dFallback(canvas, width, height);
      }
    })();

    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [width, height]);

  // Draw after the application frame; acquiring a GPU never gates simulation.
  useEffect(() => store.subscribeFrame(() => {
    const handle=handleRef.current;
    if (handle && view.alive) {
      // React has not committed this tick's snapshot yet. Resolve current
      // source identities here so the mesh uses the just-completed frame.
      const {selected,rollover}=store.getMolecularHighlights(view);
      const mesh=buildMoleculesMesh(sim.parts,selected,rollover,MESH_TUNING);
      const highlight:0|1|2=downRef.current?2:hoverRef.current?1:0;
      handle.draw(mesh,computeBackgroundColor(dyeMassesFromSample(view.sample),highlight));
    }
    setTick(t=>(t+1)%1_000_000);
  }),[store,view,sim]);

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
    hoverRef.current = !store.isPointerDown();
    const c = eventCoords(e);
    if (!c) return;
    store.setViewPointer(viewKey,c,true);
    if(store.isPointerDown())return;
    const fragIdx = sim.pickFragment(c.x, c.y);
    if (fragIdx >= 0) {
      onHoverFragment?.(fragIdx);
    } else {
      onHoverFragment?.(null);
    }
  }, [eventCoords, onHoverFragment, store, viewKey, sim]);

  const onPointerLeave = useCallback(() => {
    hoverRef.current = false;
    store.setViewPointer(viewKey,null,false);
    onHoverFragment?.(null);
  }, [onHoverFragment,store,viewKey]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    downRef.current = true;
    const c = eventCoords(e);
    if (!c) return;
    store.setViewPointer(viewKey,c,true,true);
    const fragIdx = sim.pickFragment(c.x, c.y);
    if (fragIdx >= 0) {
      e.preventDefault();
      onPickFragment?.(fragIdx);
    } else onPickBackground?.();
  }, [eventCoords, onPickFragment, onPickBackground, store, viewKey, sim]);

  const onPointerUp = useCallback((e: {clientX:number;clientY:number}) => {
    downRef.current = false;
    hoverRef.current = document.elementFromPoint(e.clientX,e.clientY)===canvasRef.current;
  }, []);

  // Native mouse-down ownership survives leaving the view until release.
  useEffect(() => {
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [onPointerUp]);

  const aliveCount = sim.parts.filter((p) => p.alive).length;

  return (
    <canvas
      ref={canvasRef}
      data-testid={testId}
      data-molecular-view={viewKey}
      data-alive-count={aliveCount}
      data-frozen={view.frozen ? '1' : '0'}
      onPointerEnter={() => { hoverRef.current = true; }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { downRef.current = false; onPointerLeave(); }}
      style={{
        width:  `${width}px`,
        height: `${height}px`,
        display: 'block',
        cursor: onPickFragment ? 'pointer' : 'default',
        touchAction: 'none',
      }}
    />
  );
}

/**
 * Map a sample's dye fragments into a length-DYE_COUNT mass array, indexed by
 * the fragment's dye index. `Fragment.dye` is the dye index per src/lib/sim/
 * sample.ts (-1 = not a dye; 0..3 = dye index); `isDyeFragment` gates non-dyes.
 */
function dyeMassesFromSample(sample: Sample | null): number[] {
  const out = new Array<number>(DYE_COUNT).fill(0);
  if (!sample) return out;
  for (const f of sample.fragments) {
    if (isDyeFragment(f) && f.dye >= 0 && f.dye < DYE_COUNT) out[f.dye] = f.mass;
  }
  return out;
}

/**
 * Minimal 2D-canvas fallback when no GPU backend is available (CI safety).
 * Draws only the background fill; no particle/degradation/outline parity (the
 * GPU path is the real renderer). Keeps the panel non-blank where WebGPU and
 * WebGL2 are both absent.
 */
function make2dFallback(canvas: HTMLCanvasElement, width: number, height: number): RenderHandle {
  const ctx = canvas.getContext('2d');
  return {
    resize(wp, hp) { canvas.width = wp; canvas.height = hp; },
    draw(_mesh, bgRgb) {
      if (!ctx) return;
      const dpr = canvas.width / width;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const toByte = (c: number) => Math.round(Math.max(0, Math.min(1, c)) * 255);
      ctx.fillStyle = `rgb(${toByte(bgRgb[0])},${toByte(bgRgb[1])},${toByte(bgRgb[2])})`;
      ctx.fillRect(0, 0, width, height);
    },
    destroy() {},
  };
}
