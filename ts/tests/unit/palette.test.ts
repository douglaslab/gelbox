import { describe, expect, it } from 'vitest';
import { FRAGMENT_PALETTE_HEX, FRAGMENT_PALETTE_LINEAR_RGB, srgbHexToLinearRgb } from '../../src/lib/fragment/palette';

describe('FRAGMENT_PALETTE_HEX', () => {
  it('contains 12 hex colors matching FragmentView.cpp:25', () => {
    expect(FRAGMENT_PALETTE_HEX).toEqual([
      '#0066cc', '#cc0000', '#f74308', '#f7931e',
      '#aaaa00', '#57bb00', '#007200', '#03b6a2',
      '#1700de', '#7300de', '#b8056c', '#333333',
    ]);
  });
});

describe('srgbHexToLinearRgb', () => {
  it('returns [0,0,0] for #000000', () => {
    const rgb = srgbHexToLinearRgb('#000000');
    expect(rgb[0]).toBeCloseTo(0, 6);
    expect(rgb[1]).toBeCloseTo(0, 6);
    expect(rgb[2]).toBeCloseTo(0, 6);
  });

  it('returns [1,1,1] for #FFFFFF', () => {
    const rgb = srgbHexToLinearRgb('#FFFFFF');
    expect(rgb[0]).toBeCloseTo(1, 6);
    expect(rgb[1]).toBeCloseTo(1, 6);
    expect(rgb[2]).toBeCloseTo(1, 6);
  });

  it('approximates linear-RGB for mid-grey #808080 (~0.216)', () => {
    const rgb = srgbHexToLinearRgb('#808080');
    expect(rgb[0]).toBeCloseTo(0.215, 2);
  });
});

describe('FRAGMENT_PALETTE_LINEAR_RGB', () => {
  it('has the same length as the hex palette', () => {
    expect(FRAGMENT_PALETTE_LINEAR_RGB.length).toBe(FRAGMENT_PALETTE_HEX.length);
  });

  it('all triples are 3-tuples in 0..1', () => {
    for (const rgb of FRAGMENT_PALETTE_LINEAR_RGB) {
      expect(rgb).toHaveLength(3);
      for (const c of rgb) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    }
  });
});
