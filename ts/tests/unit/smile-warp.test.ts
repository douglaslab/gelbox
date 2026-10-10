import { describe, it, expect } from 'vitest';
import { buildSmileWarp } from '../../src/lib/gel/smile';

describe('buildSmileWarp', () => {
  it('returns null when smileHeight is 0', () => {
    const out = buildSmileWarp({
      x1: 0, x2: 100, smileHeight: 0, smileExp: 1,
    }, { width: 100, height: 100 });
    expect(out).toBeNull();
  });

  it('produces a 1×width RGBA8 buffer with native edges at -1 dy (encoded 0)', () => {
    const out = buildSmileWarp({
      x1: 0, x2: 100, smileHeight: 1, smileExp: 1,
    }, { width: 100, height: 100 });
    expect(out).not.toBeNull();
    expect(out!.width).toBe(100);
    expect(out!.data.byteLength).toBe(100 * 4);
    // Edge pixel (i=0): bx=1 → -bx=-1 → g=0 in native control coordinates
    expect(out!.data[1]).toBe(0);
    // R channel (dx=0) is truncated to 127
    expect(out!.data[0]).toBe(127);
    // Mid pixel (i=49 or 50): bx≈0 → -bx≈0 → g≈128
    expect(out!.data[50 * 4 + 1]).toBeGreaterThan(120);
    expect(out!.data[50 * 4 + 1]).toBeLessThan(135);
  });
});
