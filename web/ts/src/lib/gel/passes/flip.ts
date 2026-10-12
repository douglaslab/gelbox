import type { RenderTarget } from '../../gpu/target';
import { createShaderModule } from '../../gpu/shader';

/** Restore top-down storage after native bottom-left primitive rasterization.
 * Integer texel reads preserve all RGBA8 values without filtering or offsets.
 */
export function createVerticalFlipPass(device: GPUDevice, format: GPUTextureFormat) {
  const shader = createShaderModule(device, `
    @group(0) @binding(0) var source: texture_2d<f32>;
    @vertex fn vertex(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
      let x = f32((index << 1u) & 2u);
      let y = f32(index & 2u);
      return vec4f(x * 2.0 - 1.0, y * 2.0 - 1.0, 0.0, 1.0);
    }
    @fragment fn fragment(@builtin(position) position: vec4f) -> @location(0) vec4f {
      let dimensions = textureDimensions(source);
      let pixel = vec2i(i32(position.x), i32(dimensions.y) - 1 - i32(position.y));
      return textureLoad(source, pixel, 0);
    }
  `, 'native-primitive-flip');
  const layout = device.createBindGroupLayout({ entries: [
    { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
  ] });
  const pipeline = device.createRenderPipeline({
    label: 'native-primitive-flip',
    layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
    vertex: { module: shader, entryPoint: 'vertex' },
    fragment: { module: shader, entryPoint: 'fragment', targets: [{ format }] },
    primitive: { topology: 'triangle-list' },
  });
  return {
    run(encoder: GPUCommandEncoder, src: RenderTarget, dst: RenderTarget) {
      const bindings = device.createBindGroup({ layout, entries: [{ binding: 0, resource: src.view }] });
      const pass = encoder.beginRenderPass({
        label: 'native-primitive-flip',
        colorAttachments: [{ view: dst.view, loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindings);
      pass.draw(3);
      pass.end();
    },
  };
}
