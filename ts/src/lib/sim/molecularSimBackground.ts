import { DYE_COLORS, DYE_MAX_MASS } from './dye';

// molecularSimBkgndColor from layout.ts (#F1F1F2), in sRGB-byte/255 domain.
const BKGND: readonly [number, number, number] = [0xF1 / 255, 0xF1 / 255, 0xF2 / 255];
const HIGHLIGHT_SCALE = [1.0, 0.97, 0.9] as const;

/**
 * Port of MolecularSim::drawBackground. `highlight`: 0 idle, 1 hover, 2 down.
 * `dyeMasses` is the 4 dye masses (ng) for the sample. Returns an sRGB-domain
 * [r,g,b] in 0..1 — the same domain C++ Cinder Color math works in.
 * Pass these raw values to the unorm framebuffer clear (no extra conversion).
 */
export function computeBackgroundColor(
  dyeMasses: readonly number[],
  highlight: 0 | 1 | 2,
): [number, number, number] {
  const f = Math.fround;
  const s = f(HIGHLIGHT_SCALE[highlight]);
  let r = f(f(BKGND[0]) * s);
  let g = f(f(BKGND[1]) * s);
  let b = f(f(BKGND[2]) * s);
  let w = 1;
  for (let i = 0; i < DYE_COLORS.length; i++) {
    // The slider limit is a normalization factor, not an import clamp.
    // Native Sample::getDyes can exceed it, including through duplicate dyes.
    const norm = f(f(dyeMasses[i] ?? 0) / DYE_MAX_MASS);
    r = f(r + f(f(DYE_COLORS[i][0]) * norm));
    g = f(g + f(f(DYE_COLORS[i][1]) * norm));
    b = f(b + f(f(DYE_COLORS[i][2]) * norm));
    w = f(w + norm);
  }
  return [f(r / w), f(g / w), f(b / w)];
}
