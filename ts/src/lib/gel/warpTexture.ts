/** Native Surface row order and OpenGL UV displacement. WebGPU converts at
 * the warp shader boundary; consumers must not flip individual CPU fields. */
export interface WarpTextureCpu {
  data:   Uint8Array;
  width:  number;
  height: number;       // always 1 for smile/welldamage; reserved for 2D in M3+
  scale:  [number, number];  // UV-space scale to pass into shader
}
