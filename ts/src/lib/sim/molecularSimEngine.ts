// Phase-3 M20: pure-data port of `~/code/gelbox/src/MolecularSim.cpp`.
//
// Holds the live particle list for one Sample. `tick(dt)` runs spawn/cull/
// fade/age — no rendering. `setSample()` reconciles the per-fragment Frag
// state when the underlying Sample changes.
//
// This file replaces the M15 `layoutDots` placeholder in M21 (when
// MolecularSimCanvas wires up to a live engine instance).

import { mulberry32, type Rng } from './rng';
import type { Sample } from './sample';
import { isDyeFragment } from './sample';
import { GEL_SIM_TUNING } from '../../data/tuning';

// ---------------------------------------------------------------------------
// Tuning constants — port of MolecularSimTuning (include/MolecularSim.h:16).
// We expose them as a const object to make pinning under test easy.

export const MOLECULAR_SIM_TUNING = {
  bulletTimeScale:           0.1,
  partSimIsOldAgeDeathEnabled: false,
  numPartsPerMassHigh:       50,
  numPartsExp:               0.5,

  fadeInStep:                0.05,
  fadeOutStep:               0.05,
  maxAge:                    30 * 1000,

  radiusMin:                 2,
  radiusMax:                 32,

  aggregateCullChanceScale:  (1 / 30) * 0.5,
  aggregateCullPopEps:       0,
  maxAgeMisfitAggregate:     30 * 30,

  jitter:                    0.75,
  partMinPickRadius:          8,

  numCirclePartVertices:     32,
  multimerAdhereOverlapFrac: 0.1,
} as const;

// ---------------------------------------------------------------------------
// Types

export interface Vec2 { x: number; y: number }
export interface Rect { x1: number; y1: number; x2: number; y2: number }

export interface FragState {
  /** Per-fragment target population (continuous, then dithered to int per frame). */
  targetPop:           number;
  isDye:               boolean;
  /** Ellipse half-axes in CSS px. */
  radius:              Vec2;
  wholenessLo:         number;
  wholenessHi:         number;
  color:               readonly [number, number, number];   // linear RGB 0..1
  aggregate:           number[];      // weights per multimer size; empty = monomer-only
  aggregateWeightSum:  number;
}

export interface PartMulti {
  /** Normalized offset from the part centre (units of part radius). */
  loc:   Vec2;
  angle: number;
}

export interface Part {
  fragment:    number;
  loc:         Vec2;
  vel:         Vec2;
  radius:      Vec2;
  angle:       number;
  angleVel:    number;
  color:       readonly [number, number, number];
  age:         number;
  fade:        number;     // 0..1
  alive:       boolean;
  degradeKey:  number;     // 0..1, stable across ticks for smooth size transitions
  wholeness:   number;     // 0..1
  multi:       PartMulti[];
}

// ---------------------------------------------------------------------------
// Helpers

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function calcTargetPopFromMass(mass: number): number {
  const massNorm = clamp(mass / GEL_SIM_TUNING.sampleMassHigh, 0, 1);
  const f = Math.pow(massNorm, MOLECULAR_SIM_TUNING.numPartsExp);
  return f * MOLECULAR_SIM_TUNING.numPartsPerMassHigh;
}

// ---------------------------------------------------------------------------
// MolecularSim engine

export interface MolecularSimOpts {
  /** Bounds in CSS px (canvas-local). */
  bounds: Rect;
  /** Seed for the dynamic RNG. Using a stable seed makes tests deterministic. */
  seed?: number;
}

export class MolecularSim {
  private rand: Rng;
  private popRand: Rng;
  bounds: Rect;
  fragments: FragState[] = [];
  parts:     Part[]      = [];
  /** Caller-controlled scale on per-fragment populations. */
  popDensityScale = 1;
  /** Implicit scale derived from bounds area; matches C++. */
  sizeDensityScale = 1;
  timeScale = 1;
  private sample: Sample | null = null;
  private seed: number;

  constructor(opts: MolecularSimOpts) {
    this.bounds = opts.bounds;
    this.seed   = opts.seed ?? 1;
    this.rand   = mulberry32(this.seed);
    // popRand is reseeded each tick from `seed` so dithering is deterministic
    // across a fresh start of the same sample.
    this.popRand = mulberry32(this.seed);
    this.recomputeSizeDensityScale();
  }

