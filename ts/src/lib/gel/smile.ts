import { nativeOutputExtent, nativeWarpByte, type WarpTextureCpu } from './warpTexture';

export interface SmileParams {
  x1: number;          // band rect x1 in gel-space
  x2: number;          // band rect x2 in gel-space
  smileHeight: number; // gel-space pixels (peel-back peak)
  smileExp:    number;
}

export function buildSmileWarp(
  p: SmileParams,
  gel: { width: number; height: number },
  pixelsPerUnit = 1
): WarpTextureCpu | null {
  if (Math.fround(p.smileHeight) === 0) return null;

  const f = Math.fround;
  const w = nativeOutputExtent(gel.width, pixelsPerUnit);
  const data = new Uint8Array(w * 4);
  const x1n = f(f(p.x1) / gel.width);
  const x2n = f(f(p.x2) / gel.width);
  const span = f(x2n - x1n);
  const denom = f(1 / w);

  for (let i = 0; i < w; i++) {
    const px = f(i * denom);  // native multiplies by a stored float reciprocal
    let bx = f(f(px - x1n) / span);
    bx = f(2 * Math.abs(f(0.5 - bx)));
    bx = f(Math.pow(bx, f(p.smileExp)));
    let dx = 0;
    // Native GelRender::smileBand encodes -bx in OpenGL UV coordinates.
    // WebGPU adapts this shared control field at the shader boundary.
    let dy = -bx;
    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));
    // Encode: r = lmap(dx, -1..1, 0..255), g = lmap(dy, -1..1, 0..255)
    data[i * 4 + 0] = nativeWarpByte(dx);
    data[i * 4 + 1] = nativeWarpByte(dy);
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 255;
  }

  return {
    data, width: w, height: 1,
    // C++: warp scale = vec2(height) / gelSize
    scale: [f(f(p.smileHeight) / gel.width), f(f(p.smileHeight) / gel.height)],
  };
}
