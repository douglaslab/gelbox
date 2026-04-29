import type { PingPong } from '../../gpu/target';
import { createUniformBuffer, writeVec2 } from '../../gpu/uniforms';
import { createShaderModule } from '../../gpu/shader';
import { createQuad } from '../../gpu/quad';
import passVertSrc  from '../../../shaders/passthrough.vert.wgsl?raw';
import blur5FragSrc from '../../../shaders/blur5.frag.wgsl?raw';
import blur9FragSrc from '../../../shaders/blur9.frag.wgsl?raw';
import blur13FragSrc from '../../../shaders/blur13.frag.wgsl?raw';

export interface BlurPass {
  /**
   * Apply a separable Gaussian blur of `distance` pixels to `target`. Picks
   * blur5/9/13 kernels in a 1/2/3-pixel step pattern (matches C++ GelRender::blur).
   * On return, the blurred image is at `target.current` (the ping-pong has been
   * swapped 2*ceil(distance/3) times). Distances <= 0 are no-ops.
   */
  run(encoder: GPUCommandEncoder, target: PingPong, distance: number): void;
  destroy(): void;
}

export function createBlurPass(
  device: GPUDevice,
  gelSize: { width: number; height: number },
  format: GPUTextureFormat = 'rgba8unorm-srgb'
): BlurPass {
  const quad = createQuad(device);
  const vs = createShaderModule(device, passVertSrc, 'passthrough.vert');

  const bgl = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX,   buffer:  { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer:  { type: 'uniform' } },
    ],
  });

  function makePipeline(fs: GPUShaderModule, label: string) {
    const layout = device.createPipelineLayout({ bindGroupLayouts: [bgl] });
    return device.createRenderPipeline({
      label, layout,
      vertex:   { module: vs, entryPoint: 'vs_main', buffers: [quad.layout] },
      fragment: { module: fs, entryPoint: 'fs_main', targets: [{ format }] },
      primitive: { topology: 'triangle-strip' },
    });
  }

  const pipelines: GPURenderPipeline[] = [
    makePipeline(createShaderModule(device, blur5FragSrc,  'blur5'),  'blur5'),
    makePipeline(createShaderModule(device, blur9FragSrc,  'blur9'),  'blur9'),
    makePipeline(createShaderModule(device, blur13FragSrc, 'blur13'), 'blur13'),
  ];

  const sampler = device.createSampler({
    magFilter: 'linear', minFilter: 'linear',
    addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
  });

  const uPass = createUniformBuffer(device, 48, 'blur-pass-uniforms');
  writeVec2(uPass.view,  0, 0, 0);
  writeVec2(uPass.view,  8, gelSize.width, gelSize.height);
  writeVec2(uPass.view, 16, 0, 0);
  writeVec2(uPass.view, 24, 1, 1);
  writeVec2(uPass.view, 32, gelSize.width, gelSize.height);
  writeVec2(uPass.view, 40, 0, 0);
  uPass.upload(device.queue);

  // Two pre-baked direction uniforms — the only blur uniform field that
  // varies between calls is the direction, which is always either (1,0) or
  // (0,1). By baking both up front, we avoid per-call writeBuffer calls
  // (which would race with command-buffer recording on the device queue).
  const uBlurH = createUniformBuffer(device, 16, 'blur-uniforms-h');
  writeVec2(uBlurH.view, 0, gelSize.width, gelSize.height);
  writeVec2(uBlurH.view, 8, 1, 0);
  uBlurH.upload(device.queue);

  const uBlurV = createUniformBuffer(device, 16, 'blur-uniforms-v');
  writeVec2(uBlurV.view, 0, gelSize.width, gelSize.height);
  writeVec2(uBlurV.view, 8, 0, 1);
  uBlurV.upload(device.queue);

  function makeBindGroup(srcView: GPUTextureView, uBuffer: GPUBuffer): GPUBindGroup {
    return device.createBindGroup({
      layout: bgl,
      entries: [
        { binding: 0, resource: { buffer: uPass.buffer } },
        { binding: 1, resource: srcView },
        { binding: 2, resource: sampler },
        { binding: 3, resource: { buffer: uBuffer } },
      ],
    });
  }

  return {
    run(encoder, target, distance) {
      let steps = Math.floor(distance);
      while (steps > 0) {
        const kernel = Math.min(steps, 3);  // 1, 2, or 3
        const pipeline = pipelines[kernel - 1];
        for (let dir = 0; dir < 2; dir++) {
          const uBlur = dir === 0 ? uBlurH : uBlurV;
          const bg = makeBindGroup(target.current.view, uBlur.buffer);
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
        }
        steps -= kernel;
      }
    },
    destroy() {
      uPass.destroy();
      uBlurH.destroy();
      uBlurV.destroy();
      quad.destroy();
    },
  };
}
