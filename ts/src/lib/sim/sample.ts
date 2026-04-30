import type { Buffer } from './buffer';
import type { Aggregate } from './aggregate';

// Port of ~/code/gelbox/include/Sample.h.
// Plain data — no class methods, no parentage tracking (mOriginSample/Frag dropped),
// no UI fields (icon, name) live in the sim layer. Higher layers can extend with
// their own metadata if they need to round-trip.

export interface Fragment {
  bases:       number;             // base count, 100..14000 typical
  mass:        number;             // ng, 0..175
  degrade:     number;             // 0..2
  dye:         number;             // -1 = not a dye; 0..3 = dye index
  aggregate:   Aggregate;          // weight array, [] = monomer-only
  aspectRatio: number;             // 1..16
  color:       [number, number, number];  // linear RGB 0..1; used as Band.focusColor (not currently rendered)
}

export interface Sample {
  fragments: Fragment[];
  buffer:    Buffer;               // the sample's own buffer (may differ from gel buffer)
}

export function isDyeFragment(f: Fragment): boolean {
  return f.dye !== -1;
}
