import { createUniformBuffer, writeVec2 } from './uniforms';
import { createShaderModule } from './shader';
import { type Mesh, VERTEX_STRIDE } from '../gel/mesh';
import geomVertSrc from '../../shaders/geometry.vert.wgsl?raw';
import geomFragSrc from '../../shaders/geometry.frag.wgsl?raw';

export type BlendMode = 'additive' | 'over';

export interface MeshBatchDrawOpts {
  clear: boolean;
  clearColor?: { r: number; g: number; b: number; a: number };
  /** Selects a per-call VBO pool slot. Unique per draw within a frame. */
  callIdx: number;
}

export interface MeshBatch {
  draw(
    encoder: GPUCommandEncoder,
    targetView: GPUTextureView,
    mesh: Mesh,
    opts: MeshBatchDrawOpts,
  ): void;
  setViewport(width: number, height: number): void;
  destroy(): void;
}

const INITIAL_VBO_BYTES = 64 * 1024;

function blendState(mode: BlendMode): GPUBlendState {
  if (mode === 'additive') {
    // Matches gel primitives: SRC_ALPHA,ONE on alpha=1 premultiplied output.
    return {
      color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
      alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
    };
  }
  // 'over' — geometry.frag outputs premultiplied (rgb*a, a), so straight
  // "source-over" is (ONE, ONE_MINUS_SRC_ALPHA).
  return {
    color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
  };
}

export function createMeshBatch(
  device: GPUDevice,
  opts: {
    viewport: { width: number; height: number };
    blend: BlendMode;
    format?: GPUTextureFormat;
  },
): MeshBatch {
  const format = opts.format ?? 'rgba8unorm-srgb';
  const vs = createShaderModule(device, geomVertSrc, 'geometry.vert');
  const fs = createShaderModule(device, geomFragSrc, 'geometry.frag');

  const bgl = device.createBindGroupLayout({
    entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }],
  });

  const pipeline = device.createRenderPipeline({
    label: `meshBatch-${opts.blend}`,
    layout: device.createPipelineLayout({ bindGroupLayouts: [bgl] }),
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
      module: fs,
      entryPoint: 'fs_main',
      targets: [{ format, blend: blendState(opts.blend) }],
    },
    primitive: { topology: 'triangle-list' },
  });

  const ub = createUniformBuffer(device, 16, 'meshBatch-uniforms');
  writeVec2(ub.view, 0, opts.viewport.width, opts.viewport.height);
  writeVec2(ub.view, 8, 0, 0);
  ub.upload(device.queue);

  const bg = device.createBindGroup({
    layout: bgl,
    entries: [{ binding: 0, resource: { buffer: ub.buffer } }],
  });

  type Slot = { buffer: GPUBuffer; size: number };
  const vbos: Slot[] = [];

  function ensureSlot(callIdx: number, byteLength: number): Slot {
    while (vbos.length <= callIdx) {
      vbos.push({
        buffer: device.createBuffer({
          label: `meshBatch-vbo[${vbos.length}]`,
          size: INITIAL_VBO_BYTES,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        }),
        size: INITIAL_VBO_BYTES,
      });
    }
    const slot = vbos[callIdx];
    if (slot.size >= byteLength) return slot;
    slot.buffer.destroy();
    let newSize = slot.size;
    while (newSize < byteLength) newSize *= 2;
    slot.size = newSize;
    slot.buffer = device.createBuffer({
      label: `meshBatch-vbo[${callIdx}]`,
      size: newSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    return slot;
  }

  return {
    setViewport(w, h) {
      writeVec2(ub.view, 0, w, h);
      ub.upload(device.queue);
    },
    draw(encoder, targetView, mesh, { clear, clearColor, callIdx }) {
      // Default clear is transparent black (a:0): the 'over' consumer composites
      // onto the page, so an unspecified clear must not leave opaque black.
      // Consumers that want an opaque background (gel additive, sim bg) always
      // pass an explicit clearColor.
      const cc = clearColor ?? { r: 0, g: 0, b: 0, a: 0 };
      if (mesh.vertexCount === 0) {
        if (clear) {
          const pass = encoder.beginRenderPass({
            colorAttachments: [{ view: targetView, loadOp: 'clear', storeOp: 'store', clearValue: cc }],
          });
          pass.end();
        }
        return;
      }
      const slot = ensureSlot(callIdx, mesh.data.byteLength);
      device.queue.writeBuffer(slot.buffer, 0, mesh.data);
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: targetView,
          loadOp: clear ? 'clear' : 'load',
          storeOp: 'store',
          // clearValue is ignored by WebGPU when loadOp is 'load'; only set it
          // when we actually clear.
          ...(clear ? { clearValue: cc } : {}),
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
