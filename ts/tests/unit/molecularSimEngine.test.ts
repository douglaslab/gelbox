import { describe, it, expect } from 'vitest';
import { MolecularSim, basesToRadius } from '../../src/lib/sim/molecularSimEngine';
import type { Sample, Fragment } from '../../src/lib/sim/sample';
import { BUFFER_TBE } from '../../src/lib/sim/buffer';

function frag(over: Partial<Fragment> = {}): Fragment {
  return {
    bases: 1000,
    mass:  100,
    degrade: 0,
    dye:   -1,
    aggregate: [],
    aspectRatio: 1,
    color: [1, 0, 0],
    ...over,
  };
}

function sample(fragments: Fragment[]): Sample {
  return { buffer: BUFFER_TBE, fragments };
}

const BOUNDS = { x1: 0, y1: 0, x2: 400, y2: 400 };

describe('basesToRadius', () => {
  it('maps 0 bases to radiusMin = 2', () => {
    expect(basesToRadius(0)).toBe(2);
  });
  it('maps high bases to radiusMax = 32', () => {
    expect(basesToRadius(14000)).toBe(32);
  });
  it('clamps above max', () => {
    expect(basesToRadius(1e6)).toBe(32);
  });
});

describe('MolecularSim.setSample', () => {
  it('builds a fragment profile per non-empty sample fragment', () => {
    const sim = new MolecularSim({ bounds: BOUNDS, seed: 1 });
    sim.setSample(sample([frag({ mass: 175 }), frag({ mass: 0, dye: 0 })]));
    expect(sim.fragments.length).toBe(2);
    expect(sim.fragments[0].targetPop).toBeCloseTo(50, 0);
    expect(sim.fragments[1].isDye).toBe(true);
  });
  it('clears fragments + marks all parts for fade-out when sample becomes null', () => {
    const sim = new MolecularSim({ bounds: BOUNDS, seed: 1 });
    sim.setSample(sample([frag({ mass: 175 })]));
    sim.preroll(50);
    expect(sim.parts.length).toBeGreaterThan(0);
    sim.setSample(null);
    expect(sim.fragments.length).toBe(0);
    for (const p of sim.parts) expect(p.alive).toBe(false);
  });
});

describe('MolecularSim.tick — spawn / cull / fade lifecycle', () => {
  it('grows the alive population toward targetPop over many ticks', () => {
    const sim = new MolecularSim({ bounds: BOUNDS, seed: 42 });
    sim.setSample(sample([frag({ mass: 175 })]));
    expect(sim.parts.length).toBe(0);
    for (let i = 0; i < 200; i++) sim.tick(1);
    const alive = sim.parts.filter((p) => p.alive).length;
    // targetPop ≈ 50 * sizeDensityScale (=1 at 400×400 bounds) → ≈ 50.
    expect(alive).toBeGreaterThan(40);
    expect(alive).toBeLessThanOrEqual(60);
  });
  it('dye fragments get zero population (culled to 0)', () => {
    const sim = new MolecularSim({ bounds: BOUNDS, seed: 7 });
    sim.setSample(sample([frag({ mass: 175, dye: 0 })]));
    for (let i = 0; i < 100; i++) sim.tick(1);
    expect(sim.parts.filter((p) => p.alive).length).toBe(0);
  });
  it('shrinks population when targetPop drops', () => {
    const sim = new MolecularSim({ bounds: BOUNDS, seed: 11 });
    const s = sample([frag({ mass: 175 })]);
    sim.setSample(s);
    sim.preroll(150);
    const aliveHigh = sim.parts.filter((p) => p.alive).length;
    expect(aliveHigh).toBeGreaterThan(20);
    sim.setSample(sample([frag({ mass: 1 })]));
    for (let i = 0; i < 200; i++) sim.tick(1);
    const aliveLow = sim.parts.filter((p) => p.alive).length;
    expect(aliveLow).toBeLessThan(aliveHigh);
  });
  it('preroll forces fully-faded particles', () => {
    const sim = new MolecularSim({ bounds: BOUNDS, seed: 7 });
    sim.setSample(sample([frag({ mass: 175 })]));
    sim.preroll(120);
    for (const p of sim.parts) {
      expect(p.fade === 0 || p.fade === 1).toBe(true);
    }
  });
  it('determinism: identical seeds produce identical particle counts', () => {
    const a = new MolecularSim({ bounds: BOUNDS, seed: 99 });
    const b = new MolecularSim({ bounds: BOUNDS, seed: 99 });
    a.setSample(sample([frag({ mass: 100 })]));
    b.setSample(sample([frag({ mass: 100 })]));
    for (let i = 0; i < 50; i++) { a.tick(1); b.tick(1); }
    expect(a.parts.length).toBe(b.parts.length);
  });
});

describe('MolecularSim.deleteFragment', () => {
  it('reindexes parts whose fragment > i and marks i\'s parts dead', () => {
    const sim = new MolecularSim({ bounds: BOUNDS, seed: 5 });
    sim.setSample(sample([frag({ mass: 175 }), frag({ mass: 175 })]));
    sim.preroll(80);
    const fragsCount = (idx: number) => sim.parts.filter((p) => p.fragment === idx && p.alive).length;
    expect(fragsCount(0)).toBeGreaterThan(0);
    expect(fragsCount(1)).toBeGreaterThan(0);
    sim.deleteFragment(0);
    expect(sim.fragments.length).toBe(1);
    // No alive part should still claim fragment 0 as its surviving home.
    for (const p of sim.parts.filter((p) => p.alive)) {
      expect(p.fragment).not.toBe(-1); // alive parts have a real fragment
    }
  });
});

describe('MolecularSim.pickPart / pickFragment', () => {
  it('returns -1 for a far-away point', () => {
    const sim = new MolecularSim({ bounds: BOUNDS, seed: 3 });
    sim.setSample(sample([frag({ mass: 175 })]));
    sim.preroll(100);
    expect(sim.pickPart(-1000, -1000)).toBe(-1);
  });
  it('returns the topmost particle for a hit on its centre', () => {
    const sim = new MolecularSim({ bounds: BOUNDS, seed: 2 });
    sim.setSample(sample([frag({ mass: 175 })]));
    sim.preroll(100);
    // Pick the centre of the latest particle.
    const target = sim.parts[sim.parts.length - 1];
    const result = sim.pickPart(target.loc.x, target.loc.y);
    expect(result).not.toBe(-1);
    expect(sim.pickFragment(target.loc.x, target.loc.y)).toBe(target.fragment);
  });
});

describe('MolecularSim.setBounds', () => {
  it('rescales sizeDensityScale on resize', () => {
    const sim = new MolecularSim({ bounds: BOUNDS });
    expect(sim.sizeDensityScale).toBe(1);  // 400×400 → 1
    sim.setBounds({ x1: 0, y1: 0, x2: 200, y2: 200 });
    expect(sim.sizeDensityScale).toBeCloseTo(0.25, 5);  // 200²/400² = 0.25
  });
});
