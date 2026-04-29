import type { PingPong } from '../../gpu/target';
import type { WarpTextureCpu } from '../warpTexture';
import { createUniformBuffer, writeVec2, type UniformBuffer } from '../../gpu/uniforms';
import { createShaderModule } from '../../gpu/shader';
import { createQuad } from '../../gpu/quad';
import passVertSrc from '../../../shaders/passthrough.vert.wgsl?raw';
import warpFragSrc from '../../../shaders/warp.frag.wgsl?raw';

export type WarpKind = '1d' | '2d';

export interface WarpPass {
  /**
   * Apply a single warp pass: read `target.current`, sample `warp` texture,
   * write deflected result to `target.next`, then swap. After return, the
   * warped image is at `target.current`.
   *
   * `callIdx` selects a per-call texture/uniform slot (separate pools for
   * `1d` and `2d` kinds; `2d` is only the overcook pass). `kind` picks the
   * pool. The orchestrator passes a unique slot per call within a frame so
   * the writeTexture/writeBuffer calls don't collide on the device queue.
   */
  run(
    encoder: GPUCommandEncoder,
    target: PingPong,
    warp: WarpTextureCpu,
    callIdx: number,
    kind: WarpKind,
  ): void;
  destroy(): void;
}

export function createWarpPass(
  device: GPUDevice,
  gelSize: { width: number; height: number },
  format: GPUTextureFormat = 'rgba8unorm-srgb'
): WarpPass {
  const quad = createQuad(device);
  const vs = createShaderModule(device, passVertSrc, 'passthrough.vert');
  const fs = createShaderModule(device, warpFragSrc, 'warp.frag');

  const bgl = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX,   buffer:  { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 4, visibility: GPUShaderStage.FRAGMENT, buffer:  { type: 'uniform' } },
    ],
  });

  const layout = device.createPipelineLayout({ bindGroupLayouts: [bgl] });
  const pipeline = device.createRenderPipeline({
    label: 'warp', layout,
    vertex:   { module: vs, entryPoint: 'vs_main', buffers: [quad.layout] },
    fragment: { module: fs, entryPoint: 'fs_main', targets: [{ format }] },
    primitive: { topology: 'triangle-strip' },
  });

  const sampler = device.createSampler({
    magFilter: 'linear', minFilter: 'linear',
    addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
  });

  const uPass = createUniformBuffer(device, 48, 'warp-pass-uniforms');
  writeVec2(uPass.view,  0, 0, 0);
  writeVec2(uPass.view,  8, gelSize.width, gelSize.height);
  writeVec2(uPass.view, 16, 0, 0);
  writeVec2(uPass.view, 24, 1, 1);
  writeVec2(uPass.view, 32, gelSize.width, gelSize.height);
  writeVec2(uPass.view, 40, 0, 0);
  uPass.upload(device.queue);

  // Per-call pools. `warpTex1Ds` and `warpTex2Ds` are separate pools (smile
  // and welldamage share the 1D pool indexed by their callIdx; overcook
  // owns the 2D pool). `uWarps` is a single shared uniform pool indexed by
  // (kind-tagged) call number — each warp.run() consumes one slot.
  type TexSlot = { tex: GPUTexture; width: number; height: number };
  const warpTex1Ds: TexSlot[] = [];
  const warpTex2Ds: TexSlot[] = [];
  const uWarps1D: UniformBuffer[] = [];
  const uWarps2D: UniformBuffer[] = [];

  function ensureTexSlot(pool: TexSlot[], callIdx: number, width: number, height: number, label: string): TexSlot {
    while (pool.length <= callIdx) {
      // Allocate a placeholder slot at the requested size — first use of
      // this slot. (We do not pre-allocate beyond what callers need.)
      pool.push({
        tex: device.createTexture({
          label: `${label}[${pool.length}]`,
          size: { width, height },
          format: 'rgba8unorm',
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        }),
        width, height,
      });
    }
    const slot = pool[callIdx];
    if (slot.width === width && slot.height === height) return slot;
    // Slot size mismatch — recreate. Destroying the old texture is safe per
    // WebGPU spec (pending commands referencing it complete normally).
    slot.tex.destroy();
    slot.tex = device.createTexture({
      label: `${label}[${callIdx}]`,
      size: { width, height },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    slot.width = width;
    slot.height = height;
    return slot;
  }

  function ensureUSlot(pool: UniformBuffer[], callIdx: number, label: string): UniformBuffer {
    while (pool.length <= callIdx) {
      pool.push(createUniformBuffer(device, 16, `${label}[${pool.length}]`));
    }
    return pool[callIdx];
  }

  return {
    run(encoder, target, warp, callIdx, kind) {
      const isOneD = kind === '1d';
      const texPool = isOneD ? warpTex1Ds : warpTex2Ds;
      const uPool = isOneD ? uWarps1D : uWarps2D;
      const slot = ensureTexSlot(texPool, callIdx, warp.width, warp.height, isOneD ? 'warp-tex-1d' : 'warp-tex-2d');
      const uWarp = ensureUSlot(uPool, callIdx, isOneD ? 'warp-uniforms-1d' : 'warp-uniforms-2d');

      device.queue.writeTexture(
        { texture: slot.tex },
        warp.data,
        { bytesPerRow: warp.width * 4, rowsPerImage: warp.height },
        { width: warp.width, height: warp.height }
      );
      writeVec2(uWarp.view, 0, warp.scale[0], warp.scale[1]);
      writeVec2(uWarp.view, 8, 0, 0);
      uWarp.upload(device.queue);

      // Bind group is created per call (cheap; matches composite.ts pattern).
      // This avoids stale-view bugs if a slot's texture is recreated due to
      // a size change between frames.
      const bg = device.createBindGroup({
        layout: bgl,
        entries: [
          { binding: 0, resource: { buffer: uPass.buffer } },
          { binding: 1, resource: target.current.view },
          { binding: 2, resource: sampler },
          { binding: 3, resource: slot.tex.createView() },
          { binding: 4, resource: { buffer: uWarp.buffer } },
        ],
      });

      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: target.next.view,
          loadOp: 'clear', storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        }],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bg);
      pass.setVertexBuffer(0, quad.buffer);
      pass.draw(quad.vertexCount);
      pass.end();
      target.swap();
    },
    destroy() {
      uPass.destroy();
      for (const u of uWarps1D) u.destroy();
      for (const u of uWarps2D) u.destroy();
      uWarps1D.length = 0;
      uWarps2D.length = 0;
      for (const s of warpTex1Ds) s.tex.destroy();
      for (const s of warpTex2Ds) s.tex.destroy();
      warpTex1Ds.length = 0;
      warpTex2Ds.length = 0;
      quad.destroy();
    },
  };
}
