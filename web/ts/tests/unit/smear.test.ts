import { describe, it, expect } from 'vitest';
import { buildSmearMesh } from '../../src/lib/gel/smear';
import type { Band } from '../../src/lib/sim/band';

const baseBand: Band = {
  rect: { x1: 100, y1: 100, x2: 200, y2: 110 },
  smearAbove: 8, smearBelow: 12,
  smearBrightnessAbove: [0.8, 0.0],
  smearBrightnessBelow: [0.6, 0.1],
  flameHeight: 0,
  smileHeight: 0, smileExp: 0,
  blur: 0,
  brightness: 1,
  color: [1, 1, 1],
  randSeed: 0,
  wellDamage: 0, wellDamageRandSeed: 0,
};

describe('buildSmearMesh', () => {
  it('skips smear when thickness is 0', () => {
    const b: Band = { ...baseBand, smearAbove: 0, smearBelow: 0 };
    const mesh = buildSmearMesh(b);
    expect(mesh.vertexCount).toBe(0);
  });

  it('emits 6 verts (2 triangles) per smear when both above and below are set', () => {
    const mesh = buildSmearMesh(baseBand);
    expect(mesh.vertexCount).toBe(12);  // 2 quads × 6 verts
  });

  it('above-smear bottom vertex uses near brightness, top uses far', () => {
    const b: Band = { ...baseBand, smearBelow: 0 };  // only above
    const mesh = buildSmearMesh(b);
    const stride = 6;
    // emitQuad emits 6 verts in order: [LR, UR, UL, UL, LL, LR]
    // For above-smear: bottom (LR/LL) carries cClose=0.8; top (UR/UL) carries cFar=0.0
    expect(mesh.data[stride * 0 + 2]).toBeCloseTo(0.8); // R of v0 (lower-right) — close
    expect(mesh.data[stride * 1 + 2]).toBeCloseTo(0.0); // R of v1 (upper-right) — far
    expect(mesh.data[stride * 2 + 2]).toBeCloseTo(0.0); // R of v2 (upper-left) — far
    expect(mesh.data[stride * 4 + 2]).toBeCloseTo(0.8); // R of v4 (lower-left) — close
  });
});
