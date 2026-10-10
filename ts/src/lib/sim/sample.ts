import type { Buffer } from './buffer';
import type { Aggregate } from './aggregate';

// Port of ~/code/gelbox/include/Sample.h.
// Plain scientific data. Runtime identity and synthetic-source references are
// carried separately by sampleFragRef and makeSampleFromGel.
// Native metadata is carried unchanged for file interchange; simulation ignores it.

export interface Fragment {
  bases:       number;             // base count, 100..14000 typical
  mass:        number;             // ng, 0..175
  degrade:     number;             // 0..2
  dye:         number;             // -1 = not a dye; 0..3 = dye index
  aggregate:   Aggregate;          // weight array, [] = monomer-only
  aspectRatio: number;             // 1..16
  color:       [number, number, number];  // native RGB channel values 0..1; serialized without gamma conversion
}

export interface Sample {
  name?: string;
  icon?: string;
  iconScale?: number;
  /** Native file metadata, not an internal object identity. */
  id?: number;
  fragments: Fragment[];
  buffer:    Buffer;               // the sample's own buffer (may differ from gel buffer)
}

export function isDyeFragment(f: Fragment): boolean {
  return f.dye !== -1;
}
