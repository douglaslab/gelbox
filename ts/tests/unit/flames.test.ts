import { describe, it, expect } from 'vitest';
import { buildFlamesMesh } from '../../src/lib/gel/flames';
import { VERTEX_STRIDE } from '../../src/lib/gel/mesh';
import type { Band } from '../../src/lib/sim/band';

const band: Band = {
  rect: { x1: 100, y1: 100, x2: 200, y2: 110 },
  smearAbove: 0, smearBelow: 0,
  smearBrightnessAbove: [0, 0],
  smearBrightnessBelow: [0, 0],
  flameHeight: 30,
  smileHeight: 0, smileExp: 0,
  blur: 0,
  brightness: 0.9,
  color: [1, 1, 1],
  randSeed: 1234,
  wellDamage: 0, wellDamageRandSeed: 0,
};

describe('buildFlamesMesh', () => {
  it('returns empty mesh when flameHeight is 0', () => {
    const mesh = buildFlamesMesh({ ...band, flameHeight: 0 });
    expect(mesh.vertexCount).toBe(0);
  });

  it('is deterministic for the same seed', () => {
    const a = buildFlamesMesh(band);
    const b = buildFlamesMesh(band);
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });

  it('changes when seed changes', () => {
    const a = buildFlamesMesh(band);
    const b = buildFlamesMesh({ ...band, randSeed: 9999 });
    expect(Array.from(a.data)).not.toEqual(Array.from(b.data));
  });

  it('emits steps = max(5, width/2) rectangles, 6 verts each', () => {
    // width=100 → steps=max(5, 50)=50
    const mesh = buildFlamesMesh(band);
    expect(mesh.vertexCount).toBe(50 * 6);
  });

  it('emits a band with brightness in alpha-channel position', () => {
    const mesh = buildFlamesMesh(band);
    // Vertex 0: x, y, r, g, b, a — alpha is at offset 5
    expect(mesh.data[5]).toBe(1);
    expect(mesh.data[2]).toBeCloseTo(0.9); // r
  });

  it('uses VERTEX_STRIDE-correct float layout', () => {
    const mesh = buildFlamesMesh(band);
    expect(mesh.data.length).toBe(mesh.vertexCount * VERTEX_STRIDE);
  });
});
