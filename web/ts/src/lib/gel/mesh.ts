export interface Mesh {
  data: Float32Array;        // [x, y, r, g, b, a] per vertex
  vertexCount: number;
}

export const VERTEX_STRIDE = 6;  // floats per vertex
