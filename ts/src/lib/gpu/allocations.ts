type Allocation=GPUBuffer|GPUTexture;
const scopes=new WeakMap<GPUDevice,Allocation[]>();

/** Synchronous constructor transaction; returned renderers retain normal ownership. */
export function withAllocationRollback<T>(device:GPUDevice,build:()=>T):T {
  const parent=scopes.get(device),allocated:Allocation[]=[];
  scopes.set(device,allocated);
  try {
    const result=build();
    // An outer constructor may still fail after this nested factory succeeds.
    parent?.push(...allocated);
    return result;
  } catch(error) {
    for(const resource of allocated.reverse())resource.destroy();
    throw error;
  } finally {
    if(parent)scopes.set(device,parent);else scopes.delete(device);
  }
}

export function allocateBuffer(device:GPUDevice,descriptor:GPUBufferDescriptor):GPUBuffer {
  const buffer=device.createBuffer(descriptor);scopes.get(device)?.push(buffer);return buffer;
}
export function allocateTexture(device:GPUDevice,descriptor:GPUTextureDescriptor):GPUTexture {
  const texture=device.createTexture(descriptor);scopes.get(device)?.push(texture);return texture;
}
