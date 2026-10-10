export interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Band {
  rect: Rect;
  smearAbove: number;                     // gel-space pixels
  smearBelow: number;
  smearBrightnessAbove: [number, number]; // [near, far] in 0..1
  smearBrightnessBelow: [number, number];
  flameHeight: number;                    // gel-space pixels above the band top
  smileHeight: number;                    // signed gel-space pixels (negative voltage reverses curvature)
  smileExp: number;                       // smile curve exponent
  blur: number;                           // distance in gel-space pixels (integer)
  brightness: number;                     // 0..1 — modulates the body alpha
  color: [number, number, number];        // linear RGB 0..1 — applied at composite
  randSeed: number;                       // flames RNG seed
  wellDamage: number;                     // 0..1
  wellDamageRandSeed: number;
  // --- M26a: source metadata for loupe synthetic-sample extraction. The
  // renderer ignores these; makeSampleFromGel reads them.
  mass:      number;   // ng — fragment mass that produced this band (already aggregate-scaled)
  aggregate: number;   // 1-based multimer tier this band represents (1 = monomer/dye)
  degrade:   number;   // 0..2 — source fragment's degrade
}

export function rectWidth(r: Rect):  number { return r.x2 - r.x1; }
export function rectHeight(r: Rect): number { return r.y2 - r.y1; }
