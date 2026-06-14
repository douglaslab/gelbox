import { DYE_COLORS, DYE_MAX_MASS } from './dye';

// molecularSimBkgndColor from layout.ts (#F1F1F2), in sRGB-byte/255 domain.
const BKGND: readonly [number, number, number] = [0xF1 / 255, 0xF1 / 255, 0xF2 / 255];
const HIGHLIGHT_SCALE = [1.0, 0.97, 0.9] as const;

/**
 * Port of MolecularSim::drawBackground. `highlight`: 0 idle, 1 hover, 2 down.
 * `dyeMasses` is the 4 dye masses (ng) for the sample. Returns an sRGB-domain
 * [r,g,b] in 0..1 — the same domain C++ Cinder Color math works in. Convert
 * with srgbToLinear before uploading to the sRGB render target.
 */
export function computeBackgroundColor(
  dyeMasses: readonly number[],
  highlight: 0 | 1 | 2,
): [number, number, number] {
  const s = HIGHLIGHT_SCALE[highlight];
  let r = BKGND[0] * s;
  let g = BKGND[1] * s;
  let b = BKGND[2] * s;
  let w = 1;
  for (let i = 0; i < DYE_COLORS.length; i++) {
    // DYE_MAX_MASS (125 ng) = C++ GelSim::kTuning.mSliderDyeMassMax (= Dye::kMaxMass).
    // C++ drawBackground doesn't clamp norm; we clamp defensively. The dye-mass
    // slider caps at DYE_MAX_MASS, so in practice norm never exceeds 1 and this
    // stays faithful to the C++ result.
    const norm = Math.max(0, Math.min(1, (dyeMasses[i] ?? 0) / DYE_MAX_MASS));
    if (norm <= 0) continue;
    r += DYE_COLORS[i][0] * norm;
    g += DYE_COLORS[i][1] * norm;
    b += DYE_COLORS[i][2] * norm;
    w += norm;
  }
  return [r / w, g / w, b / w];
}

/** sRGB component (0..1) → linear (0..1). Inverse of molecularSim's toByte. */
export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
