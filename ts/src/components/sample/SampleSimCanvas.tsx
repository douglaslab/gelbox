import { watchDeviceLoss, watchDeviceErrors, watchGlLoss } from '../../lib/gpu/loss';
import { useRendererRecovery } from '../../lib/gpu/useRendererRecovery';
import { GraphicsFailure } from '../primitives/GraphicsFailure';
import type {MolecularView} from '../../lib/gel/molecularRuntime';
import {useGelStore} from '../gel/GelContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LAYOUT } from '../../lib/layout/layout';
import { MOLECULAR_SIM_TUNING } from '../../lib/sim/molecularSimEngine';
import { buildRepresentativeMesh, buildMoleculesMesh, type MeshBuildTuning } from '../../lib/sim/molecularSimMesh';
import { computeBackgroundColor } from '../../lib/sim/molecularSimBackground';
import { resolveBackend, type Backend } from '../../lib/gel/backend';
import { hexToLinearRgb } from '../../lib/layout/color';
import { isDyeFragment } from '../../lib/sim/sample';
import type { Sample } from '../../lib/sim/sample';
import { DYE_COUNT } from '../../lib/sim/dye';
import type { Mesh } from '../../lib/gel/mesh';

/**
 * Lane-agnostic presentational canvas backed by a live `MolecularSim` engine,
 * rendered through native multisample presentation (WebGPU primary, WebGL2
 * fallback, with a visible error when graphics cannot initialize).
 *
 * Takes explicit props instead of reading gel state, so it can be used both
 * by `MolecularSimCanvas` (which wraps it and wires gel state) and by the
 * loupe (which drives it with a synthetic sample).
 */
