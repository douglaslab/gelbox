import { srgbToLinear } from '../sim/molecularSimBackground';

/** Parse "#RRGGBB" → linear-RGB triple (0..1) for GPU vertex colors. */
export function hexToLinearRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}
