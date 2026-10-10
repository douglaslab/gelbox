import { CinderRand } from '../sim/rng';
import type { Band } from '../sim/band';
import { type Mesh, VERTEX_STRIDE } from './mesh';

export function buildFlamesMesh(band: Band): Mesh {
  if (band.flameHeight <= 0) return { data: new Float32Array(0), vertexCount: 0 };

  const f = Math.fround;
  const x1=f(band.rect.x1), x2=f(band.rect.x2), y1=f(band.rect.y1);
  const w = f(x2 - x1);
  const steps = Math.max(5, Math.floor(w / 2));
  const step  = f(w / steps);
  const rng   = new CinderRand(band.randSeed);

  const heights = new Float32Array(steps);
  const denom = f(1 / (steps - 1));
  for (let i = 0; i < steps; i++) {
    let x = f(i * denom);
    x = Math.min(x, f(1 - x));
    x = f(1 - x);
    x = f(x * x);
    heights[i] = f(f(x * 0.25) + f(rng.nextFloat() * rng.nextFloat()));
  }

  const b = band.brightness;
  const c: [number, number, number, number] = [b, b, b, 1];
  const verts: number[] = [];

  for (let i = 0; i < steps; i++) {
    const h  = Math.max(0, heights[i]);
    const fx1 = f(x1 + f(i * step));
    const fx2 = f(fx1 + step);
    const fy1 = f(y1 - f(f(band.flameHeight) * h));
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
