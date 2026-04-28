export interface Quad {
  buffer: GPUBuffer;
  vertexCount: number;
  layout: GPUVertexBufferLayout;
  destroy(): void;
}

const QUAD_DATA = new Float32Array([
  // x, y, u, v   (triangle strip — 0,0 → 1,0 → 0,1 → 1,1)
  0, 0, 0, 0,
  1, 0, 1, 0,
  0, 1, 0, 1,
  1, 1, 1, 1,
]);

export function createQuad(device: GPUDevice): Quad {
  const buffer = device.createBuffer({
    label: 'fullscreen-quad',
    size: QUAD_DATA.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(buffer, 0, QUAD_DATA);
  return {
    buffer,
    vertexCount: 4,
    layout: {
      arrayStride: 4 * 4,
      stepMode: 'vertex',
      attributes: [
        { shaderLocation: 0, offset: 0,     format: 'float32x2' }, // position
        { shaderLocation: 1, offset: 4 * 2, format: 'float32x2' }, // texcoord
      ],
    },
    destroy() { buffer.destroy(); },
  };
}
