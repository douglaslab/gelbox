import type { Sample } from '../sim/sample';

/** Runtime identity is deliberately separate from serialized Sample.id. Weak
 * keys do not keep discarded documents or historical immutable versions alive. */
const identities = new WeakMap<Sample, object>();
function identity(sample: Sample): object {
  let token = identities.get(sample);
  if (!token) { token = {}; identities.set(sample, token); }
  return token;
}

export function sameSample(a: Sample | null | undefined, b: Sample | null | undefined): boolean {
  return !!a && !!b && (a === b || identity(a) === identity(b));
}

/** An immutable data edit of the same native Sample object. Clones must use
 * ordinary copying instead, obtaining a new runtime identity. */
export function reviseSample(sample: Sample, changes: Partial<Sample>): Sample {
  const next = { ...sample, ...changes };
  identities.set(next, identity(sample));
  return next;
}

/** Native SampleRef plus raw fragment index. Retains off-document samples.
 * null index is native -1; invalid numeric indices are retained, not repaired. */
export interface SampleFragRef {
  sample: Sample;
  fragmentIndex: number | null;
}

export function sampleFragRefEq(a: SampleFragRef | null, b: SampleFragRef | null): boolean {
  if (!a || !b) return a === b;
  return sameSample(a.sample, b.sample) && a.fragmentIndex === b.fragmentIndex;
}

export function fragmentIndexIn(ref: SampleFragRef | null, sample: Sample | null | undefined): number | null {
  return ref && sameSample(ref.sample, sample) && ref.fragmentIndex !== null &&
    !!sample?.fragments[ref.fragmentIndex] ? ref.fragmentIndex : null;
}

export function refreshSampleRef(ref: SampleFragRef | null, samples: readonly (Sample | null)[]): SampleFragRef | null {
  if (!ref) return null;
  const sample = samples.find(s => sameSample(s, ref.sample));
  return sample && sample !== ref.sample ? { ...ref, sample } : ref;
}

/** Native copy/import creates a new Sample object, independent of serialized ID. */
export function copySample(sample: Sample): Sample {
  return { ...sample, buffer: { ...sample.buffer }, fragments: sample.fragments.map(f =>
    ({ ...f, color: [...f.color], aggregate: [...f.aggregate] })) };
}
