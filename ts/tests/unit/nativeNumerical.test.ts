import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { fragToBands } from '../../src/lib/sim/gelSim';
const cases = JSON.parse(readFileSync('../reference/native/numerical/cases.json', 'utf8'));
const outputs = JSON.parse(readFileSync('../reference/native/numerical/outputs.json', 'utf8'));
const exact = new Set(['blur', 'randSeed', 'wellDamageRandSeed', 'aggregate']);
function compare(actual: any, expected: any, path: string, spatialTolerance: number) {
  if (typeof expected === 'number') {
    if (typeof actual !== 'number' || !Number.isFinite(actual)) throw Error(`Invalid numeric output: ${path}`);
    const field = path.split('.').at(-1)!;
    if (exact.has(field) && !Number.isInteger(actual)) throw Error(`Non-integer output: ${path}`);
    if (field === 'randSeed' || field === 'wellDamageRandSeed') expect.soft(actual | 0, path).toBe(expected | 0);
    else if (exact.has(field)) expect.soft(actual, path).toBe(expected);
    else expect.soft(Math.abs(actual - expected), `${path}: web ${actual}, native ${expected}`)
      .toBeLessThanOrEqual(path.includes('.rect.') || ['smearAbove','smearBelow','flameHeight','smileHeight'].includes(field)
        ? spatialTolerance : Math.max(2e-6, Math.abs(expected) * 2e-6));
  } else if (Array.isArray(expected)) {
    expect(actual, path).toHaveLength(expected.length);
    expected.forEach((v, i) => compare(actual[i], v, `${path}.${i}`, spatialTolerance));
  } else {
    for (const [k, v] of Object.entries(expected)) compare(actual[k], v, `${path}.${k}`, spatialTolerance);
  }
}
it.each(cases.map((c: any, i: number) => [c.id, c, outputs[i]]))('native C++ bands: %s', (_id, c, reference) => {
  expect(reference.id).toBe(c.id);
  // Native float32 subtracts translated rectangle endpoints before multiplying H2O height by 6.
  // Bound that cancellation by 12 float32 relative epsilons at the coordinate scale.
  const scale = Math.max(1, ...reference.bands.flatMap((b: any) => Object.values(b.rect).map(v => Math.abs(v as number))));
  compare(fragToBands(c.sample, c.fragment, c.wellRect, c.lane, c.ctx), reference.bands, c.id,
    Math.max(3e-4, 12 * 2 ** -23 * scale));
});
it.each([undefined, null, NaN, .5])('does not coerce invalid seed %s into a matching zero', seed => {
  expect(() => compare({ randSeed: seed }, { randSeed: 0 }, 'guard', .001)).toThrow();
});
it('has one unique native output per case', () => {
  expect(outputs).toHaveLength(cases.length);
  expect(new Set(outputs.map((o: any) => o.id)).size).toBe(cases.length);
});
