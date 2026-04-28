export interface ImageGraphPipelineOptions {
  device: GPUDevice;
  vertex: GPUShaderModule;
  fragment: GPUShaderModule;
  vertexLayout: GPUVertexBufferLayout;
  targetFormat: GPUTextureFormat;
  bindGroupLayout: GPUBindGroupLayout;
  blend?: GPUBlendState;
  label?: string;
}

export function createImageGraphPipeline(opts: ImageGraphPipelineOptions): GPURenderPipeline {
  const { device, vertex, fragment, vertexLayout, targetFormat, bindGroupLayout, blend, label } = opts;
  const layout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
  return device.createRenderPipeline({
    label,
    layout,
    vertex: { module: vertex, entryPoint: 'vs_main', buffers: [vertexLayout] },
    fragment: {
      module: fragment,
      entryPoint: 'fs_main',
      targets: [{ format: targetFormat, blend }],
    },
    primitive: { topology: 'triangle-strip', stripIndexFormat: undefined },
  });
}
