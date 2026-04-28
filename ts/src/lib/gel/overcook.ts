import type { WarpTextureCpu } from './warpTexture';
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
  const w = Math.round(gelSize.width  * pixelsPerUnit);
  const h = Math.round(gelSize.height * pixelsPerUnit);
  const data = new Uint8Array(w * h * 4);

  // Frequency multipliers (radians). C++ uses (0.5, 1.0, 4.0) * 2π → (π, 2π, 8π).
  const f1 = Math.PI;
  const f2 = 2 * Math.PI;
  const f3 = 8 * Math.PI;

  for (let yi = 0; yi < h; yi++) {
    const py = yi / h;
    const sy1 = Math.sin(py * f1);
    const sy2 = Math.sin(py * f2);
    const sy3 = Math.sin(py * f3);
    const cx = 0.45 * sy1 + 0.35 * sy2 + 0.20 * sy3;
    for (let xi = 0; xi < w; xi++) {
      const px = xi / w;
      const sx1 = Math.sin(px * f1);
      const sx2 = Math.sin(px * f2);
      const sx3 = Math.sin(px * f3);
      const cy = 0.35 * sx1 + 0.25 * sx2 + 0.20 * sx3;
      let dx = cx;
      let dy = cy;
      if (dx < -1) dx = -1; else if (dx > 1) dx = 1;
      if (dy < -1) dy = -1; else if (dy > 1) dy = 1;
      const o = (yi * w + xi) * 4;
      data[o + 0] = Math.round(((dx + 1) * 0.5) * 255);
      data[o + 1] = Math.round(((dy + 1) * 0.5) * 255);
      data[o + 2] = 0;
      data[o + 3] = 255;
    }
  }

  return {
    data,
    width:  w,
    height: h,
    scale:  [(amount * scaleP[0]) / gelSize.width, (amount * scaleP[1]) / gelSize.height],
  };
}