  private recomputeSizeDensityScale(): void {
    const w = this.bounds.x2 - this.bounds.x1;
    const h = this.bounds.y2 - this.bounds.y1;
    // Match C++ `MolecularSim::setBounds` normalization (default 400×400).
    this.sizeDensityScale = (w * h) / (400 * 400);
  }

  setBounds(b: Rect): void {
    this.bounds = b;
    this.recomputeSizeDensityScale();
  }

  /**
   * Reconcile the FragState[] to match `sample.fragments`. Particles already
   * in flight keep going; this just updates the per-fragment profile (radius,
   * color, target pop). Particles whose fragment was removed get marked dead.
   */
  setSample(sample: Sample | null): void {
    this.sample = sample;
    if (!sample) {
      this.fragments = [];
      // Mark all parts for fade-out (no fragment to belong to).
      for (const p of this.parts) p.alive = false;
      return;
    }
    this.fragments = sample.fragments.map((s) => {
      const r = basesToRadius(s.bases);
      // Maintain area: ry = sqrt(r² / aspect), rx = aspect × ry.
      const ry = Math.sqrt((r * r) / s.aspectRatio);
      const rx = s.aspectRatio * ry;
      const aggregate = (s.aggregate ?? []).slice();
      const aggregateWeightSum = aggregate.reduce((a, b) => a + b, 0);
      // Wholeness from degrade — C++ Sample::Fragment uses calcDegradeAsFrac
      // for both lo/hi; for M20 we collapse to (1,1) when degrade=0 and
      // leave the more nuanced port to M23.
      const wholeness = clamp(1 - s.degrade / 2, 0, 1);
      return {
        targetPop: calcTargetPopFromMass(s.mass),
        isDye:     isDyeFragment(s),
        radius:    { x: rx, y: ry },
        wholenessLo: wholeness,
        wholenessHi: wholeness,
        color:       s.color,
        aggregate,
        aggregateWeightSum,
      };
    });
    // Mark parts whose fragment is gone (sample shrank).
    for (const p of this.parts) {
      if (p.fragment < 0 || p.fragment >= this.fragments.length) p.alive = false;
    }
  }

  /**
   * Drop a fragment by index. Mirrors `MolecularSim::deleteFragment`.
   * Marks particles of that fragment as dead (so they fade out gracefully)
   * and reindexes any whose fragment > i (the array shrunk by 1).
   */
  deleteFragment(i: number): void {
    if (i < 0 || i >= this.fragments.length) return;
    for (const p of this.parts) {
      if (p.fragment === i) {
        p.alive = false;
        p.fragment = -1;
      } else if (p.fragment > i) {
        p.fragment -= 1;
      }
    }
    this.fragments.splice(i, 1);
    if (this.sample) {
      this.sample = {
        ...this.sample,
        fragments: this.sample.fragments.filter((_, idx) => idx !== i),
      };
    }
  }

