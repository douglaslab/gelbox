import type { PingPong } from '../../gpu/target';
import type { WarpTextureCpu } from '../warpTexture';
import { createUniformBuffer, writeVec2 } from '../../gpu/uniforms';
import { createShaderModule } from '../../gpu/shader';
import { createQuad } from '../../gpu/quad';
import passVertSrc from '../../../shaders/passthrough.vert.wgsl?raw';
import warpFragSrc from '../../../shaders/warp.frag.wgsl?raw';

export interface WarpPass {
  /**
   * Apply a single warp pass: read `target.current`, sample `warp` texture,
   * write deflected result to `target.next`, then swap. After return, the
   * warped image is at `target.current`. Caller passes a CPU-built warp
   * texture (1×N or 2D); the pass uploads it to a managed GPU texture
   * (resized as needed across calls).
   */
  run(encoder: GPUCommandEncoder, target: PingPong, warp: WarpTextureCpu): void;
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

  const uWarp = createUniformBuffer(device, 16, 'warp-uniforms');

  // Split cache by "1D" (smile/welldamage 1×N) vs "2D" (overcook full-size).
  // We never destroy a cached texture mid-frame because submitted bind groups
  // referenced it. Different size classes get separate slots, so growing one
  // never invalidates the other.
  let warpTex1D: GPUTexture | null = null;
  let warpTex1DW = 0;
  let warpTex2D: GPUTexture | null = null;
  let warpTex2DW = 0;
  let warpTex2DH = 0;
  function ensureWarpTex(width: number, height: number): GPUTexture {
    if (height === 1) {
      if (warpTex1D && warpTex1DW === width) return warpTex1D;
      warpTex1D?.destroy();
      warpTex1DW = width;
      warpTex1D = device.createTexture({
        label: 'warp-tex-1d',
        size: { width, height: 1 },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      return warpTex1D;
    } else {
      if (warpTex2D && warpTex2DW === width && warpTex2DH === height) return warpTex2D;
      warpTex2D?.destroy();
      warpTex2DW = width;
      warpTex2DH = height;
      warpTex2D = device.createTexture({
        label: 'warp-tex-2d',
        size: { width, height },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      return warpTex2D;
    }
  }

  // Cache bind groups by (source target view × warp size class).
  // - Band ping-pong has 2 views; composite ping-pong has 2 views. So 4 sources.
  // - Two size classes: 1D (smile/welldamage) vs 2D (overcook).
  // Total potential entries: 8 (in practice 6: smile/wd ride 2 source views × 1D = 2 entries; overcook rides 2 source views × 2D = 2 entries).
  const bgCache1D = new WeakMap<GPUTextureView, GPUBindGroup>();
  const bgCache2D = new WeakMap<GPUTextureView, GPUBindGroup>();
  function getBindGroup(srcView: GPUTextureView, warpView: GPUTextureView, height: number): GPUBindGroup {
    const cache = height === 1 ? bgCache1D : bgCache2D;
    let bg = cache.get(srcView);
    if (bg) return bg;
    bg = device.createBindGroup({
      layout: bgl,
      entries: [
        { binding: 0, resource: { buffer: uPass.buffer } },
        { binding: 1, resource: srcView },
        { binding: 2, resource: sampler },
        { binding: 3, resource: warpView },
        { binding: 4, resource: { buffer: uWarp.buffer } },
      ],
    });
    cache.set(srcView, bg);
    return bg;
  }

  return {
    run(encoder, target, warp) {
      const tex = ensureWarpTex(warp.width, warp.height);
      device.queue.writeTexture(
        { texture: tex },
        warp.data,
        { bytesPerRow: warp.width * 4, rowsPerImage: warp.height },
        { width: warp.width, height: warp.height }
      );
      writeVec2(uWarp.view, 0, warp.scale[0], warp.scale[1]);
      writeVec2(uWarp.view, 8, 0, 0);
      uWarp.upload(device.queue);

      const bg = getBindGroup(target.current.view, tex.createView(), warp.height);

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
      uWarp.destroy();
      warpTex1D?.destroy();
      warpTex2D?.destroy();
      quad.destroy();
    },
  };
}
