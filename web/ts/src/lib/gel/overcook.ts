import { nativeOutputExtent, nativeWarpByte, type WarpTextureCpu } from './warpTexture';
import type { GlobalWarp } from '../sim/globalWarp';
import { GEL_RENDER_TUNING } from '../../data/tuning';

export function buildOvercookWarp(
  globalWarp: GlobalWarp,
  gelSize: { width: number; height: number },
  pixelsPerUnit: number
): WarpTextureCpu | null {
  if (!globalWarp.h2oDistort) return null;

  const amount = GEL_RENDER_TUNING.h2oDistort.overcook;
  const scaleP = GEL_RENDER_TUNING.overcook.scale;
  const f = Math.fround;
  const w = nativeOutputExtent(gelSize.width, pixelsPerUnit);
  const h = nativeOutputExtent(gelSize.height, pixelsPerUnit);
  const data = new Uint8Array(w * h * 4);
  const xDenom = f(1 / w), yDenom = f(1 / h);
  // Native multiplies p * frequency as float, promotes at M_PI, then passes
  // the result through sinf's float argument and float return value.
  const sine = (p: number, frequency: number) => f(Math.sin(f(f(p * frequency) * Math.PI * 2)));
  const wave = (p: number, a: number, b: number) =>
    f(f(f(f(a) * sine(p, .5)) + f(f(b) * sine(p, 1))) + f(f(.2) * sine(p, 4)));
  for (let yi = 0; yi < h; yi++) {
    const cx = wave(f(yi * yDenom), .45, .35);
    for (let xi = 0; xi < w; xi++) {
      const cy = wave(f(xi * xDenom), .35, .25);
      let dx = cx;
      let dy = cy;
      if (dx < -1) dx = -1; else if (dx > 1) dx = 1;
      if (dy < -1) dy = -1; else if (dy > 1) dy = 1;
      const o = (yi * w + xi) * 4;
      data[o + 0] = nativeWarpByte(dx);
      data[o + 1] = nativeWarpByte(dy);
      data[o + 2] = 0;
      data[o + 3] = 255;
    }
  }

  return {
    data,
    width:  w,
    height: h,
    scale:  [f(f(f(amount) * f(scaleP[0])) / gelSize.width), f(f(f(amount) * f(scaleP[1])) / gelSize.height)],
  };
}
