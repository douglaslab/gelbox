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

  // Reusable warp texture (resized as needed)
  let warpTex: GPUTexture | null = null;
  let warpTexW = 0;
  function ensureWarpTex(width: number) {
    if (warpTex && warpTexW === width) return;
    warpTex?.destroy();
    warpTexW = width;
    warpTex = device.createTexture({
      label: 'warp-tex',
      size: { width, height: 1 },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
  }

  return {
    run(encoder, target, warp) {
      ensureWarpTex(warp.width);
      device.queue.writeTexture(
        { texture: warpTex! },
        warp.data,
        { bytesPerRow: warp.width * 4 },
        { width: warp.width, height: 1 }
      );
      writeVec2(uWarp.view, 0, warp.scale[0], warp.scale[1]);
      writeVec2(uWarp.view, 8, 0, 0);
      uWarp.upload(device.queue);

      const bg = device.createBindGroup({
        layout: bgl,
        entries: [
          { binding: 0, resource: { buffer: uPass.buffer } },
          { binding: 1, resource: target.current.view },
          { binding: 2, resource: sampler },
          { binding: 3, resource: warpTex!.createView() },
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
      uWarp.destroy();
      warpTex?.destroy();
      quad.destroy();
    },
  };
}
