import type { Band } from '../../sim/band';
import type { RenderTarget } from '../../gpu/target';
import { createUniformBuffer, writeVec2 } from '../../gpu/uniforms';
import { createShaderModule } from '../../gpu/shader';
import { type Mesh, VERTEX_STRIDE } from '../mesh';
import { buildSmearMesh } from '../smear';
import { buildBodyMesh } from '../body';
import { buildFlamesMesh } from '../flames';
import geomVertSrc from '../../../shaders/geometry.vert.wgsl?raw';
import geomFragSrc from '../../../shaders/geometry.frag.wgsl?raw';

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

const INITIAL_VBO_BYTES = 64 * 1024;

export function createPrimitivePass(
  device: GPUDevice,
  gelSize: { width: number; height: number },
  format: GPUTextureFormat = 'rgba8unorm-srgb'
): PrimitivePass {
  const vs = createShaderModule(device, geomVertSrc, 'geometry.vert');
  const fs = createShaderModule(device, geomFragSrc, 'geometry.frag');

  const bgl = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
    ],
  });

  const layout = device.createPipelineLayout({ bindGroupLayouts: [bgl] });

  const pipeline = device.createRenderPipeline({
    label: 'primitives',
    layout,
    vertex: {
      module: vs,
      entryPoint: 'vs_main',
      buffers: [{
        arrayStride: VERTEX_STRIDE * 4,
        stepMode: 'vertex',
        attributes: [
          { shaderLocation: 0, offset: 0,     format: 'float32x2' },
          { shaderLocation: 1, offset: 4 * 2, format: 'float32x4' },
        ],
      }],
    },
    fragment: {
      module: fs, entryPoint: 'fs_main',
      targets: [{
        format,
        blend: {
          // Additive (matches C++ SRC_ALPHA, ONE on the band fbo with alpha=1 primitives)
          color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
          alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
        },
      }],
    },
    primitive: { topology: 'triangle-list' },
  });

  const ub = createUniformBuffer(device, 16, 'geom-uniforms');
  writeVec2(ub.view, 0, gelSize.width, gelSize.height);
  writeVec2(ub.view, 8, 0, 0);
  ub.upload(device.queue);

  const bg = device.createBindGroup({
    layout: bgl,
    entries: [{ binding: 0, resource: { buffer: ub.buffer } }],
  });

  // Per-call VBO pool. Indexed by callIdx (one per band per frame). Grows on
  // demand; reused frame-to-frame. Each slot grows by 2x when a draw needs
  // more bytes than the slot currently holds.
  type Slot = { buffer: GPUBuffer; size: number };
  const vbos: Slot[] = [];

  function ensureSlot(callIdx: number, byteLength: number): Slot {
    // Grow pool length up to and including callIdx.
    while (vbos.length <= callIdx) {
      const size = INITIAL_VBO_BYTES;
      vbos.push({
        buffer: device.createBuffer({
          label: `primitives-vbo[${vbos.length}]`,
          size,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        }),
        size,
      });
    }
    const slot = vbos[callIdx];
    if (slot.size >= byteLength) return slot;
    // Need to grow this slot. Destroying the old buffer is safe per WebGPU
    // spec — any encoded but unsubmitted commands referencing it complete
    // normally; the buffer is freed once GPU work that uses it finishes.
    slot.buffer.destroy();
    let newSize = slot.size;
    while (newSize < byteLength) newSize *= 2;
    slot.size = newSize;
    slot.buffer = device.createBuffer({
      label: `primitives-vbo[${callIdx}]`,
      size: newSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    return slot;
  }

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
      if (mesh.vertexCount === 0) {
        // Still need to clear the destination
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: dst.view, loadOp: 'clear', storeOp: 'store',
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
          }],
        });
        pass.end();
        return;
      }
      const slot = ensureSlot(callIdx, mesh.data.byteLength);
      device.queue.writeBuffer(slot.buffer, 0, mesh.data);
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: dst.view,
          loadOp: 'clear', storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        }],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bg);
      pass.setVertexBuffer(0, slot.buffer);
      pass.draw(mesh.vertexCount);
      pass.end();
    },
    destroy() {
      for (const slot of vbos) slot.buffer.destroy();
      vbos.length = 0;
      ub.destroy();
    },
  };
}
