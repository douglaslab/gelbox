/** Native Surface row order and OpenGL UV displacement. WebGPU converts at
 * the warp shader boundary; consumers must not flip individual CPU fields. */
export interface WarpTextureCpu {
  data:   Uint8Array;
  width:  number;
  height: number;       // always 1 for smile/welldamage; reserved for 2D in M3+
  scale:  [number, number];  // UV-space scale to pass into shader
}

/** GelRender::setup converts float32 output dimensions to integer by truncation. */
export function nativeOutputExtent(logical: number, pixelsPerUnit: number): number {
  return Math.trunc(Math.fround(Math.fround(logical) * Math.fround(pixelsPerUnit)));
}

/** Cinder lmap<float>, followed by native uint8_t conversion (not rounding). */
export function nativeWarpByte(value: number): number {
  const f = Math.fround;
  const clamped = Math.max(-1, Math.min(1, value));
  return Math.trunc(f(f(255 * f(clamped + 1)) / 2));
}
