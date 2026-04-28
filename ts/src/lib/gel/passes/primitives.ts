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
   */
  draw(encoder: GPUCommandEncoder, dst: RenderTarget, band: Band): void;
  destroy(): void;
}

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

  // Pre-allocate a VBO that grows as needed
  let vbo: GPUBuffer | null = null;
  let vboSize = 0;

  function ensureVbo(byteLength: number) {
    if (vbo && vboSize >= byteLength) return;
    vbo?.destroy();
    vboSize = Math.max(byteLength, 64 * 1024);
    vbo = device.createBuffer({
      label: 'primitives-vbo',
      size: vboSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
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
    draw(encoder, dst, band) {
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
      ensureVbo(mesh.data.byteLength);
      device.queue.writeBuffer(vbo!, 0, mesh.data);
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: dst.view,
          loadOp: 'clear', storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        }],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bg);
      pass.setVertexBuffer(0, vbo!);
      pass.draw(mesh.vertexCount);
      pass.end();
    },
    destroy() {
      vbo?.destroy();
      ub.destroy();
    },
  };
}
