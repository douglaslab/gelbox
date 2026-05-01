/**
 * 12 fragment colors arranged 4 cols × 3 rows.
 * Source: ~/code/gelbox/src/FragmentView.cpp:25 — `getColorPalette()`.
 */
export const FRAGMENT_PALETTE_HEX = [
  '#0066cc', '#cc0000', '#f74308', '#f7931e',
  '#aaaa00', '#57bb00', '#007200', '#03b6a2',
  '#1700de', '#7300de', '#b8056c', '#333333',
] as const;

export function srgbHexToLinearRgb(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export const FRAGMENT_PALETTE_LINEAR_RGB: readonly [number, number, number][] =
  FRAGMENT_PALETTE_HEX.map(srgbHexToLinearRgb);
