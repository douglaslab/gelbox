import { describe, it, expect } from 'vitest';
import { BUFFER_H2O, BUFFER_TBE, BUFFER_TAE, bufferEquals, type Buffer } from '../../src/lib/sim/buffer';

describe('Buffer presets', () => {
  it('H2O is all zeros', () => {
    expect(BUFFER_H2O).toEqual({ tris: 0, borate: 0, acetate: 0, edta: 0 });
  });
  it('0.5x TBE is Tris=44.5, Borate=44.5, EDTA=1, Acetate=0', () => {
    expect(BUFFER_TBE).toEqual({ tris: 44.5, borate: 44.5, acetate: 0, edta: 1 });
  });
  it('1x TAE is Tris=40, Acetate=20, EDTA=1, Borate=0', () => {
    expect(BUFFER_TAE).toEqual({ tris: 40, borate: 0, acetate: 20, edta: 1 });
  });
});

describe('bufferEquals', () => {
  it('matches identical buffers', () => {
    expect(bufferEquals(BUFFER_TAE, BUFFER_TAE)).toBe(true);
    expect(bufferEquals(BUFFER_TAE, { ...BUFFER_TAE })).toBe(true);
  });
  it('differs on any field', () => {
    expect(bufferEquals(BUFFER_TAE, BUFFER_TBE)).toBe(false);
    const altered: Buffer = { ...BUFFER_TAE, tris: 41 };
    expect(bufferEquals(BUFFER_TAE, altered)).toBe(false);
  });
});
