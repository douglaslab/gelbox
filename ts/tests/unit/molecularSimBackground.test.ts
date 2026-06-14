import { describe, it, expect } from 'vitest';
import { computeBackgroundColor, srgbToLinear } from '../../src/lib/sim/molecularSimBackground';

// molecularSimBkgndColor = #F1F1F2 → [0xF1, 0xF1, 0xF2] / 255
const BASE: [number, number, number] = [0xF1 / 255, 0xF1 / 255, 0xF2 / 255];

describe('computeBackgroundColor (sRGB-domain, matches C++ drawBackground)', () => {
  it('idle, no dyes → base color', () => {
    const c = computeBackgroundColor([0, 0, 0, 0], 0);
    expect(c[0]).toBeCloseTo(BASE[0], 5);
    expect(c[1]).toBeCloseTo(BASE[1], 5);
    expect(c[2]).toBeCloseTo(BASE[2], 5);
  });

  it('hover dims by 0.97, mouse-down by 0.9', () => {
    const hover = computeBackgroundColor([0, 0, 0, 0], 1);
    const down  = computeBackgroundColor([0, 0, 0, 0], 2);
    expect(hover[0]).toBeCloseTo(BASE[0] * 0.97, 5);
    expect(down[0]).toBeCloseTo(BASE[0] * 0.9, 5);
  });

  it('one dye at full mass: c = (base + dyeColor) / 2', () => {
    // Xylene cyanol = 0x00AFE2; full mass = DYE_MAX_MASS so norm = 1, w = 2.
    const dye: [number, number, number] = [0x00 / 255, 0xAF / 255, 0xE2 / 255];
    const c = computeBackgroundColor([125, 0, 0, 0], 0);
    expect(c[0]).toBeCloseTo((BASE[0] + dye[0]) / 2, 5);
    expect(c[1]).toBeCloseTo((BASE[1] + dye[1]) / 2, 5);
    expect(c[2]).toBeCloseTo((BASE[2] + dye[2]) / 2, 5);
  });

  it('clamps mass norm at 1 (over-max behaves like max)', () => {
    const atMax  = computeBackgroundColor([125, 0, 0, 0], 0);
    const overMax = computeBackgroundColor([999, 0, 0, 0], 0);
    expect(overMax[0]).toBeCloseTo(atMax[0], 5);
  });
});

describe('srgbToLinear', () => {
  it('round-trips 0 and 1', () => {
    expect(srgbToLinear(0)).toBeCloseTo(0, 6);
    expect(srgbToLinear(1)).toBeCloseTo(1, 6);
  });
  it('0.5 sRGB ≈ 0.214 linear', () => {
    expect(srgbToLinear(0.5)).toBeCloseTo(0.21404, 4);
  });
});
