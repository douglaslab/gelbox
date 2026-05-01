import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveAssetUrl } from '../../src/lib/layout/assets';

describe('resolveAssetUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns @2x url at DPR >= 2', () => {
    vi.stubGlobal('window', { devicePixelRatio: 2 });
    expect(resolveAssetUrl('/assets/slider-icons/voltage-lo.png')).toBe(
      '/assets/slider-icons/voltage-lo@2x.png'
    );
  });

  it('returns 1x url at DPR < 2', () => {
    vi.stubGlobal('window', { devicePixelRatio: 1 });
    expect(resolveAssetUrl('/assets/slider-icons/voltage-lo.png')).toBe(
      '/assets/slider-icons/voltage-lo.png'
    );
  });

  it('returns 1x url when window is undefined (SSR/node)', () => {
    // No stub — window undefined in node
    expect(resolveAssetUrl('/assets/molecules/Tris.png')).toBe(
      '/assets/molecules/Tris.png'
    );
  });

  it('preserves nested directories at @2x', () => {
    vi.stubGlobal('window', { devicePixelRatio: 2 });
    expect(resolveAssetUrl('/assets/molecules/Tris.png')).toBe(
      '/assets/molecules/Tris@2x.png'
    );
  });

  it('returns input unchanged for non-png paths', () => {
    vi.stubGlobal('window', { devicePixelRatio: 2 });
    expect(resolveAssetUrl('/assets/foo.svg')).toBe('/assets/foo.svg');
    expect(resolveAssetUrl('/assets/data.json')).toBe('/assets/data.json');
  });
});
