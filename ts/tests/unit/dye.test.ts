import { describe, it, expect } from 'vitest';
import { DYE_NAMES, DYE_COLORS, DYE_BP_LO, DYE_BP_HI, DYE_MAX_MASS, DYE_COUNT, isValidDye } from '../../src/lib/sim/dye';

describe('Dye constants', () => {
  it('has 4 dyes', () => {
    expect(DYE_COUNT).toBe(4);
    expect(DYE_NAMES.length).toBe(4);
    expect(DYE_COLORS.length).toBe(4);
    expect(DYE_BP_LO.length).toBe(4);
    expect(DYE_BP_HI.length).toBe(4);
  });
  it('Xylene cyanol (idx 0): #00AFE2, BP 6000-7000', () => {
    expect(DYE_NAMES[0]).toBe('Xylene cyanol');
    expect(DYE_BP_LO[0]).toBe(6000);
    expect(DYE_BP_HI[0]).toBe(7000);
    expect(DYE_COLORS[0]).toEqual([0x00 / 255, 0xAF / 255, 0xE2 / 255]);
  });
  it('Cresol red (idx 1): #985D93, BP 700-900', () => {
    expect(DYE_NAMES[1]).toBe('Cresol red');
    expect(DYE_BP_LO[1]).toBe(700);
    expect(DYE_BP_HI[1]).toBe(900);
  });
  it('Bromphenol blue (idx 2): #B3A7D3, BP 300-500', () => {
    expect(DYE_NAMES[2]).toBe('Bromphenol blue');
    expect(DYE_BP_LO[2]).toBe(300);
    expect(DYE_BP_HI[2]).toBe(500);
  });
  it('Orange G (idx 3): #FACB01, BP 50-100', () => {
    expect(DYE_NAMES[3]).toBe('Orange G');
    expect(DYE_BP_LO[3]).toBe(50);
    expect(DYE_BP_HI[3]).toBe(100);
  });
  it('max mass is 125', () => {
    expect(DYE_MAX_MASS).toBe(125);
  });
  it('isValidDye accepts 0..3, rejects -1 and 4', () => {
    expect(isValidDye(-1)).toBe(false);
    expect(isValidDye(0)).toBe(true);
    expect(isValidDye(3)).toBe(true);
    expect(isValidDye(4)).toBe(false);
  });
});
