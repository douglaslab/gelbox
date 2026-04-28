import { describe, it, expect } from 'vitest';
import { buildOvercookWarp } from '../../src/lib/gel/overcook';

describe('buildOvercookWarp', () => {
  it('returns null when h2oDistort is false', () => {
    const out = buildOvercookWarp(
      { h2oDistort: false, randSeed: 0 },
      { width: 320, height: 240 },
      1
    );
    expect(out).toBeNull();
  });

  it('produces an outputW × outputH RGBA8 buffer at pixelsPerUnit=1', () => {
    const out = buildOvercookWarp(
      { h2oDistort: true, randSeed: 0 },
      { width: 320, height: 240 },
      1
    );
    expect(out).not.toBeNull();
    expect(out!.width).toBe(320);
    expect(out!.height).toBe(240);
    expect(out!.data.byteLength).toBe(320 * 240 * 4);
  });

  it('scales texture dimensions by pixelsPerUnit', () => {
    const out = buildOvercookWarp(
      { h2oDistort: true, randSeed: 0 },
      { width: 160, height: 120 },
      2
    )!;
    expect(out.width).toBe(320);
    expect(out.height).toBe(240);
  });

  it('center pixel encodes the "Older" sin-mix (cx=0.45, cy=0.35)', () => {
    // At p = (0.5, 0.5): every sin term has arg = 0.5*nπ where n ∈ {1, 2, 8}.
    //   n=1 → sin(π/2) = 1
    //   n=2 → sin(π)   = 0
    //   n=8 → sin(4π)  = 0
    // cx = 0.45*sin(py*π) + 0.35*sin(py*2π) + 0.20*sin(py*8π) = 0.45*1 + 0 + 0 = 0.45
    // cy = 0.35*sin(px*π) + 0.25*sin(px*2π) + 0.20*sin(px*8π) = 0.35*1 + 0 + 0 = 0.35
    // Encoded: r = round(((0.45+1)*0.5)*255) = round(184.875) = 185
    //          g = round(((0.35+1)*0.5)*255) = round(172.125) = 172
    const out = buildOvercookWarp(
      { h2oDistort: true, randSeed: 0 },
      { width: 320, height: 240 },
      1
    )!;
    const cx = 320 / 2;
    const cy = 240 / 2;
    const idx = (cy * 320 + cx) * 4;
    expect(out.data[idx + 0]).toBeGreaterThanOrEqual(180);
    expect(out.data[idx + 0]).toBeLessThanOrEqual(190);
    expect(out.data[idx + 1]).toBeGreaterThanOrEqual(167);
    expect(out.data[idx + 1]).toBeLessThanOrEqual(177);
    expect(out.data[idx + 2]).toBe(0);
    expect(out.data[idx + 3]).toBe(255);
  });

  it('returns scale = (amount * Overcook.Scale) / gelSize when h2oDistort is true', () => {
    const out = buildOvercookWarp(
      { h2oDistort: true, randSeed: 0 },
      { width: 320, height: 240 },
      1
    )!;
    expect(out.scale[0]).toBeCloseTo(0.0546875, 6);  // 3.5 * 5 / 320
    expect(out.scale[1]).toBeCloseTo(35 / 240, 6);
  });
});
