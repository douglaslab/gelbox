export interface DeviceBundle {
  adapter: GPUAdapter;
  device: GPUDevice;
  queue: GPUQueue;
}

let cached: Promise<DeviceBundle> | null = null;

export async function requestDevice(): Promise<DeviceBundle> {
  if (cached) return cached;
  cached = (async () => {
    if (typeof navigator === 'undefined' || !('gpu' in navigator) || !navigator.gpu) {
      throw new Error('WebGPU not available');
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('navigator.gpu.requestAdapter returned null');
    const device = await adapter.requestDevice();
    device.lost.then(() => { cached = null; });   // allow re-acquire after device loss
    return { adapter, device, queue: device.queue };
  })();
  // If acquisition fails, clear the cache so a later call can retry.
  cached.catch(() => { cached = null; });
  return cached;
}
