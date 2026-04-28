export interface SmileParams {
  x1: number;          // band rect x1 in gel-space
  x2: number;          // band rect x2 in gel-space
  smileHeight: number; // gel-space pixels (peel-back peak)
  smileExp:    number;
}

export interface WarpTextureCpu {
  data:   Uint8Array;
  width:  number;
  height: number;       // always 1 for smile/welldamage
  scale:  [number, number];  // UV-space scale to pass into shader
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
    let dy = -bx;
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
