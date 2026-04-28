export interface DeviceBundle {
  adapter: GPUAdapter;
  device: GPUDevice;
  queue: GPUQueue;
}

export async function requestDevice(): Promise<DeviceBundle> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator) || !navigator.gpu) {
    throw new Error('WebGPU not available');
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error('navigator.gpu.requestAdapter returned null');
  const device = await adapter.requestDevice();
  return { adapter, device, queue: device.queue };
}
