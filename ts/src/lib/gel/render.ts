import { withAllocationRollback } from '../gpu/allocations';
import { nativeOutputExtent } from './warpTexture';
import { createPingPong, type RenderTarget } from '../gpu/target';
import { createPrimitivePass } from './passes/primitives';
import { createBlurPass }      from './passes/blur';
import { createWarpPass }      from './passes/warp';
import { createCompositePass } from './passes/composite';
import { buildSmileWarp }      from './smile';
import { buildWellDamageWarp } from './welldamage';
import { buildOvercookWarp }   from './overcook';
import { GEL_RENDER_TUNING }   from '../../data/tuning';
import type { Band }       from '../sim/band';
import type { GlobalWarp } from '../sim/globalWarp';
import { NO_GLOBAL_WARP }  from '../sim/globalWarp';

export interface GelRenderer {
  setBands(bands: Band[]): void;
  setGlobalWarp(w: GlobalWarp): void;
  render(): void;
  readonly output: RenderTarget;  // getter — points at composite.current after render()
  destroy(): void;
}

function createGelRendererImpl(
  device: GPUDevice,
  gelSize: { width: number; height: number },
  pixelsPerUnit: number,
  format: GPUTextureFormat = 'rgba8unorm-srgb'
): GelRenderer {
  const outputW = nativeOutputExtent(gelSize.width, pixelsPerUnit);
  const outputH = nativeOutputExtent(gelSize.height, pixelsPerUnit);

  const band      = createPingPong(device, outputW, outputH, format, 'band');
  const composite = createPingPong(device, outputW, outputH, format, 'composite');

  const primitives = createPrimitivePass(device, gelSize, format);
  const blur       = createBlurPass(device, gelSize, format);
  const warp       = createWarpPass(device, gelSize, format);
  const cmp        = createCompositePass(device, gelSize, format);

  let bands: Band[] = [];
  let globalWarp: GlobalWarp = NO_GLOBAL_WARP;

  // Memo: overcook is a pure function of (globalWarp, gelSize, pixelsPerUnit).
  // gelSize and pixelsPerUnit are constructor-frozen, so the only invalidator
  // is setGlobalWarp. Cache invalidates on any setGlobalWarp call.
  let overcookMemo: { gw: GlobalWarp; warp: ReturnType<typeof buildOvercookWarp> } | null = null;

  // Per-band brightness clone — applies the H2O Faint factor by scaling all
  // brightness channels of the band before passing it to primitives.draw.
  // Cheaper than threading a brightScale parameter through three mesh builders.
  function withFaint(b: Band, s: number): Band {
    if (s === 1) return b;
    return {
      ...b,
      brightness: b.brightness * s,
      smearBrightnessAbove: [b.smearBrightnessAbove[0] * s, b.smearBrightnessAbove[1] * s],
      smearBrightnessBelow: [b.smearBrightnessBelow[0] * s, b.smearBrightnessBelow[1] * s],
    };
  }

  function render() {
    const encoder = device.createCommandEncoder({ label: 'gel-render' });

    const brightScale = globalWarp.h2oDistort
      ? GEL_RENDER_TUNING.h2oDistort.faint
      : 1;

    // Per-frame call counters for the warp pass. WebGPU's queue.writeTexture
    // and writeBuffer are GLOBAL on the device queue and do NOT serialize
    // with command-buffer recording — every shared-resource write within a
    // frame must target a unique pool slot or all draws end up reading the
    // last write. See passes/*.ts for pool details.
    let warp1dIdx = 0;

    bands.forEach((b, i) => {
      const banded = withFaint(b, brightScale);
      // 1. Primitives → band.current (always defined; clears even when empty)
      primitives.draw(encoder, band.current, banded, i);

      // 2. Smile warp
      const smile = buildSmileWarp({
        x1: banded.rect.x1, x2: banded.rect.x2,
        smileHeight: banded.smileHeight, smileExp: banded.smileExp,
      }, gelSize, pixelsPerUnit);
      if (smile) warp.run(encoder, band, smile, warp1dIdx++, '1d');

      // 3. Well-damage warp
      const wd = buildWellDamageWarp({
        rect: banded.rect, wellDamage: banded.wellDamage,
        wellDamageRandSeed: banded.wellDamageRandSeed,
      }, gelSize, pixelsPerUnit);
      if (wd) warp.run(encoder, band, wd, warp1dIdx++, '1d');

      // 4. Blur
      if (banded.blur > 0) blur.run(encoder, band, banded.blur * pixelsPerUnit);

      // 5. Composite — band.current → composite.current.
      //    First band clears composite; later bands accumulate.
      cmp.run(encoder, band.current, composite.current, banded.color, /*clear*/ i === 0, i);
    });

    // No bands: still need a defined composite RT for the canvas blit.
    if (bands.length === 0) {
      const pass = encoder.beginRenderPass({
        label: 'gel-render-empty-clear',
        colorAttachments: [{
          view: composite.current.view,
          loadOp: 'clear', storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        }],
      });
      pass.end();
    }

    // Global overcook warp on the composite ping-pong (only when h2oDistort is on).
    if (!overcookMemo || overcookMemo.gw !== globalWarp) {
      overcookMemo = { gw: globalWarp, warp: buildOvercookWarp(globalWarp, gelSize, pixelsPerUnit) };
    }
    const overcook = overcookMemo.warp;
    if (overcook) warp.run(encoder, composite, overcook, 0, '2d');

    device.queue.submit([encoder.finish()]);
  }

  return {
    setBands(b)       { bands = b; },
    setGlobalWarp(w)  { globalWarp = w; overcookMemo = null; },
    render:()=>withAllocationRollback(device,render),
    get output()      { return composite.current; },
    destroy() {
      primitives.destroy();
      blur.destroy();
      warp.destroy();
      cmp.destroy();
      band.destroy();
      composite.destroy();
    },
  };
}

export function createGelRenderer(
  device:GPUDevice,gelSize:{width:number;height:number},pixelsPerUnit:number,
  format:GPUTextureFormat='rgba8unorm-srgb',
):GelRenderer {
  return withAllocationRollback(device,()=>createGelRendererImpl(device,gelSize,pixelsPerUnit,format));
}
