import type { WarpTextureCpu } from './warpTexture';

export interface SmileParams {
  x1: number;          // band rect x1 in gel-space
  x2: number;          // band rect x2 in gel-space
  smileHeight: number; // gel-space pixels (peel-back peak)
  smileExp:    number;
}

export function buildSmileWarp(
  p: SmileParams,
  gel: { width: number; height: number }
): WarpTextureCpu | null {
  if (p.smileHeight === 0) return null;

  const w = gel.width;
  const data = new Uint8Array(w * 4);
  const x1n = p.x1 / gel.width;
  const x2n = p.x2 / gel.width;
  const span = x2n - x1n;

  for (let i = 0; i < w; i++) {
    const px = i / w;  // matches C++ pos = vec2(iter.getPos()) / warpSize
    let bx = (px - x1n) / span;
    bx = 2 * Math.abs(0.5 - bx);
    bx = Math.pow(bx, p.smileExp);
    let dx = 0;
    // C++ Cinder uses Y-up FBOs (`d.y = -bx`); our WebGPU output texture and
    // the WebGL2 warp pass (with the M4 V-flip) both put gel.y=0 at the top
    // (Y-down). The same numeric `dy` therefore inverts the visual direction
    // of the curl, turning a smile into a frown. Match the C++ visual by
    // negating: at edges, dy=+bx pushes the output's edge band toward the
    // well (lower screen-y), producing a smile.
    let dy = bx;
    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));
    // Encode: r = lmap(dx, -1..1, 0..255), g = lmap(dy, -1..1, 0..255)
    data[i * 4 + 0] = Math.round(((dx + 1) * 0.5) * 255);
    data[i * 4 + 1] = Math.round(((dy + 1) * 0.5) * 255);
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 255;
  }

  return {
    data, width: w, height: 1,
    // C++: warp scale = vec2(height) / gelSize
    scale: [p.smileHeight / gel.width, p.smileHeight / gel.height],
  };
}
