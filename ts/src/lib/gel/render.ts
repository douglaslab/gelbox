import { createPingPong, createRenderTarget, type RenderTarget } from '../gpu/target';
import { createPrimitivePass } from './passes/primitives';
import { createBlurPass }      from './passes/blur';
import { createWarpPass }      from './passes/warp';
import { createCompositePass } from './passes/composite';
import { buildSmileWarp }      from './smile';
import { buildWellDamageWarp } from './welldamage';
import type { Band } from '../sim/band';

export interface GelRenderer {
  setBands(bands: Band[]): void;
  render(): void;
  output: RenderTarget;
  destroy(): void;
}

export function createGelRenderer(
  device: GPUDevice,
  gelSize: { width: number; height: number },
  pixelsPerUnit: number,
  format: GPUTextureFormat = 'rgba8unorm-srgb'
): GelRenderer {
  const outputW = Math.round(gelSize.width  * pixelsPerUnit);
  const outputH = Math.round(gelSize.height * pixelsPerUnit);

  const band      = createPingPong(device, outputW, outputH, format, 'band');
  const composite = createRenderTarget(device, outputW, outputH, format, 'composite');

  const primitives = createPrimitivePass(device, gelSize, format);
  const blur       = createBlurPass(device, gelSize, format);
  const warp       = createWarpPass(device, gelSize, format);
  const cmp        = createCompositePass(device, gelSize, format);

  let bands: Band[] = [];

  function render() {
    const encoder = device.createCommandEncoder({ label: 'gel-render' });

    bands.forEach((b, i) => {
      // 1. Primitives → band.current (always produces a defined target;
      //    clears internally to opaque black even on empty geometry)
      primitives.draw(encoder, band.current, b);

      // 2. Smile warp (if any)
      const smile = buildSmileWarp({
        x1: b.rect.x1, x2: b.rect.x2,
        smileHeight: b.smileHeight, smileExp: b.smileExp,
      }, gelSize);
      if (smile) warp.run(encoder, band, smile);

      // 3. Well-damage warp (if any)
      const wd = buildWellDamageWarp({
        rect: b.rect, wellDamage: b.wellDamage, wellDamageRandSeed: b.wellDamageRandSeed,
      }, gelSize);
      if (wd) warp.run(encoder, band, wd);

      // 4. Blur (no-op on distance <= 0)
      if (b.blur > 0) blur.run(encoder, band, b.blur * pixelsPerUnit);

      // 5. Composite — band.current → composite (additive, tinted).
      //    First band clears the composite; later bands accumulate.
      cmp.run(encoder, band.current, composite, b.color, /*clear*/ i === 0);
    });

    // If the bands array is empty, we still need a defined composite target
    // so the canvas blit (Task 13) sees opaque black. Emit a clear pass.
    if (bands.length === 0) {
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: composite.view,
          loadOp: 'clear', storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        }],
      });
      pass.end();
    }

    device.queue.submit([encoder.finish()]);
  }

  return {
    setBands(b) { bands = b; },
    render,
    output: composite,
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
