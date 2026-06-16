import { useCallback, useEffect, useRef, useState } from 'react';
import { LAYOUT } from '../../lib/layout/layout';
import { MolecularSim, MOLECULAR_SIM_TUNING } from '../../lib/sim/molecularSimEngine';
import { buildMoleculesMesh, type MeshBuildTuning } from '../../lib/sim/molecularSimMesh';
import { computeBackgroundColor } from '../../lib/sim/molecularSimBackground';
import { selectBackend } from '../../lib/gel/backend';
import { hexToLinearRgb, srgbToLinear } from '../../lib/layout/color';
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
  sample: Sample | null;
  width: number;
  height: number;
  seed: number;
  degradeFilter?: ReadonlyMap<number, number>;
  selectedFragment?: number | null;
  rolloverFragment?: number | null;
  /** Pointer-down on a particle → its fragment index (omit → non-interactive, e.g. loupe). */
  onPickFragment?: (fragment: number) => void;
  /** Pointer-move → hovered fragment index or null on leave/miss (omit → no hover dispatch). */
  onHoverFragment?: (fragment: number | null) => void;
  'data-testid'?: string;
}

// A backend-agnostic handle the mount effect fills in.
interface RenderHandle {
  resize(wpx: number, hpx: number, wcss: number, hcss: number): void;
  draw(mesh: Mesh, bgLinear: [number, number, number]): void;
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
  sample,
  width,
  height,
  seed,
  degradeFilter,
  selectedFragment = null,
  rolloverFragment = null,
  onPickFragment,
  onHoverFragment,
  'data-testid': testId = 'molecular-sim-canvas',
}: SampleSimCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<MolecularSim | null>(null);
  const handleRef = useRef<RenderHandle | null>(null);
  const hoverRef = useRef(false);
  const downRef = useRef(false);
  const [, setTick] = useState(0);
  // Test-only deterministic freeze: when `window.__molsimFreezeAfterTicks` is a
  // number, the rAF loop ticks at most that many times (since the last sample
  // change) then stops advancing the sim while still drawing — so the seeded
  // RNG + fixed tick count produce a stable, reproducible frame that Playwright
  // `toHaveScreenshot` can settle. No effect when the flag is unset (production).
  const tickCountRef = useRef(0);
  const frozenRef = useRef(false);
  const [frozen, setFrozen] = useState(false);

  // Engine lifecycle.
  useEffect(() => {
    if (!simRef.current) {
      simRef.current = new MolecularSim({
        bounds: { x1: 0, y1: 0, x2: width, y2: height },
        seed,
      });
    }
    simRef.current.setBounds({ x1: 0, y1: 0, x2: width, y2: height });
  }, [width, height, seed]);

  useEffect(() => {
    if (!simRef.current) return;
    simRef.current.setSample(sample ?? null, degradeFilter);
    if (sample) simRef.current.preroll(60);
    // Re-settle the freeze window after a sample change (e.g. dye applied) so a
    // frozen golden reflects N ticks past the new sample, not a stale freeze.
    tickCountRef.current = 0;
    frozenRef.current = false;
    setFrozen(false);
    setTick((t) => t + 1);
  }, [sample, degradeFilter]);

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
        const backend = selectBackend();
        if (backend === 'webgl2') {
          const { configureGl2Context } = await import('../../lib/gpu/gl/context');
          const { createGlMeshBatch } = await import('../../lib/gpu/gl/meshBatch');
          const { gl } = configureGl2Context(canvas);
          if (cancelled) return;
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
        console.warn('SampleSimCanvas: GPU unavailable, using 2D fallback', err);
        handleRef.current = make2dFallback(canvas, width, height);
      }
    })();

    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
    // Deliberately NOT keyed on seed/sample: the GPU surface is lane-agnostic, so
    // a lane switch must not tear down and re-acquire the device/context/batch
    // (expensive + drops frames). Lane-specific state (sim seed, sample) is
    // handled by the engine effects above and the rAF draw loop below.
  }, [width, height]);

  // rAF tick + draw.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const sim = simRef.current;
      const handle = handleRef.current;
      if (sim && handle) {
        const freezeAfter = (window as unknown as { __molsimFreezeAfterTicks?: number })
          .__molsimFreezeAfterTicks;
        const shouldTick = freezeAfter === undefined || tickCountRef.current < freezeAfter;
        if (shouldTick) {
          sim.tick(1);
          tickCountRef.current++;
        } else if (!frozenRef.current) {
          frozenRef.current = true;
          setFrozen(true);
        }
        const sel = selectedFragment ?? null;
        const mesh = buildMoleculesMesh(sim.parts, sel, rolloverFragment ?? null, MESH_TUNING);
        const highlight: 0 | 1 | 2 = downRef.current ? 2 : hoverRef.current ? 1 : 0;
        const bgSrgb = computeBackgroundColor(dyeMassesFromSample(sample ?? null), highlight);
        const bgLinear: [number, number, number] =
          [srgbToLinear(bgSrgb[0]), srgbToLinear(bgSrgb[1]), srgbToLinear(bgSrgb[2])];
        handle.draw(mesh, bgLinear);
      }
      setTick((t) => (t + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [selectedFragment, rolloverFragment, sample, degradeFilter]);

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
    hoverRef.current = true;
    const c = eventCoords(e);
    if (!c || !simRef.current) return;
    const fragIdx = simRef.current.pickFragment(c.x, c.y);
    if (fragIdx >= 0) {
      onHoverFragment?.(fragIdx);
    } else {
      onHoverFragment?.(null);
    }
  }, [eventCoords, onHoverFragment]);

  const onPointerLeave = useCallback(() => {
    hoverRef.current = false;
    downRef.current = false;
    onHoverFragment?.(null);
  }, [onHoverFragment]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || !simRef.current) return;
    downRef.current = true;
    const c = eventCoords(e);
    if (!c) return;
    const fragIdx = simRef.current.pickFragment(c.x, c.y);
    if (fragIdx >= 0) {
      e.preventDefault();
      onPickFragment?.(fragIdx);
    }
  }, [eventCoords, onPickFragment]);

  const onPointerUp = useCallback(() => { downRef.current = false; }, []);

  const aliveCount = simRef.current?.parts.filter((p) => p.alive).length ?? 0;

  return (
    <canvas
      ref={canvasRef}
      data-testid={testId}
      data-alive-count={aliveCount}
      data-frozen={frozen ? '1' : '0'}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
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
    draw(_mesh, bgLinear) {
      if (!ctx) return;
      const dpr = canvas.width / width;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const toByte = (c: number) => Math.round(Math.max(0, Math.min(1, c)) ** (1 / 2.4) * 255);
      ctx.fillStyle = `rgb(${toByte(bgLinear[0])},${toByte(bgLinear[1])},${toByte(bgLinear[2])})`;
      ctx.fillRect(0, 0, width, height);
    },
    destroy() {},
  };
}
