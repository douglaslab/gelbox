import { describe, it, expect } from 'vitest';
import { pickBands, pickSmearAbove, pickSmearBelow, bandUIRect, makeSampleFromGel } from '../../src/lib/sim/sampleFromGel';
import type { Band } from '../../src/lib/sim/band';
import type { Sample } from '../../src/lib/sim/sample';
import { BUFFER_TBE } from '../../src/lib/sim/buffer';
import type { SimContext } from '../../src/lib/sim/mobility';

function band(partial: Partial<Band> = {}): Band {
  return {
    rect: { x1: 10, y1: 100, x2: 50, y2: 120 },
    smearAbove: 10, smearBelow: 20,
    smearBrightnessAbove: [1, 0], smearBrightnessBelow: [0.8, 0],
    flameHeight: 0, smileHeight: 0, smileExp: 0,
    blur: 4, brightness: 0.9, color: [1, 1, 1],
    randSeed: 0, wellDamage: 0, wellDamageRandSeed: 0,
    mass: 100, aggregate: 1, degrade: 0,
    ...partial,
  };
}

describe('bandUIRect', () => {
  it('expands by blur all sides, smearAbove/flame above, smearBelow below', () => {
    const r = bandUIRect(band());
    expect(r.x1).toBe(10 - 4);
    expect(r.x2).toBe(50 + 4);
    expect(r.y1).toBe(100 - 10 - 4);
    expect(r.y2).toBe(120 + 20 + 4);
  });

  it('uses max(smearAbove, flameHeight) for the top extent', () => {
    const r = bandUIRect(band({ flameHeight: 30, smearAbove: 10 }));
    expect(r.y1).toBe(100 - 30 - 4);   // flame (30) wins over smearAbove (10), then blur (4)
  });
});

describe('pickBands', () => {
  it('returns bands whose UI rect contains the point, with their original index', () => {
    const bands = [band(), band({ rect: { x1: 200, y1: 100, x2: 240, y2: 120 } })];
    const hit = pickBands({ x: 30, y: 110 }, bands);
    expect(hit.map((h) => h.index)).toEqual([0]);
  });

  it('returns an empty array when the point hits no band', () => {
    expect(pickBands({ x: 999, y: 999 }, [band()])).toEqual([]);
  });

  it('returns every band whose UI rect contains the point, preserving index', () => {
    const bands = [
      band(),                                                  // UI rect x:6..54, y:86..144
      band({ rect: { x1: 20, y1: 100, x2: 60, y2: 120 } }),    // overlaps at x=30,y=110
    ];
    const hit = pickBands({ x: 30, y: 110 }, bands);
    expect(hit.map((h) => h.index)).toEqual([0, 1]);
  });
});

describe('pickSmearAbove / pickSmearBelow', () => {
  it('pickSmearAbove is 0 at the body top edge and approaches 1 at the far smear edge', () => {
    const b = band();
    expect(pickSmearAbove(b, { x: 30, y: 100 })).toBe(0);
    expect(pickSmearAbove(b, { x: 30, y: 95 })).toBeCloseTo(0.5, 5);
    expect(pickSmearAbove(b, { x: 30, y: 110 })).toBe(0);
  });

  it('pickSmearBelow is 0 at the body bottom edge and approaches 1 at the far smear edge', () => {
    const b = band();
    expect(pickSmearBelow(b, { x: 30, y: 120 })).toBe(0);
    expect(pickSmearBelow(b, { x: 30, y: 130 })).toBeCloseTo(0.5, 5);
    expect(pickSmearBelow(b, { x: 30, y: 110 })).toBe(0);
  });

  it('returns 0 when the band has no smear extent (guards divide-by-zero)', () => {
    const b = band({ smearAbove: 0, smearBelow: 0 });
    expect(pickSmearAbove(b, { x: 30, y: 95 })).toBe(0);
    expect(pickSmearBelow(b, { x: 30, y: 130 })).toBe(0);
  });
});

const CTX: SimContext = {
  voltage: 1, time: 0.5, wellDamage: 0, ySpaceScale: 480,
  gelBuffer: BUFFER_TBE, sampleBuffer: BUFFER_TBE,
};

