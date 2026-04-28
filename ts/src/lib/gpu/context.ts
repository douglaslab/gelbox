export interface ConfiguredContext {
  context: GPUCanvasContext;
  format: GPUTextureFormat;
}

export function configureContext(
  canvas: HTMLCanvasElement,
  device: GPUDevice
): ConfiguredContext {
  const context = canvas.getContext('webgpu');
  if (!context) throw new Error('canvas.getContext("webgpu") returned null');
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format,
    alphaMode: 'premultiplied',
  });
  return { context, format };
}
