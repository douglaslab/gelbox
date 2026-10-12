import { describe, it, expect } from 'vitest';
import { srgbToLinear, hexToLinearRgb } from '../../src/lib/layout/color';

describe('srgbToLinear', () => {
  it('round-trips 0 and 1', () => {
    expect(srgbToLinear(0)).toBeCloseTo(0, 6);
    expect(srgbToLinear(1)).toBeCloseTo(1, 6);
  });
  it('0.5 sRGB ≈ 0.214 linear', () => {
    expect(srgbToLinear(0.5)).toBeCloseTo(0.21404, 4);
  });
});

describe('hexToLinearRgb', () => {
  it('#000000 → [0,0,0]', () => {
    expect(hexToLinearRgb('#000000')).toEqual([0, 0, 0]);
  });
  it('#FFFFFF → [1,1,1]', () => {
    const rgb = hexToLinearRgb('#FFFFFF');
    expect(rgb[0]).toBeCloseTo(1, 6);
    expect(rgb[1]).toBeCloseTo(1, 6);
    expect(rgb[2]).toBeCloseTo(1, 6);
  });
  it('tolerates a missing leading #', () => {
    expect(hexToLinearRgb('000000')).toEqual([0, 0, 0]);
  });
  it('converts each channel through srgbToLinear', () => {
    // #808080 → 0.5020 sRGB → ~0.2159 linear per channel
    const rgb = hexToLinearRgb('#808080');
    expect(rgb[0]).toBeCloseTo(srgbToLinear(0x80 / 255), 6);
    expect(rgb[0]).toEqual(rgb[1]);
    expect(rgb[1]).toEqual(rgb[2]);
  });
});
