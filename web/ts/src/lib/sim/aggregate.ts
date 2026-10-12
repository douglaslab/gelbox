// Port of ~/code/gelbox/include/Aggregate.h.
// Aggregate is a 0-indexed weight array; index i = weight of the (i+1)-mer.
// Empty array OR sum == 0 means the fragment is monomer-only at full weight.
// Max multimer index is governed by the slider; no enforcement here.

export type Aggregate = readonly number[];

export function aggregateSum(a: Aggregate): number {
  let s = 0;
  for (const v of a) s += v;
  return s;
}