function setup() {
  const samples: (Sample | null)[] = [{
    buffer: BUFFER_TBE,
    fragments: [{ bases: 1000, mass: 100, degrade: 0, dye: -1, aggregate: [], aspectRatio: 1, color: [0.2, 0.4, 0.6] }],
  }];
  const wellRects = [{ x1: 10, y1: 0, x2: 50, y2: 12 }];
  return { samples, wellRects };
}

describe('makeSampleFromGel', () => {
  it('a body-centre hit scales mass by band.brightness and keeps the fragment color', () => {
    const { samples, wellRects } = setup();
    const b = band({ brightness: 0.5, mass: 100 });
    const lf = [{ lane: 0, fragment: 0 }];
    const { sample, degradeFilter } = makeSampleFromGel({ x: 30, y: 110 }, [b], lf, samples, wellRects, CTX);
    expect(sample.fragments).toHaveLength(1);
    expect(sample.fragments[0].mass).toBeCloseTo(100 * 0.5, 5);
    expect(sample.fragments[0].color).toEqual([0.2, 0.4, 0.6]);
    expect(degradeFilter.size).toBe(0);
  });

  it('a blur-halo hit scales mass by (1 - dist/blur)^3', () => {
    const { samples, wellRects } = setup();
    const b = band({ brightness: 1, mass: 100, blur: 10, smearAbove: 0, smearBelow: 0 });
    const lf = [{ lane: 0, fragment: 0 }];
    const { sample } = makeSampleFromGel({ x: 30, y: 125 }, [b], lf, samples, wellRects, CTX);
    const expected = 100 * Math.pow(1 - 5 / 10, 3);
    expect(sample.fragments[0].mass).toBeCloseTo(expected, 5);
  });

  it('returns an empty sample when the point hits no band', () => {
    const { samples, wellRects } = setup();
    const b = band();
    const lf = [{ lane: 0, fragment: 0 }];
    const { sample } = makeSampleFromGel({ x: 999, y: 999 }, [b], lf, samples, wellRects, CTX);
    expect(sample.fragments).toHaveLength(0);
  });

  it('a smear-above hit scales mass by lerp(smearBrightnessAbove[1], [0], above)', () => {
    const { samples, wellRects } = setup();
    const b = band({ mass: 100, smearBrightnessAbove: [1, 0] }); // [near=1, far=0]
    const lf = [{ lane: 0, fragment: 0 }];
    // y=95 is 5px above body top (100), smearAbove=10 → above=0.5
    // massScale = lerp(far=0, near=1, 0.5) = 0.5
    const { sample, degradeFilter } = makeSampleFromGel({ x: 30, y: 95 }, [b], lf, samples, wellRects, CTX);
    expect(sample.fragments[0].mass).toBeCloseTo(100 * 0.5, 5);
    expect(degradeFilter.size).toBe(0);            // above does not trigger degrade
  });

  it('a smear-below hit scales mass by lerp and populates the degrade filter', () => {
    const { samples, wellRects } = setup();
    const b = band({ mass: 100, smearBrightnessBelow: [0.8, 0] }); // [near=0.8, far=0]
    const lf = [{ lane: 0, fragment: 0 }];
    // y=130 is 10px below body bottom (120), smearBelow=20 → below=0.5
    // massScale = lerp(far=0, near=0.8, 0.5) = 0.4
    const { sample, degradeFilter } = makeSampleFromGel({ x: 30, y: 130 }, [b], lf, samples, wellRects, CTX);
    expect(sample.fragments[0].mass).toBeCloseTo(100 * 0.4, 5);
    expect(degradeFilter.size).toBe(1);            // smear-below triggers reverse-solve
    expect(degradeFilter.has(0)).toBe(true);       // keyed by output fragment index
  });

  it('emits a single-tier aggregate weight array for a multimer band', () => {
    const { samples, wellRects } = setup();
    const b = band({ aggregate: 3 });              // trimer tier
    const lf = [{ lane: 0, fragment: 0 }];
    const { sample } = makeSampleFromGel({ x: 30, y: 110 }, [b], lf, samples, wellRects, CTX);
    expect(sample.fragments[0].aggregate).toEqual([0, 0, 1]);
  });
});
