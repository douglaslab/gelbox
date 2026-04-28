import { mulberry32 } from '../sim/rng';
import type { Band } from '../sim/band';
import { type Mesh, VERTEX_STRIDE } from './mesh';

export function buildFlamesMesh(band: Band): Mesh {
  if (band.flameHeight <= 0) return { data: new Float32Array(0), vertexCount: 0 };

  const { x1, x2, y1 } = band.rect;
  const w = x2 - x1;
  const steps = Math.max(5, Math.floor(w / 2));
  const step  = w / steps;
  const rng   = mulberry32(band.randSeed);

  const heights = new Float32Array(steps);
  const denom = 1 / Math.max(1, steps - 1);
  for (let i = 0; i < steps; i++) {
    let x = i * denom;
    x = Math.min(x, 1 - x);
    x = 1 - x;
    x = x * x;
    heights[i] = x * 0.25 + rng() * rng();
  }

  const b = band.brightness;
  const c: [number, number, number, number] = [b, b, b, 1];
  const verts: number[] = [];

  for (let i = 0; i < steps; i++) {
    const h  = Math.max(0, heights[i]);
    const fx1 = x1 + i * step;
    const fx2 = fx1 + step;
    const fy1 = y1 - band.flameHeight * h;
    const fy2 = y1;
    // Same triangle winding as body
    verts.push(fx2, fy2, ...c);
    verts.push(fx2, fy1, ...c);
    verts.push(fx1, fy1, ...c);
    verts.push(fx1, fy1, ...c);
    verts.push(fx1, fy2, ...c);
    verts.push(fx2, fy2, ...c);
  }

  const data = new Float32Array(verts);
  return { data, vertexCount: data.length / VERTEX_STRIDE };
}
