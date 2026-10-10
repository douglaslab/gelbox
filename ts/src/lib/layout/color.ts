// Shared color conversions. Canonical home for sRGB↔linear helpers so the
// engine, layout, palette, and GPU consumers don't each carry their own copy.

/** sRGB component (0..1) → linear (0..1). Standard piecewise sRGB EOTF. */
export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Native display-domain UNORM bytes; no implicit sRGB decoding. */
export function hexToUnormRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r,g,b];
}

/** Parse "#RRGGBB" → linear-RGB triple (0..1) for linear-light consumers. */
export function hexToLinearRgb(hex: string): [number, number, number] {
  const [r,g,b]=hexToUnormRgb(hex);
  return [srgbToLinear(r),srgbToLinear(g),srgbToLinear(b)];
}
