import { describe, expect, it } from 'vitest';
import { FRAGMENT_PALETTE_HEX, FRAGMENT_PALETTE_RGB, hexToRgb, nearestPaletteIndex } from '../../src/lib/fragment/palette';

describe('FRAGMENT_PALETTE_HEX', () => {
  it('contains 12 hex colors matching FragmentView.cpp:25', () => {
    expect(FRAGMENT_PALETTE_HEX).toEqual([
      '#0066cc', '#cc0000', '#f74308', '#f7931e',
      '#aaaa00', '#57bb00', '#007200', '#03b6a2',
      '#1700de', '#7300de', '#b8056c', '#333333',
    ]);
  });
});

describe('hexToRgb', () => {
  it('returns [0,0,0] for #000000', () => {
    const rgb = hexToRgb('#000000');
    expect(rgb[0]).toBeCloseTo(0, 6);
    expect(rgb[1]).toBeCloseTo(0, 6);
    expect(rgb[2]).toBeCloseTo(0, 6);
  });

  it('returns [1,1,1] for #FFFFFF', () => {
    const rgb = hexToRgb('#FFFFFF');
    expect(rgb[0]).toBeCloseTo(1, 6);
    expect(rgb[1]).toBeCloseTo(1, 6);
    expect(rgb[2]).toBeCloseTo(1, 6);
  });

  it('preserves native channel values for mid-grey #808080', () => {
    const rgb = hexToRgb('#808080');
    expect(rgb[0]).toBeCloseTo(128 / 255, 6);
  });
});

describe('FRAGMENT_PALETTE_RGB', () => {
  it('has the same length as the hex palette', () => {
    expect(FRAGMENT_PALETTE_RGB.length).toBe(FRAGMENT_PALETTE_HEX.length);
  });

  it('all triples are 3-tuples in 0..1', () => {
    for (const rgb of FRAGMENT_PALETTE_RGB) {
      expect(rgb).toHaveLength(3);
      for (const c of rgb) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    }
  });
});


describe('native nearest palette selection', () => {
  it('marks the closest swatch for an imported custom color without changing it', () => {
    const custom: [number,number,number] = [.25,.5,.75];
    expect(nearestPaletteIndex(custom)).toBe(0);
    expect(custom).toEqual([.25,.5,.75]);
    for (let i=0;i<FRAGMENT_PALETTE_RGB.length;i++) expect(nearestPaletteIndex(FRAGMENT_PALETTE_RGB[i])).toBe(i);
  });
  it('keeps the first swatch when native float distances tie', () => {
    expect(nearestPaletteIndex([.5,0,0],[[0,0,0],[1,0,0]])).toBe(0);
    expect(nearestPaletteIndex([.75,0,0],[[0,0,0],[1,0,0]])).toBe(1);
  });
});