  /**
   * Advance the sim by one tick. `dt` is in the C++'s notional "tick units"
   * (matching the C++ `tick()` signature: bulletTime is a boolean toggle, the
   * actual scale is in tuning). Pass dt=1 for normal time, or use the
   * provided convenience defaults.
   */
  tick(dt: number = 1): void {
    const cfg = MOLECULAR_SIM_TUNING;
    const dtScaled  = dt * this.timeScale;
    const dtFadeIn  = 1;
    const dtFadeOut = 1;

    // Census per-fragment populations.
    const pop      = new Array(this.fragments.length).fill(0);
    const alivePop = new Array(this.fragments.length).fill(0);
    const cullChance = new Array(this.fragments.length).fill(0);
    const aggregatePop:        number[][] = this.fragments.map(
      (f) => new Array(Math.max(1, f.aggregate.length)).fill(0),
    );
    const aggregateCullChance: number[][] = this.fragments.map(
      (f) => new Array(Math.max(1, f.aggregate.length)).fill(0),
    );
    for (const p of this.parts) {
      if (p.fragment < 0 || p.fragment >= pop.length) continue;
      pop[p.fragment]++;
      if (p.alive) {
        alivePop[p.fragment]++;
        if (p.multi.length > 0) {
          const m = Math.min(p.multi.length - 1, aggregatePop[p.fragment].length - 1);
          aggregatePop[p.fragment][m]++;
        }
      }
    }

    // Reseed the per-tick popRand so dithering is reproducible across runs.
    this.popRand = mulberry32(this.seed);
    const popDensityScale = this.sizeDensityScale * this.popDensityScale;

    for (let f = 0; f < this.fragments.length; f++) {
      const frag = this.fragments[f];
      const targetPopFrac = frag.targetPop * popDensityScale;
      let targetPop = Math.floor(targetPopFrac);
      if (targetPop === 0 && frag.targetPop > 0) {
        if (this.popRand() < targetPopFrac) targetPop = 1;
      }
      if (frag.isDye) targetPop = 0;

      // Spawn at most one part per tick (matches C++).
      if (alivePop[f] < targetPop) {
        const p = this.spawnPart(f);
        this.parts.push(p);
        pop[f]++;
      }
      if (alivePop[f] > targetPop) {
        cullChance[f] = (alivePop[f] - targetPop) / Math.max(1, targetPop);
      }
      // Aggregate-tier cull bookkeeping
      for (let m = 0; m < frag.aggregate.length; m++) {
        const targetMultiPop =
          (frag.aggregate[m] / Math.max(1e-9, frag.aggregateWeightSum)) * targetPop;
        if (aggregatePop[f][m] - cfg.aggregateCullPopEps > targetMultiPop) {
          aggregateCullChance[f][m] =
            ((aggregatePop[f][m] - targetMultiPop) / Math.max(1, aggregatePop[f][m]))
            * cfg.aggregateCullChanceScale;
        }
      }
    }

    // Per-part update.
    const inflated: Rect = {
      x1: this.bounds.x1, y1: this.bounds.y1,
      x2: this.bounds.x2, y2: this.bounds.y2,
    };
    for (const p of this.parts) {
      const frag = (p.fragment >= 0 && p.fragment < this.fragments.length)
        ? this.fragments[p.fragment]
        : null;

      p.age += dtScaled;

      if (p.alive) {
        p.fade = Math.min(1, p.fade + cfg.fadeInStep * dtFadeIn);
        const oldAge =
          p.age > cfg.maxAge && cfg.partSimIsOldAgeDeathEnabled;
        const aggCull =
          p.age > cfg.maxAgeMisfitAggregate
          && this.rand() < (aggregateCullChance[p.fragment]?.[Math.max(0, p.multi.length - 1)] ?? 0);
        if (
          !frag
          || oldAge
          || this.rand() < (cullChance[p.fragment] ?? 0)
          || aggCull
        ) {
          p.alive = false;
        }
      } else {
        p.fade = Math.max(0, p.fade - cfg.fadeOutStep * dtFadeOut);
      }

      // Move + jitter.
      p.loc.x += p.vel.x * dtScaled;
      p.loc.y += p.vel.y * dtScaled;
      const jx = (this.rand() * 2 - 1);
      const jy = (this.rand() * 2 - 1);
      const jr = this.rand();
      p.loc.x += jx * jr * cfg.jitter * dtScaled;
      p.loc.y += jy * jr * cfg.jitter * dtScaled;
      p.angle += p.angleVel * dtScaled;

      // Out-of-bounds kill (inflated by max radius).
      const maxR = Math.max(p.radius.x, p.radius.y);
      const outX = p.loc.x < inflated.x1 - maxR || p.loc.x > inflated.x2 + maxR;
      const outY = p.loc.y < inflated.y1 - maxR || p.loc.y > inflated.y2 + maxR;
      if (p.alive && (outX || outY)) p.alive = false;

      // Sync to fragment (radius/color drift towards latest profile).
      if (frag) {
        const targetW = lerp(frag.wholenessLo, frag.wholenessHi, p.degradeKey);
        p.wholeness = lerp(p.wholeness, targetW, 0.5);
        p.color  = [
          lerp(p.color[0], frag.color[0], 0.5),
          lerp(p.color[1], frag.color[1], 0.5),
          lerp(p.color[2], frag.color[2], 0.5),
        ];
        p.radius = {
          x: lerp(p.radius.x, frag.radius.x, 0.5),
          y: lerp(p.radius.y, frag.radius.y, 0.5),
        };
      }
    }

    // Erase fully-faded dead parts.
    this.parts = this.parts.filter((p) => p.alive || p.fade > 0);
  }

