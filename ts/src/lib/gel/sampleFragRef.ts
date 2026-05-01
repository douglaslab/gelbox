/**
 * Reference to a sample (by lane index) and optionally a specific fragment within it.
 * Mirrors the C++ `SampleFragRef` (SampleRef + frag index, where -1 meant "sample only").
 *
 * `fragmentIndex === null` means "the sample as a whole is referenced; no specific fragment".
 */
export interface SampleFragRef {
  lane:          number;
  fragmentIndex: number | null;
}

export function sampleFragRefEq(
  a: SampleFragRef | null,
  b: SampleFragRef | null,
): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.lane === b.lane && a.fragmentIndex === b.fragmentIndex;
}
