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
      fragments: [{ bases: 0, mass: 0, degrade: 0, dye: -1, aspectRatio: 1, color: [0.5,0.5,0.5], aggregate: [1] }],
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


it('distinguishes null-like lane objects from populated empty samples', () => {
  const r = deserializeFile(JSON.stringify({ Gelbox: { version: '1.0', type: 'gel' }, Gel: { Samples: [{}, { Fragments: [] }] } }));
  if (r.kind !== 'state') throw Error('expected gel');
  expect(r.samples[0]).toBeNull();
  expect(r.samples[1]?.fragments).toEqual([]);
});
it('preserves explicitly empty aggregate instead of applying monomer default', () => {
  const r = deserializeFile(sampleFile({ Fragments: [{ Aggregate: [] }] }));
  if (r.kind !== 'sample') throw Error('expected sample');
  expect(r.sample.fragments[0].aggregate).toEqual([]);
});
it.each([1000.5, 2147483648, -2147483649])('rejects non-native integer fields %s', value => {
  expect(() => deserializeFile(sampleFile({ id: value }))).toThrow(/Invalid native/);
  expect(() => deserializeFile(sampleFile({ Fragments: [{ Bases: value }] }))).toThrow(/Invalid native/);
});

it('imports a native-writer empty sample whose Fragments collection is null', () => {
  const r = deserializeFile(readFileSync('../reference/native/files/interop/empty-native.json', 'utf8'));
  expect(r).toEqual({ kind: 'sample', sample: {
    name: 'Empty sample', icon: 'microtube1500ul.png', iconScale: .5, id: -1,
    buffer: { tris: 0, borate: 0, acetate: 0, edta: 0 }, fragments: [],
  } });
});
it('treats a native null Aggregate as an empty collection, not a missing default', () => {
  const r = deserializeFile(sampleFile({ Fragments: [{ Aggregate: null }] }));
  if (r.kind !== 'sample') throw Error('expected sample');
  expect(r.sample.fragments[0].aggregate).toEqual([]);
});
it.each([{}, { Samples: null }])('loads native gels without sample children: %j', Gel => {
  const r = deserializeFile(JSON.stringify({ Gelbox: { version: '1.0', type: 'gel' }, Gel }));
  if (r.kind !== 'state') throw Error('expected gel');
  expect(r.numLanes).toBe(7);
  expect(r.samples).toEqual(Array(7).fill(null));
  expect(r.ctx).toMatchObject({ time: 1, voltage: 0, wellDamage: 0 });
});

it('recovers the original release writer object form in native child order', () => {
  const text = readFileSync('../reference/native/files/interop/gel/release/reread.json', 'utf8');
  const doc = JSON.parse(text);
  for (const Samples of [doc.Gel.Samples, { Sample: doc.Gel.Samples.Sample, '': null }]) {
    const r = deserializeFile(JSON.stringify({ ...doc, Gel: { ...doc.Gel, Samples } }));
    if (r.kind !== 'state') throw Error('expected gel');
    expect(r.numLanes).toBe(7);
    expect(r.samples.map(s => s?.name ?? null)).toEqual([null, 'Last lane', null, null, null, null, null]);
    expect(r.samples[1]?.id).toBe(17);
    expect(r.samples[1]?.fragments).toHaveLength(6);
    expect(r.ctx).toMatchObject({ time: .625, voltage: 83.5, wellDamage: .125 });
  }
});
it('loads the native object form with no empty lane key', () => {
  const r = deserializeFile(JSON.stringify({ Gelbox: { version: '1.0', type: 'gel' }, Gel: { Samples: { Sample: { name: 'Only surviving sample' } } } }));
  if (r.kind !== 'state') throw Error('expected gel');
  expect(r.samples.map(s => s?.name ?? null)).toEqual(['Only surviving sample', null, null, null, null, null, null]);
});
it.each([true, 3, 'bad', { Sample: 4 }])('rejects malformed native lane collections %j', Samples => {
  expect(() => deserializeFile(JSON.stringify({ Gelbox: { version: '1.0', type: 'gel' }, Gel: { Samples } }))).toThrow(/Invalid native/);
});

describe('native case-insensitive JSON field lookup',()=>{
  it.each(['sample-mixed','sample-reversed','gel-mixed'])('matches independent native parsing: %s',name=>{
    const root='../reference/native/files/interop/case-keys/';
    const expected=JSON.parse(readFileSync(root+name+'.native.json','utf8'));
    expected.Gelbox={version:'1.0',type:name.startsWith('sample')?'sample':'gel'};
    expect(deserializeFile(readFileSync(root+name+'.input.json','utf8'))).toEqual(deserializeFile(JSON.stringify(expected)));
  });
  it('rejects malformed values selected through a case alias',()=>{
    expect(()=>deserializeFile(JSON.stringify({gelbox:{VERSION:'1.0',TYPE:'sample'},sample:{NAME:12,name:'valid'}}))).toThrow('Sample.name');
  });
});
