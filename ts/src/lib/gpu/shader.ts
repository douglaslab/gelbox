const cache = new WeakMap<GPUDevice, Map<string, GPUShaderModule>>();

export function createShaderModule(
  device: GPUDevice,
  wgsl: string,
  label?: string
): GPUShaderModule {
  let perDevice = cache.get(device);
  if (!perDevice) { perDevice = new Map(); cache.set(device, perDevice); }
  const key = wgsl;
  let mod = perDevice.get(key);
  if (mod) return mod;
  mod = device.createShaderModule({ label, code: wgsl });
  perDevice.set(key, mod);
  return mod;
}
