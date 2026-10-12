import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveAssetUrl, loadImage } from '../../src/lib/layout/assets';

describe('resolveAssetUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('keeps a missing Retina variant fallback under the deployment base',async()=>{
    vi.stubEnv('BASE_URL','/gelbox/');vi.stubGlobal('window',{devicePixelRatio:2});
    const requests:string[]=[];
    vi.stubGlobal('Image',class {
      onload?:()=>void;onerror?:()=>void;
      set src(url:string){requests.push(url);queueMicrotask(()=>url.includes('@2x')?this.onerror?.():this.onload?.());}
    });
    await loadImage('/assets/help.png');
    expect(requests).toEqual(['/gelbox/assets/help@2x.png','/gelbox/assets/help.png']);
  });

  it('resolves native assets under an explicit deployment base',()=>{
    vi.stubEnv('BASE_URL','/gelbox/');vi.stubGlobal('window',{devicePixelRatio:2});
    expect(resolveAssetUrl('/assets/help.png')).toBe('/gelbox/assets/help@2x.png');
    expect(resolveAssetUrl('/assets/help.svg')).toBe('/gelbox/assets/help.svg');
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
