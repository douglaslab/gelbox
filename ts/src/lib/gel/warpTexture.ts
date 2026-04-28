export interface WarpTextureCpu {
  data:   Uint8Array;
  width:  number;
  height: number;       // always 1 for smile/welldamage; reserved for 2D in M3+
  scale:  [number, number];  // UV-space scale to pass into shader
}
