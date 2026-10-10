import { describe, it, expect } from 'vitest';
import { fragToBands } from '../../src/lib/sim/gelSim';
import type { SimContext } from '../../src/lib/sim/mobility';
import type { Sample } from '../../src/lib/sim/sample';
import { BUFFER_TBE } from '../../src/lib/sim/buffer';

// Low-voltage / short-time ctx + small well, tuned so a single fragment lands
// fully inside the gel for the band-metadata assertions below.
const CTX_M26A: SimContext = {
  voltage: 1, time: 0.5, wellDamage: 0, ySpaceScale: 480,
  gelBuffer: BUFFER_TBE, sampleBuffer: BUFFER_TBE,
};
const WELL_M26A = { x1: 10, y1: 0, x2: 50, y2: 12 };

// Generic single-fragment sample factory (not necessarily a monomer — callers
// override `dye`/`aggregate` as needed).
function makeSample(overrides: Partial<Sample['fragments'][0]> = {}) {
  const sample: Sample = {
    buffer: BUFFER_TBE,
    fragments: [{ bases: 1000, mass: 100, degrade: 0, dye: -1, aggregate: [], aspectRatio: 1, color: [1, 1, 1], ...overrides }],
  };
  return sample;
}

describe('fragToBands band metadata (M26a)', () => {
  it('a monomer band carries mass, aggregate=1, degrade', () => {
    const bands = fragToBands(makeSample({ mass: 80, degrade: 0.4 }), 0, WELL_M26A, 0, CTX_M26A);
    expect(bands).toHaveLength(1);
    expect(bands[0].mass).toBeCloseTo(80, 5);
    expect(bands[0].aggregate).toBe(1);
    expect(bands[0].degrade).toBeCloseTo(0.4, 5);
  });

  it('an aggregated fragment emits one band per tier with scaled mass and the tier index', () => {
    const bands = fragToBands(makeSample({ mass: 90, aggregate: [3, 1] }), 0, WELL_M26A, 0, CTX_M26A);
    expect(bands).toHaveLength(2);
    expect(bands[0].aggregate).toBe(1);
    expect(bands[1].aggregate).toBe(2);
    expect(bands[0].mass).toBeCloseTo(90 * 0.75, 5);
    expect(bands[1].mass).toBeCloseTo(90 * 0.25, 5);
  });

  it('a dye band carries its mass, aggregate=1, degrade=0', () => {
    const bands = fragToBands(makeSample({ dye: 0, mass: 50, degrade: 1 }), 0, WELL_M26A, 0, CTX_M26A);
    expect(bands).toHaveLength(1);
    expect(bands[0].mass).toBeCloseTo(50, 5);
    expect(bands[0].aggregate).toBe(1);
    expect(bands[0].degrade).toBe(0);
  });
});

const CTX_DEFAULT: SimContext = {
  voltage: 70, time: 1, ySpaceScale: 100, wellDamage: 0,
  gelBuffer: BUFFER_TBE, sampleBuffer: BUFFER_TBE,
};
const WELL = { x1: 50, y1: 10, x2: 60, y2: 20 };

describe('fragToBands — dispatch', () => {
  it('dye fragment with mass=0 emits zero bands', () => {
    const sample: Sample = {
      buffer: BUFFER_TBE,
      fragments: [{
        bases: 0, mass: 0, degrade: 0, dye: 0, aggregate: [],
        aspectRatio: 1, color: [0, 0, 0],
      }],
    };
    expect(fragToBands(sample, 0, WELL, 0, CTX_DEFAULT)).toEqual([]);
  });
  it('dye fragment with mass>0 emits 1 band', () => {
    const sample: Sample = {
      buffer: BUFFER_TBE,
      fragments: [{
        bases: 0, mass: 50, degrade: 0, dye: 2, aggregate: [],
        aspectRatio: 1, color: [0, 0, 0],
      }],
    };
    const bands = fragToBands(sample, 0, WELL, 0, CTX_DEFAULT);
    expect(bands.length).toBe(1);
    // Bromphenol blue tint: ~#B3A7D3
    expect(bands[0].color[0]).toBeCloseTo(0xB3 / 255, 3);
    expect(bands[0].color[1]).toBeCloseTo(0xA7 / 255, 3);
    expect(bands[0].color[2]).toBeCloseTo(0xD3 / 255, 3);
  });
  it('fragment with empty aggregate → 1 monomer band', () => {
    const sample: Sample = {
      buffer: BUFFER_TBE,
      fragments: [{
        bases: 1000, mass: 50, degrade: 0, dye: -1, aggregate: [],
        aspectRatio: 1, color: [1, 1, 1],
      }],
    };
    const bands = fragToBands(sample, 0, WELL, 0, CTX_DEFAULT);
    expect(bands.length).toBe(1);
    expect(bands[0].color).toEqual([1, 1, 1]);
  });
  it('fragment with [0,1,0,2] aggregate → 2 bands', () => {
    const sample: Sample = {
      buffer: BUFFER_TBE,
      fragments: [{
        bases: 1000, mass: 90, degrade: 0, dye: -1, aggregate: [0, 1, 0, 2],
        aspectRatio: 1, color: [1, 1, 1],
      }],
    };
    const bands = fragToBands(sample, 0, WELL, 0, CTX_DEFAULT);
    expect(bands.length).toBe(2);
  });
  it('fragment with all-zero aggregate is treated as monomer', () => {
    const sample: Sample = {
      buffer: BUFFER_TBE,
      fragments: [{
        bases: 1000, mass: 50, degrade: 0, dye: -1, aggregate: [0, 0, 0],
        aspectRatio: 1, color: [1, 1, 1],
      }],
    };
    const bands = fragToBands(sample, 0, WELL, 0, CTX_DEFAULT);
    expect(bands.length).toBe(1);
  });
});

