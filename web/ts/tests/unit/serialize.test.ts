import { describe, it, expect } from 'vitest';
import { serializeSample, serializeGelState, deserializeFile } from '../../src/lib/gel/serialize';
import { BUFFER_TBE, BUFFER_TAE } from '../../src/lib/sim/buffer';
import type { Sample } from '../../src/lib/sim/sample';
import type { SimContext } from '../../src/lib/sim/gelSim';

const SAMPLE: Sample = {
  buffer: BUFFER_TBE,
  fragments: [{
    bases: 1000, mass: 50, degrade: 0, dye: -1, aggregate: [],
    aspectRatio: 1, color: [1, 1, 1],
  }],
};

const CTX: SimContext = {
  voltage: 70, time: 0.5, ySpaceScale: 200, wellDamage: 0,
  gelBuffer: BUFFER_TBE, sampleBuffer: BUFFER_TBE,
};

describe('serializeSample / deserializeFile (sample)', () => {
  it('round-trips a sample', () => {
    const text = serializeSample(SAMPLE);
    const back = deserializeFile(text);
    expect(back.kind).toBe('sample');
    if (back.kind === 'sample') {
      expect(back.sample.buffer).toEqual(SAMPLE.buffer);
      expect(back.sample.fragments.length).toBe(1);
      expect(back.sample.fragments[0].bases).toBe(1000);
    }
  });
  it('serialized JSON has native sample wrapper', () => {
    const text = serializeSample(SAMPLE);
    expect(JSON.parse(text).Gelbox).toEqual({ version: '1.0', type: 'sample' });
  });
});

describe('serializeGelState / deserializeFile (state)', () => {
  it('round-trips a multi-lane state', () => {
    const samples = [SAMPLE, null, null, null, null, null, null];
    const text = serializeGelState({ samples, numLanes: 7, ctx: CTX });
    const back = deserializeFile(text);
    expect(back.kind).toBe('state');
    if (back.kind === 'state') {
      expect(back.numLanes).toBe(7);
      expect(back.samples.length).toBe(7);
      expect(back.samples[0]?.fragments.length).toBe(1);
      expect(back.samples[1]).toBeNull();
      expect(back.ctx.voltage).toBe(70);
    }
  });
  it('serialized JSON has native gel wrapper', () => {
    const text = serializeGelState({ samples: [SAMPLE], numLanes: 1, ctx: CTX });
    expect(JSON.parse(text).Gelbox).toEqual({ version: '1.0', type: 'gel' });
  });
});

describe('deserializeFile error cases', () => {
  it('rejects invalid JSON', () => {
    expect(() => deserializeFile('not json')).toThrow(/not valid json/i);
  });
  it('rejects non-object root', () => {
    expect(() => deserializeFile('"hello"')).toThrow(/must be an object/);
  });
  it('rejects unknown schema', () => {
    expect(() => deserializeFile('{"schema":"foo-bar"}')).toThrow(/unknown schema/i);
  });
});

describe('deserializeFile reads fixture-shaped sample', () => {
  it('reads a TAE-buffer sample', () => {
    const taeSample: Sample = { ...SAMPLE, buffer: BUFFER_TAE };
    const text = serializeSample(taeSample);
    const back = deserializeFile(text);
    if (back.kind !== 'sample') throw new Error('expected sample');
    expect(back.sample.buffer).toEqual(BUFFER_TAE);
  });
});


describe('native export contract', () => {
  it('writes native species keys, dye names and metadata without transient fields', () => {
    expect(JSON.parse(serializeSample({ ...SAMPLE, name: 'test', icon: 'tube.png', iconScale: 0.5, id: 9,
      fragments: [{ ...SAMPLE.fragments[0], dye: 3, aggregate: [0, 2] }] }))).toEqual({
      Gelbox: { version: '1.0', type: 'sample' },
      Sample: { name: 'test', icon: 'tube.png', iconScale: 0.5, id: 9,
        Buffer: { Tris: 44.5, Borate: 44.5, Acetate: 0, EDTA: 1 },
        Fragments: [{ Bases: 1000, Mass: 50, Degrade: 0, Dye: 'Orange G', Aggregate: [0, 2], AspectRatio: 1, Color: [1, 1, 1] }] },
    });
  });
  it('saves visible lanes only, padding empty slots and omitting layout and sample context', () => {
    const file = JSON.parse(serializeGelState({ samples: [null, null, SAMPLE], numLanes: 2, ctx: CTX }));
    expect(file).toEqual({ Gelbox: { version: '1.0', type: 'gel' }, Gel: {
      Samples: [null, null], Buffer: { Tris: 44.5, Borate: 44.5, Acetate: 0, EDTA: 1 }, Time: 0.5, Voltage: 70, WellDamage: 0,
    } });
    expect(JSON.parse(serializeGelState({ samples: [], numLanes: 2, ctx: CTX })).Gel.Samples).toEqual([null, null]);
  });
  it('continues to read legacy web sample and gel documents', () => {
    expect(deserializeFile(JSON.stringify({ schema: 'gel-sample-v0', ...SAMPLE }))).toEqual({ kind: 'sample', sample: SAMPLE });
    expect(deserializeFile(JSON.stringify({ schema: 'gel-state-v0', samples: [SAMPLE], numLanes: 1, ctx: CTX }))).toEqual({ kind: 'state', samples: [SAMPLE,null,null,null,null,null,null], numLanes: 7, ctx: {...CTX,ySpaceScale:480-78/7} });
  });
});

it('rejects export of integer fields native cannot parse', () => {
  expect(() => serializeSample({ ...SAMPLE, id: 2.5 })).toThrow(/Invalid native/);
  expect(() => serializeSample({ ...SAMPLE, fragments: [{ ...SAMPLE.fragments[0], bases: 1000.5 }] })).toThrow(/Invalid native/);
});
