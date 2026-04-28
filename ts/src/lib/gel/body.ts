import type { Band } from '../sim/band';
import { type Mesh, VERTEX_STRIDE } from './smear';

export function buildBodyMesh(band: Band): Mesh {
  const b = band.brightness;
  const c: [number, number, number, number] = [b, b, b, 1];
  const { x1, y1, x2, y2 } = band.rect;
  const data = new Float32Array([
    // tri 1: lower-right, upper-right, upper-left
    x2, y2, ...c,
    x2, y1, ...c,
    x1, y1, ...c,
    // tri 2: upper-left, lower-left, lower-right
    x1, y1, ...c,
    x1, y2, ...c,
    x2, y2, ...c,
  ]);
  return { data, vertexCount: data.length / VERTEX_STRIDE };
}
