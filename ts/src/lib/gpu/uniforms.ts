import { allocateBuffer, withAllocationRollback } from './allocations';
export interface UniformBuffer {
  buffer: GPUBuffer;
  cpu: ArrayBuffer;
  view: DataView;
  upload(queue: GPUQueue): void;
  destroy(): void;
}

function createUniformBufferImpl(
  device: GPUDevice,
  byteLength: number,
  label?: string
): UniformBuffer {
  // Round up to 16-byte alignment per WebGPU spec
  const size = Math.ceil(byteLength / 16) * 16;
  const buffer = allocateBuffer(device, {
    label,
    size,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const cpu = new ArrayBuffer(size);
  const view = new DataView(cpu);
  return {
    buffer,
    cpu,
    view,
    upload(queue) { queue.writeBuffer(buffer, 0, cpu, 0, size); },
    destroy() { buffer.destroy(); },
  };
}

export function writeVec2(view: DataView, offset: number, x: number, y: number) {
  view.setFloat32(offset, x, true);
  view.setFloat32(offset + 4, y, true);
}

export function writeVec4(view: DataView, offset: number, x: number, y: number, z: number, w: number) {
  view.setFloat32(offset, x, true);
  view.setFloat32(offset + 4, y, true);
  view.setFloat32(offset + 8, z, true);
  view.setFloat32(offset + 12, w, true);
}

export function createUniformBuffer(...args:Parameters<typeof createUniformBufferImpl>):UniformBuffer {
  return withAllocationRollback(args[0],()=>createUniformBufferImpl(...args));
}
