import { describe, it, expect } from 'vitest';
import {
  calcTargetPop,
  layoutDots,
  pickDot,
  totalDotCount,
  linearRgbToSrgbHex,
} from '../../src/lib/sim/molecularSim';
import type { Fragment, Sample } from '../../src/lib/sim/sample';
import { BUFFER_TBE } from '../../src/lib/sim/buffer';

function frag(opts: Partial<Fragment> = {}): Fragment {
  return {
    bases: 1000,
    mass:  100,
    degrade: 0,
    dye:   -1,
    aggregate: [],
    aspectRatio: 1,
    color: [1, 0, 0],
    ...opts,
  };
}

describe('calcTargetPop', () => {
  it('returns 0 for mass=0', () => {
    expect(calcTargetPop(0)).toBe(0);
  });
  it('returns 50 for mass=175 (sampleMassHigh)', () => {
    expect(calcTargetPop(175)).toBe(50);
  });
  it('clamps mass>175 to the same as 175', () => {
    expect(calcTargetPop(350)).toBe(50);
    expect(calcTargetPop(1e6)).toBe(50);
  });
  it('returns 25 for mass=43.75 (¼ of high → sqrt(0.25)*50 = 25)', () => {
    expect(calcTargetPop(43.75)).toBe(25);
  });
  it('round-trips a sweep monotonically', () => {
    let prev = -1;
    for (let m = 0; m <= 175; m += 10) {
      const n = calcTargetPop(m);
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
  });
});

describe('layoutDots', () => {
  it('returns no dots for an empty fragment list', () => {
    expect(layoutDots({ width: 200, height: 200, laneIndex: 0, fragments: [] })).toEqual([]);
  });
  it('skips dye fragments', () => {
    const dots = layoutDots({
      width: 200, height: 200, laneIndex: 0,
      fragments: [frag({ mass: 175, dye: 1 })],
    });
    expect(dots.length).toBe(0);
  });
  it('returns calcTargetPop(mass) dots per non-dye fragment', () => {
    const dots = layoutDots({
      width: 200, height: 200, laneIndex: 0,
      fragments: [frag({ mass: 175 }), frag({ mass: 43.75 })],
    });
    expect(dots.length).toBe(50 + 25);
    expect(dots.filter((d) => d.fragmentIndex === 0).length).toBe(50);
    expect(dots.filter((d) => d.fragmentIndex === 1).length).toBe(25);
  });
  it('all dots fall inside the (padded) canvas rect', () => {
    const padding = 24;
    const dots = layoutDots({
      width: 200, height: 200, laneIndex: 0,
      fragments: [frag({ mass: 175 })],
      padding,
    });
    for (const d of dots) {
      expect(d.cx).toBeGreaterThanOrEqual(padding);
      expect(d.cx).toBeLessThanOrEqual(200 - padding);
      expect(d.cy).toBeGreaterThanOrEqual(padding);
      expect(d.cy).toBeLessThanOrEqual(200 - padding);
    }
  });
  it('is deterministic — same inputs → identical positions', () => {
    const opts = {
      width: 300, height: 300, laneIndex: 2,
      fragments: [frag({ mass: 100 })],
    };
    const a = layoutDots(opts);
    const b = layoutDots(opts);
    expect(a).toEqual(b);
  });
  it('different lanes produce different scatter patterns', () => {
    const f = [frag({ mass: 100 })];
    const a = layoutDots({ width: 300, height: 300, laneIndex: 0, fragments: f });
    const b = layoutDots({ width: 300, height: 300, laneIndex: 1, fragments: f });
    expect(a[0].cx).not.toEqual(b[0].cx);
  });
});

describe('pickDot', () => {
  const fragments = [frag({ mass: 175 })];
  const dots = layoutDots({ width: 300, height: 300, laneIndex: 0, fragments });

  it('returns null for a miss far from any dot', () => {
    expect(pickDot(dots, -100, -100)).toBeNull();
  });
  it('returns the matching index when (x,y) lands on a dot centre', () => {
    const target = dots[7];
    const r = pickDot(dots, target.cx, target.cy);
    expect(r).not.toBeNull();
    expect(r!.fragmentIndex).toBe(target.fragmentIndex);
  });
  it('iterates in reverse — top-most dot wins on overlap', () => {
    // Two dots stacked exactly on top of each other.
    const stacked = [
      { fragmentIndex: 0, cx: 50, cy: 50, r: 4, color: [1,0,0] as const },
      { fragmentIndex: 1, cx: 50, cy: 50, r: 4, color: [0,1,0] as const },
    ];
    expect(pickDot(stacked, 50, 50)!.fragmentIndex).toBe(1);
  });
});

describe('totalDotCount', () => {
  it('sums calcTargetPop across non-dye fragments only', () => {
    const sample: Sample = {
      buffer: BUFFER_TBE,
      fragments: [
        frag({ mass: 175 }),                     // 50
        frag({ mass: 43.75 }),                   // 25
        frag({ mass: 175, dye: 0 }),             // skipped
      ],
    };
    expect(totalDotCount(sample)).toBe(75);
  });
});

describe('linearRgbToSrgbHex', () => {
  it('renders pure black + pure white', () => {
    expect(linearRgbToSrgbHex([0, 0, 0])).toBe('#000000');
    expect(linearRgbToSrgbHex([1, 1, 1])).toBe('#ffffff');
  });
});
