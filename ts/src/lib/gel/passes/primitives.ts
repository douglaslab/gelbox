import type { Band } from '../../sim/band';
import type { RenderTarget } from '../../gpu/target';
import { type Mesh, VERTEX_STRIDE } from '../mesh';
import { buildSmearMesh } from '../smear';
import { buildBodyMesh } from '../body';
import { buildFlamesMesh } from '../flames';
import { createMeshBatch } from '../../gpu/meshBatch';

export interface PrimitivePass {
  /**
   * Render band primitives (smears + body + flames) into `dst`. ALWAYS produces a
   * defined target: if the band has no visible geometry (smearAbove/smearBelow/
   * flameHeight all zero etc.), emits a clear-only pass so downstream passes
   * (warp, blur, composite) sample a clean RT. Callers MUST NOT skip this call
   * based on band emptiness.
   *
   * `callIdx` selects a per-call VBO slot in an internal pool. The orchestrator
   * passes a unique slot per draw within a frame so the VBO writes don't
   * collide on the device queue (which serializes globally, not per-encoder).
   */
  draw(encoder: GPUCommandEncoder, dst: RenderTarget, band: Band, callIdx: number): void;
  destroy(): void;
}

export function createPrimitivePass(
  device: GPUDevice,
  gelSize: { width: number; height: number },
  format: GPUTextureFormat = 'rgba8unorm-srgb',
): PrimitivePass {
  const batch = createMeshBatch(device, { viewport: gelSize, blend: 'additive', format });

  function combine(meshes: Mesh[]): Mesh {
    let total = 0;
    for (const m of meshes) total += m.data.length;
    const data = new Float32Array(total);
    let off = 0;
    for (const m of meshes) { data.set(m.data, off); off += m.data.length; }
    return { data, vertexCount: total / VERTEX_STRIDE };
  }

  return {
    draw(encoder, dst, band, callIdx) {
      const mesh = combine([
        buildSmearMesh(band),
        buildBodyMesh(band),
        buildFlamesMesh(band),
      ]);
      // Always clear (even when empty) so downstream passes sample a clean RT.
      batch.draw(encoder, dst.view, mesh, {
        clear: true,
        clearColor: { r: 0, g: 0, b: 0, a: 1 },
        callIdx,
      });
    },
    destroy() { batch.destroy(); },
  };
}