export interface SampleSimCanvasProps {
  view: MolecularView;
  viewKey: string;
  /** Draw one representative from this existing engine; never create or tick another. */
  representativeFragment?: number;
  representativeCenter?: {x:number;y:number};
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
  fail(error:unknown):void;
  resize(wpx: number, hpx: number, wcss: number, hcss: number): void;
  draw(mesh: Mesh, bgRgb: [number, number, number], alpha?: number): void;
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
  representativeFragment,
  representativeCenter,
  width,
  height,
  onPickFragment,
  onPickBackground,
  onHoverFragment,
  'data-testid': testId = 'molecular-sim-canvas',
}: SampleSimCanvasProps) {
  const {failed,attempt,forcedBackend,onFailure,onLoss,onSuccess,onRetry}=useRendererRecovery();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const store = useGelStore();
  const sim = view.sim;
  const transparent = representativeFragment !== undefined;
  const handleRef = useRef<RenderHandle | null>(null);
  const hoverRef = useRef(false);
  const downRef = useRef(false);
  const [, setTick] = useState(0);
  // GPU surface mount; retry replaces only the drawing canvas, not the live engine.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let lost = false;
    const cleanup:(()=>void)[]=[];
    const dispose=()=>{
      handleRef.current?.destroy();
      handleRef.current=null;
      for(const release of cleanup.splice(0).reverse())release();
    };
    const handleLoss=(backend:Backend, restartCycle=true)=>{
      if(cancelled||lost)return;
      lost=true;
      dispose();
      if(restartCycle)onLoss(backend);else onFailure(backend);
    };
    const resize=()=>{
      if(cancelled||lost)return;
      const dpr=window.devicePixelRatio||1;
      const wpx=Math.max(1,Math.round(width*dpr)),hpx=Math.max(1,Math.round(height*dpr));
      if(canvas.width===wpx&&canvas.height===hpx)return;
      canvas.width=wpx;canvas.height=hpx;
      try {handleRef.current?.resize(wpx,hpx,width,height);}
      catch(error){handleRef.current?.fail(error);}
    };
    let resolution:MediaQueryList;
    const watchResolution=()=>{
      resolution?.removeEventListener('change',watchResolution);
      resize();resolution=matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      resolution.addEventListener('change',watchResolution);
    };
    watchResolution();window.addEventListener('resize',resize);
    cleanup.push(()=>{resolution.removeEventListener('change',watchResolution);window.removeEventListener('resize',resize);});

    (async () => {
      let backend:Backend|null=null;
      try {
        backend = forcedBackend ?? await resolveBackend();
        if (cancelled || lost) return;
        const fail=(error:unknown)=>{
          console.error('Molecular frame failed:',error);handleLoss(backend!,false);
        };
        if (backend === 'webgl2') {
          const { configureGl2Context } = await import('../../lib/gpu/gl/context');
          const { createGlMeshBatch } = await import('../../lib/gpu/gl/meshBatch');
          const { createGlGelPresentation } = await import('../../lib/gel/present-gl');
          if (cancelled || lost) return;
          const { gl } = configureGl2Context(canvas);
          cleanup.push(watchGlLoss(canvas,()=>handleLoss('webgl2')));
          cleanup.push(()=>{if(lost||!canvas.isConnected)gl.getExtension('WEBGL_lose_context')?.loseContext();});
          // Transparent representatives retain their existing compositor until
          // the native panel-compositing reference is established.
          const batch = transparent ? createGlMeshBatch(gl, { viewport: { width, height }, blend: 'over' }) : null;
          const makePresentation = () => createGlGelPresentation(gl, { width: canvas.width, height: canvas.height }, { meshBlend: 'over' });
          let presentation = transparent ? null : makePresentation();
          handleRef.current = {
            fail,
            resize: (wp, hp, wc, hc) => {
              canvas.width = wp; canvas.height = hp; batch?.setViewport(wc, hc);
              if(presentation){presentation.destroy();presentation=makePresentation();}
            },
            draw: (mesh, bg, alpha=1) => {
              resize();if(lost)return;
              if(presentation){presentation.draw({mesh,background:bg},[],window.devicePixelRatio||1);return;}
              batch!.draw(
                { framebuffer: null, width: canvas.width, height: canvas.height },
                mesh,
                { clear: true, clearColor: [bg[0], bg[1], bg[2], alpha] },
              );
            },
            destroy: () => {batch?.destroy();presentation?.destroy();},
          };
        } else {
          const { requestDevice } = await import('../../lib/gpu/device');
          const { configureContext } = await import('../../lib/gpu/context');
          const { createMeshBatch } = await import('../../lib/gpu/meshBatch');
          const { createGelPresentation } = await import('../../lib/gel/present');
          const { device } = await requestDevice();
          if (cancelled || lost) return;
          cleanup.push(watchDeviceLoss(device,()=>handleLoss('webgpu')));
          cleanup.push(watchDeviceErrors(device,()=>handleLoss('webgpu',false)));
          const { context, format } = configureContext(canvas, device);
          cleanup.push(()=>context.unconfigure());
          const batch = transparent ? createMeshBatch(device, { viewport: { width, height }, blend: 'over', format }) : null;
          const makePresentation = () => createGelPresentation(device, format, { width: canvas.width, height: canvas.height }, { meshBlend: 'over' });
          let presentation = transparent ? null : makePresentation();
          handleRef.current = {
            fail,
            resize: (_wp, _hp, wc, hc) => {
              batch?.setViewport(wc, hc);
              if(presentation){presentation.destroy();presentation=makePresentation();}
            },
            draw: (mesh, bg, alpha=1) => {
              resize();if(lost)return;
              const enc = device.createCommandEncoder({ label: 'molsim' });
              if(presentation){
                presentation.draw(enc,{mesh,background:bg},context.getCurrentTexture().createView(),[],window.devicePixelRatio||1);
                device.queue.submit([enc.finish()]);return;
              }
              batch!.draw(enc, context.getCurrentTexture().createView(), mesh, {
                clear: true,
                clearColor: { r: bg[0], g: bg[1], b: bg[2], a: alpha },
                callIdx: 0,
              });
              device.queue.submit([enc.finish()]);
            },
            destroy: () => {batch?.destroy();presentation?.destroy();},
          };
        }
        if (!cancelled && !lost) onSuccess();
      } catch (err) {
        if (cancelled || lost) return;
        console.error('SampleSimCanvas graphics initialization failed:', err);
        lost=true;
        dispose();
        onFailure(backend);
      }
    })();

    return () => {
      cancelled = true;
      dispose();
    };
  }, [width, height, transparent, attempt, forcedBackend, onFailure, onLoss, onSuccess]);

  // Draw after the application frame; acquiring a GPU never gates simulation.
  useEffect(() => store.subscribeFrame(() => {
    const handle=handleRef.current;
    if (handle && view.alive) {
      // React has not committed this tick's snapshot yet. Resolve current
      // source identities here so the mesh uses the just-completed frame.
      const {selected,rollover}=store.getMolecularHighlights(view);
      const mesh=representativeFragment === undefined
        ? buildMoleculesMesh(sim.parts,selected,rollover,MESH_TUNING)
        : buildRepresentativeMesh(sim.parts,representativeFragment,representativeCenter ?? {x:width/2,y:height/2},MESH_TUNING);
      const highlight:0|1|2=downRef.current?2:hoverRef.current?1:0;
      try { handle.draw(mesh,representativeFragment === undefined
        ? computeBackgroundColor(dyeMassesFromSample(view.sample),highlight)
        : [0,0,0], representativeFragment === undefined ? 1 : 0); }
      catch(error) { handle.fail(error); }
    }
    setTick(t=>(t+1)%1_000_000);
  }),[store,view,sim,representativeFragment,representativeCenter,width,height]);

  const eventCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width)  * width,
      y: ((e.clientY - rect.top)  / rect.height) * height,
    };
  }, [width, height, attempt]);

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

  return (<>
    <canvas
      key={attempt}
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
        pointerEvents: representativeFragment === undefined ? 'auto' : 'none',
      }}
    />
    {failed&&<GraphicsFailure testId={`${testId}-error`} width={width} height={height}
      onRetry={onRetry} />}
  </>);
}

/**
 * Sum dye fragments like native Sample::getDyes (including duplicates), indexed by
 * the fragment's dye index. `Fragment.dye` is the dye index per src/lib/sim/
 * sample.ts (-1 = not a dye; 0..3 = dye index); `isDyeFragment` gates non-dyes.
 */
function dyeMassesFromSample(sample: Sample | null): number[] {
  const out = new Array<number>(DYE_COUNT).fill(0);
  if (!sample) return out;
  for (const f of sample.fragments) {
    if (isDyeFragment(f) && f.dye >= 0 && f.dye < DYE_COUNT) out[f.dye] = Math.fround(out[f.dye] + Math.fround(f.mass));
  }
  return out;
}
