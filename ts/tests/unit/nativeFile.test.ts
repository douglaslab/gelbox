import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { deserializeFile } from '../../src/lib/gel/serialize';
const sampleFile = (Sample: unknown) => JSON.stringify({ Gelbox: { version: '1.0', type: 'sample' }, Sample });
describe('native JSON import', () => {
  it('loads the native export preserving lane order, scientific values and metadata', () => {
    const r = deserializeFile(readFileSync('../reference/native/files/ladder-after-selection.gel.json', 'utf8'));
    if (r.kind !== 'state') throw Error('expected gel');
    expect(r.numLanes).toBe(7);
    expect(r.samples.slice(1)).toEqual([null,null,null,null,null,null]);
    expect(r.samples[0]).toMatchObject({ name: '1kb ladder', icon: 'microtube1500ul.png', iconScale: 0.5, id: -1 });
    expect(r.samples[0]?.fragments).toHaveLength(11);
    expect(r.samples[0]?.fragments[0]).toMatchObject({ bases: 10002, mass: 42, aggregate: [1], dye: -1 });
    expect(r.ctx).toMatchObject({ time: 1, voltage: 70, wellDamage: 0, gelBuffer: { tris: 44.5, borate: 44.5, acetate: 0, edta: 1 } });
    expect(r.ctx.ySpaceScale).toBeCloseTo(468.857142857);
  });
  it('uses native constructor defaults and ignores runtime pointer fields', () => {
    expect(deserializeFile(sampleFile({ Fragments: [{ OriginSample: '0x123', OriginSampleFrag: 2 }] }))).toEqual({ kind: 'sample', sample: {
      name: '', icon: '', iconScale: 1, id: -1, buffer: { tris: 44.5, borate: 44.5, acetate: 0, edta: 1 },
      fragments: [{ bases: 0, mass: 0, degrade: 0, dye: -1, aspectRatio: 1, color: [0.5,0.5,0.5], aggregate: [] }],
    } });
  });
  it('maps dyes and aggregates while distinguishing absent and empty buffers', () => {
    const r = deserializeFile(sampleFile({ Buffer: {}, Fragments: [{ Dye: 'Orange G', Mass: 12, Aggregate: [0,2,1], Color: [0.1,0.2,0.3] }, { Dye: 'unknown' }] }));
    if (r.kind !== 'sample') throw Error('expected sample');
    expect(r.sample.buffer).toEqual({ tris: 0, borate: 0, acetate: 0, edta: 0 });
    expect(r.sample.fragments[0]).toMatchObject({ dye: 3, mass: 12, aggregate: [0,2,1], color: [0.1,0.2,0.3] });
    expect(r.sample.fragments[1].dye).toBe(-1);
  });
  it('pads short gels without shifting samples', () => {
    const r = deserializeFile(JSON.stringify({ Gelbox: { version: '1.0', type: 'gel' }, Gel: { Samples: [null, { name: 'second' }] } }));
    if (r.kind !== 'state') throw Error('expected gel');
    expect(r.numLanes).toBe(7); expect(r.samples).toHaveLength(7); expect(r.samples[0]).toBeNull();
    expect(r.samples[1]).toMatchObject({ name: 'second' });
    expect(r.ctx).toMatchObject({ time: 1, voltage: 0, wellDamage: 0 });
  });
  it.each([{ Fragments: 'bad' }, { Fragments: [null] }, { Fragments: [{ Mass: '12' }] }, { Fragments: [{ Color: [1,2] }] }, { Fragments: [{ Aggregate: [null] }] }, { Buffer: null }, { Buffer: { Tris: 'x' } }, { iconScale: 'large' }])('rejects malformed nested data %j', value => {
    expect(() => deserializeFile(sampleFile(value))).toThrow(/Invalid native/);
  });
});