  /** Run `n` ticks back-to-back to settle the population at startup. */
  preroll(n: number = 100): void {
    for (let i = 0; i < n; i++) this.tick(1);
    // Force fade in/out fully.
    for (const p of this.parts) p.fade = p.alive ? 1 : 0;
  }

  /** Pick the topmost particle whose ellipse contains `(x, y)`. -1 for miss. */
  pickPart(x: number, y: number): number {
    const cfg = MOLECULAR_SIM_TUNING;
    const multiScale = (1 - cfg.multimerAdhereOverlapFrac) * 2;
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      const rx = Math.max(p.radius.x, cfg.partMinPickRadius);
      const ry = Math.max(p.radius.y, cfg.partMinPickRadius);
      const minR = Math.min(p.radius.x, p.radius.y);
      // Test every multimer slot (rotated + translated by mMulti.loc * minR * multiScale).
      for (const m of p.multi) {
        const mx = p.loc.x + m.loc.x * minR * multiScale;
        const my = p.loc.y + m.loc.y * minR * multiScale;
        const dx = x - mx;
        const dy = y - my;
        // Rotate (dx, dy) into the multimer's local frame.
        const a = -(p.angle + m.angle);
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        const lx = dx * cosA - dy * sinA;
        const ly = dx * sinA + dy * cosA;
        if ((lx / rx) ** 2 + (ly / ry) ** 2 <= 1) return i;
      }
    }
    return -1;
  }

  pickFragment(x: number, y: number): number {
    const i = this.pickPart(x, y);
    if (i === -1) return -1;
    return this.parts[i].fragment;
  }

  // -------------------------------------------------------------------------
  // private

  private spawnPart(f: number): Part {
    const frag = this.fragments[f];
    const w = this.bounds.x2 - this.bounds.x1;
    const h = this.bounds.y2 - this.bounds.y1;
    const loc: Vec2 = {
      x: this.bounds.x1 + this.rand() * w,
      y: this.bounds.y1 + this.rand() * h,
    };
    const vel: Vec2 = { x: (this.rand() - 0.5) * 1, y: (this.rand() - 0.5) * 1 };
    const part: Part = {
      fragment: f,
      loc,
      vel,
      radius: { ...frag.radius },
      angle:    this.rand() * Math.PI * 2,
      angleVel: (this.rand() - 0.5) * Math.PI * 0.004,
      color:    frag.color,
      age:      this.rand() * MOLECULAR_SIM_TUNING.maxAge, // staggered
      fade:     0,
      alive:    true,
      degradeKey: this.rand(),
      wholeness:  lerp(frag.wholenessLo, frag.wholenessHi, this.rand()),
      multi: [{ loc: { x: 0, y: 0 }, angle: 0 }],
    };
    // Build multimer to the weighted aggregate size. C++ `mRand.nextVec2()`
    // returns a uniform-direction UNIT vector (Cinder spec); we sample one
    // by picking a random angle. Each new multimer attaches at parent + unit.
    const aggregate = this.pickAggregateSize(frag);
    while (part.multi.length < aggregate) {
      const a = this.rand() * Math.PI * 2;
      const parent = part.multi[Math.floor(this.rand() * part.multi.length)];
      part.multi.push({
        loc:   { x: parent.loc.x + Math.cos(a), y: parent.loc.y + Math.sin(a) },
        angle: this.rand() * Math.PI * 2,
      });
    }
    return part;
  }

  private pickAggregateSize(frag: FragState): number {
    if (frag.aggregate.length === 0) return 1;
    let r = this.rand() * frag.aggregateWeightSum;
    for (let i = 0; i < frag.aggregate.length; i++) {
      if (r <= frag.aggregate[i]) return i + 1;
      r -= frag.aggregate[i];
    }
    return 1;
  }
}

/**
 * Port of `basesToRadius` (C++ MolecularSim.cpp:64-69) — a linear lerp from
 * (0..baseCountHigh) to (radiusMin..radiusMax).
 */
export function basesToRadius(bases: number): number {
  const t = clamp(bases / GEL_SIM_TUNING.baseCountHigh, 0, 1);
  return lerp(MOLECULAR_SIM_TUNING.radiusMin, MOLECULAR_SIM_TUNING.radiusMax, t);
}