describe('fragToBands — band fields', () => {
  it.each([[-1, 0], [0, 0], [1, .1], [5, .5], [9.99, .999], [10, 1], [20, 1], [180, 1]])(
    'ramps curvature at %s minutes to %s of full strength', (minutes, fraction) => {
      for (const voltage of [-200, 200]) {
        const ctx = {...CTX_DEFAULT, voltage, time: minutes / 180};
        for (const degrade of [0, .4]) {
          const bands = fragToBands(makeSample({aggregate: [1, 1], degrade}), 0, WELL, 0, ctx);
          expect(bands).toHaveLength(2);
          for (const band of bands) {
            const full = (band.rect.y2 - band.rect.y1) * .35;
            expect(band.smileHeight).toBeCloseTo(full * fraction * (voltage < 0 ? -1 : 1), 6);
            if (fraction === 0) expect(band.smileHeight).toBe(0);
          }
        }
        expect(fragToBands(makeSample({dye: 0}), 0, WELL, 0, ctx)[0].smileHeight).toBe(0);
      }
    });

  it.each([-200, -70, -1, 0, 1, 70, 200])('curvature follows voltage polarity at %s V', voltage => {
    const sample = makeSample({aggregate: [1, 1], degrade: .4});
    const bands = fragToBands(sample, 0, WELL, 0, {...CTX_DEFAULT, voltage});
    expect(bands).toHaveLength(2);
    for (const band of bands) {
      const strength = (band.rect.y2 - band.rect.y1) * .35;
      expect(band.smileHeight).toBeCloseTo(strength * (voltage < 0 ? -1 : 1), 6);
    }
    const [dye] = fragToBands(makeSample({dye: 0}), 0, WELL, 0, {...CTX_DEFAULT, voltage});
    expect(dye.smileHeight).toBe(0);
  });

  it('monomer band has smile (smileHeight = rect.height × 0.35, smileExp = 4)', () => {
    const sample: Sample = {
      buffer: BUFFER_TBE,
      fragments: [{
        bases: 1000, mass: 50, degrade: 0, dye: -1, aggregate: [],
        aspectRatio: 1, color: [1, 1, 1],
      }],
    };
    const [b] = fragToBands(sample, 0, WELL, 0, CTX_DEFAULT);
    expect(b.smileExp).toBe(4);
    expect(b.smileHeight).toBeCloseTo((b.rect.y2 - b.rect.y1) * 0.35, 6);
  });
  it('dye band has smile/flame disabled (zero)', () => {
    const sample: Sample = {
      buffer: BUFFER_TBE,
      fragments: [{
        bases: 0, mass: 50, degrade: 0, dye: 0, aggregate: [],
        aspectRatio: 1, color: [0, 0, 0],
      }],
    };
    const [b] = fragToBands(sample, 0, WELL, 0, CTX_DEFAULT);
    expect(b.smileHeight).toBe(0);
    expect(b.flameHeight).toBe(0);
    expect(b.wellDamage).toBe(0);
  });
  it('overloaded mass (mass=170) gives flames > 0', () => {
    const sample: Sample = {
      buffer: BUFFER_TBE,
      fragments: [{
        bases: 1000, mass: 170, degrade: 0, dye: -1, aggregate: [],
        aspectRatio: 1, color: [1, 1, 1],
      }],
    };
    const [b] = fragToBands(sample, 0, WELL, 0, CTX_DEFAULT);
    expect(b.flameHeight).toBeGreaterThan(0);
  });
  it('different lanes produce different randSeeds (deterministic)', () => {
    const sample: Sample = {
      buffer: BUFFER_TBE,
      fragments: [{
        bases: 1000, mass: 50, degrade: 0, dye: -1, aggregate: [],
        aspectRatio: 1, color: [1, 1, 1],
      }],
    };
    const [b0] = fragToBands(sample, 0, WELL, 0, CTX_DEFAULT);
    const [b5] = fragToBands(sample, 0, WELL, 5, CTX_DEFAULT);
    expect(b0.randSeed).not.toBe(b5.randSeed);
    expect(b0.wellDamageRandSeed).toBe(0);  // 0 * 23
    expect(b5.wellDamageRandSeed).toBe(115);  // 5 * 23
  });
});
