import type { RenderTarget } from '../../gpu/target';
import { createUniformBuffer, writeVec4, type UniformBuffer } from '../../gpu/uniforms';
import { createShaderModule } from '../../gpu/shader';
import { createQuad } from '../../gpu/quad';
import passVertSrc       from '../../../shaders/passthrough.vert.wgsl?raw';
import gelPassthroughSrc from '../../../shaders/gel-passthrough.frag.wgsl?raw';

export interface CompositePass {
  /**
   * Composite `src` into `dst` modulated by `color` (RGB tint) using premultiplied
   * additive blend (matches C++ SRC_ALPHA, ONE on unpremultiplied source). When
   * `clear` is true, `dst` is cleared to black before the draw (used for the first
   * band of the frame); otherwise `dst` is loaded and accumulated onto.
   *
   * `callIdx` selects a per-call tint-uniform slot in an internal pool. The
   * orchestrator passes a unique slot per draw within a frame so the
   * writeBuffer calls don't collide on the device queue.
   */
  run(
    encoder: GPUCommandEncoder,
    src: RenderTarget,
    dst: RenderTarget,
    color: [number, number, number],
    clear: boolean,
    callIdx: number,
  ): void;
  destroy(): void;
}

export function createCompositePass(
  device: GPUDevice,
  gelSize: { width: number; height: number },
  format: GPUTextureFormat = 'rgba8unorm-srgb'
): CompositePass {
  const quad = createQuad(device);
  const vs = createShaderModule(device, passVertSrc,       'passthrough.vert');
  const fs = createShaderModule(device, gelPassthroughSrc, 'gel-passthrough.frag');

  const bgl = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX,   buffer:  { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer:  { type: 'uniform' } },
    ],
  });

  const layout = device.createPipelineLayout({ bindGroupLayouts: [bgl] });
  const pipeline = device.createRenderPipeline({
    label: 'composite', layout,
    vertex: { module: vs, entryPoint: 'vs_main', buffers: [quad.layout] },
    fragment: {
      module: fs, entryPoint: 'fs_composite',
      targets: [{
        format,
        blend: {
          // Premultiplied additive (matches C++ SRC_ALPHA, ONE on unpremultiplied src)
          color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
          alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
        },
      }],
    },
    primitive: { topology: 'triangle-strip' },
  });

  const sampler = device.createSampler({
    magFilter: 'linear', minFilter: 'linear',
    addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
  });

  const uPass = createUniformBuffer(device, 48, 'composite-pass-uniforms');
  // Same fullscreen mapping as blur.ts
  const dv = uPass.view;
  dv.setFloat32(0,  0, true); dv.setFloat32(4,  0, true);
  dv.setFloat32(8,  gelSize.width, true); dv.setFloat32(12, gelSize.height, true);
  dv.setFloat32(16, 0, true); dv.setFloat32(20, 0, true);
  dv.setFloat32(24, 1, true); dv.setFloat32(28, 1, true);
  dv.setFloat32(32, gelSize.width, true); dv.setFloat32(36, gelSize.height, true);
  dv.setFloat32(40, 0, true); dv.setFloat32(44, 0, true);
  uPass.upload(device.queue);

  // Per-call tint-uniform pool (16 bytes each: r, g, b, 1). Grows on demand;
  // reused frame-to-frame. Slot size is fixed (uniform layout never changes),
  // so slots are allocated once per session.
  const uComps: UniformBuffer[] = [];
  function ensureSlot(callIdx: number): UniformBuffer {
    while (uComps.length <= callIdx) {
      uComps.push(createUniformBuffer(device, 16, `composite-uniforms[${uComps.length}]`));
    }
    return uComps[callIdx];
  }

  return {
    run(encoder, src, dst, color, clear, callIdx) {
      const uComp = ensureSlot(callIdx);
      writeVec4(uComp.view, 0, color[0], color[1], color[2], 1);
      uComp.upload(device.queue);

      const bg = device.createBindGroup({
        layout: bgl,
        entries: [
          { binding: 0, resource: { buffer: uPass.buffer } },
          { binding: 1, resource: src.view },
          { binding: 2, resource: sampler },
          { binding: 3, resource: { buffer: uComp.buffer } },
        ],
      });

      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: dst.view,
          loadOp:  clear ? 'clear' : 'load',
          storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        }],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bg);
      pass.setVertexBuffer(0, quad.buffer);
      pass.draw(quad.vertexCount);
      pass.end();
    },
    destroy() {
      uPass.destroy();
      for (const u of uComps) u.destroy();
      uComps.length = 0;
      quad.destroy();
    },
  };
}
