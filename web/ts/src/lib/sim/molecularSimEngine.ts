// Phase-3 M20: pure-data port of `~/code/gelbox/src/MolecularSim.cpp`.
//
// Holds the live particle list for one Sample. `tick(bulletTime)` runs spawn/cull/
// fade/age — no rendering. `setSample()` reconciles the per-fragment Frag
// state when the underlying Sample changes.
//
// This file replaces the M15 `layoutDots` placeholder in M21 (when
// MolecularSimCanvas wires up to a live engine instance).

import { CinderRand } from './rng';
const sharedGlobalRand = new CinderRand(310);
import type { Sample } from './sample';
import { isDyeFragment } from './sample';
import { GEL_SIM_TUNING } from '../../data/tuning';
import { calcDegradeAsFrac } from './mobility';

// ---------------------------------------------------------------------------
// Tuning constants — port of MolecularSimTuning (include/MolecularSim.h:16).
// We expose them as a const object to make pinning under test easy.

export const MOLECULAR_SIM_TUNING = {
  bulletTimeScale:           0.1,
  partSimIsOldAgeDeathEnabled: false,
  numPartsPerMassHigh:       50,
  numPartsExp:               1, // effective assets/tuning/molecular-sim.json, not header default

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
  return Math.fround(Math.fround(a) + Math.fround(Math.fround(Math.fround(b) - Math.fround(a)) * Math.fround(t)));
}

// Native Rectf rounds endpoints before width/height arithmetic.
function floatRect(b: Rect): Rect {
  return {x1: Math.fround(b.x1), y1: Math.fround(b.y1),
    x2: Math.fround(b.x2), y2: Math.fround(b.y2)};
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function calcTargetPopFromMass(mass: number): number {
  const f = Math.fround;
  const massNorm = clamp(f(f(mass) / f(GEL_SIM_TUNING.sampleMassHigh)), 0, 1);
  return f(f(Math.pow(massNorm, f(MOLECULAR_SIM_TUNING.numPartsExp))) * MOLECULAR_SIM_TUNING.numPartsPerMassHigh);
}

// ---------------------------------------------------------------------------
// MolecularSim engine

export interface MolecularSimOpts {
  /** Bounds in CSS px (canvas-local). */
  bounds: Rect;
  /** Seed for the dynamic RNG. Using a stable seed makes tests deterministic. */
  seed?: number;
  /** Explicit global Cinder stream seed for independent reference replay. */
  globalSeed?: number;
  /** Application-owned global stream shared by all of its molecular views. */
  globalRand?: CinderRand;
}

export class MolecularSim {
  private rand: CinderRand;
  private popRand: CinderRand;
  private globalRand: CinderRand;
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
    if (opts.globalRand !== undefined && opts.globalSeed !== undefined) {
      throw new Error('Provide globalRand or globalSeed, not both');
    }
    this.bounds = floatRect(opts.bounds);
    this.globalRand = opts.globalRand ?? (opts.globalSeed === undefined ? sharedGlobalRand : new CinderRand(opts.globalSeed));
    this.seed   = opts.seed ?? this.globalRand.nextUint();
    this.rand   = new CinderRand(this.seed);
    // popRand is reseeded each tick from `seed` so dithering is deterministic
    // across a fresh start of the same sample.
    this.popRand = new CinderRand(this.seed);
    this.recomputeSizeDensityScale();
  }

  /** Native setRand(ci::Rand(seed)): copy before drawing the population seed.
   * The dynamic stream must still start at its first draw. */
  setRand(seed: number): void {
    this.rand = new CinderRand(seed);
    this.seed = new CinderRand(seed).nextInt();
    this.popRand = new CinderRand(this.seed);
  }

  private recomputeSizeDensityScale(): void {
    const w = this.bounds.x2 - this.bounds.x1;
    const h = this.bounds.y2 - this.bounds.y1;
    // Match C++ `MolecularSim::setBounds` normalization (default 400×400).
    this.sizeDensityScale = Math.fround(Math.fround(Math.fround(w) * Math.fround(h)) / (400 * 400));
  }

  setBounds(b: Rect): void {
    this.bounds = floatRect(b);
    this.recomputeSizeDensityScale();
  }

  /**
   * Reconcile the FragState[] to match `sample.fragments`. Particles already
   * in flight keep going; this just updates the per-fragment profile (radius,
   * color, target pop). Particles whose fragment was removed get marked dead.
   */
  setSample(sample: Sample | null, degradeFilter?: ReadonlyMap<number, number>): void {
    // React document edits preserve surviving fragment objects. Recognize the
    // native swap-with-last deletion before applying the new profiles, so live
    // particles retain species ownership instead of changing color/size in place.
    const previous = this.sample?.fragments;
    if (sample && previous && sample.fragments.length === previous.length - 1) {
      const removed = previous.findIndex(f => !sample.fragments.includes(f));
      if (removed >= 0 && sample.fragments.every((f, i) =>
        f === previous[i === removed ? previous.length - 1 : i])) {
        this.deleteFragment(removed);
      }
    }
    this.sample = sample;
    if (!sample) {
      this.fragments = [];
      // Mark all parts for fade-out (no fragment to belong to).
      for (const p of this.parts) p.alive = false;
      return;
    }
    this.fragments = sample.fragments.map((s, idx) => {
      const r = basesToRadius(s.bases);
      // Maintain area: ry = sqrt(r² / aspect), rx = aspect × ry.
      const f = Math.fround;
      const ry = f(Math.sqrt(f(f(r * r) / f(s.aspectRatio))));
      const rx = f(f(s.aspectRatio) * ry);
      const aggregate = (s.aggregate ?? []).slice();
      const aggregateWeightSum = aggregate.reduce((sum, weight) => f(sum + f(weight)), 0);
      // MolecularSim::setSample keeps the two native degradation endpoints.
      const degraded = calcDegradeAsFrac(s.degrade);
      let wholenessLo = f(1 - degraded.lo), wholenessHi = f(1 - degraded.hi);
      const bpe = degradeFilter?.get(idx);
      if (bpe !== undefined) {
        // Aggregate::top selects the first largest weight, not the last slot.
        let top = 0, weight = 0;
        aggregate.forEach((value, i) => {
          if (f(value) > weight) { top = i; weight = f(value); }
        });
        const filteredRadius = basesToRadius(Math.trunc(bpe / (top + 1)));
        const ratio = f(filteredRadius / r);
        wholenessLo = wholenessHi = f(wholenessLo + f(f(wholenessHi - wholenessLo) * ratio));
      }
      const floor = f(MOLECULAR_SIM_TUNING.radiusMin / r);
      wholenessLo = Math.max(wholenessLo, floor);
      wholenessHi = Math.max(wholenessHi, floor);

      return {
        targetPop: calcTargetPopFromMass(s.mass),
        isDye:     isDyeFragment(s),
        radius:    { x: rx, y: ry },
        wholenessLo,
        wholenessHi,
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
   * and moves particles of the last fragment into the vacated index.
   */
  deleteFragment(i: number): void {
    if (i < 0 || i >= this.fragments.length) return;
    const last = this.fragments.length - 1;
    for (const p of this.parts) {
      if (p.fragment === i) {
        p.alive = false;
        p.fragment = -1;
      } else if (p.fragment === last) {
        p.fragment = i;
      }
    }
    this.fragments[i] = this.fragments[last];
    this.fragments.pop();
    if (this.sample) {
      const fragments = this.sample.fragments.slice();
      fragments[i] = fragments[last];
      fragments.pop();
      this.sample = { ...this.sample, fragments };
    }
  }

  /** Native tick takes a bullet-time flag; fades remain independent of motion time. */
  tick(bulletTime: boolean = false): void {
    const cfg = MOLECULAR_SIM_TUNING;
    const dtScaled = Math.fround(Math.fround(bulletTime ? cfg.bulletTimeScale : 1) * Math.fround(this.timeScale));
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
    this.popRand = new CinderRand(this.seed);
    const f32 = Math.fround;
    const popDensityScale = f32(f32(this.sizeDensityScale) * f32(this.popDensityScale));

    for (let f = 0; f < this.fragments.length; f++) {
      const frag = this.fragments[f];
      const targetPopFrac = f32(frag.targetPop * popDensityScale);
      let targetPop = Math.trunc(targetPopFrac);
      if (targetPop === 0 && frag.targetPop > 0) {
        if (this.popRand.nextFloat() < targetPopFrac) targetPop = 1;
      }
      if (frag.isDye) targetPop = 0;

      // Spawn at most one part per tick (matches C++).
      if (alivePop[f] < targetPop) {
        const p = this.spawnPart(f);
        this.parts.push(p);
        pop[f]++;
      }
      if (alivePop[f] > targetPop) {
        cullChance[f] = f32((alivePop[f] - targetPop) / targetPop);
      }
      // Aggregate-tier cull bookkeeping
      for (let m = 0; m < frag.aggregate.length; m++) {
        const targetMultiPop = Math.trunc(f32(f32(f32(frag.aggregate[m]) / frag.aggregateWeightSum) * targetPop));
        if (aggregatePop[f][m] - cfg.aggregateCullPopEps > targetMultiPop) {
          aggregateCullChance[f][m] =
            f32(f32((aggregatePop[f][m] - targetMultiPop) / aggregatePop[f][m])
            * f32(cfg.aggregateCullChanceScale));
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

      p.age = f32(p.age + dtScaled);

      if (p.alive) {
        p.fade = Math.min(1, f32(p.fade + f32(f32(cfg.fadeInStep) * dtFadeIn)));
        const oldAge =
          p.age > cfg.maxAge && cfg.partSimIsOldAgeDeathEnabled;
        if (
          !frag
          || oldAge
          || this.rand.nextFloat() < (cullChance[p.fragment] ?? 0)
          || (p.age > cfg.maxAgeMisfitAggregate
              && this.rand.nextFloat() < (aggregateCullChance[p.fragment]?.[Math.max(0, p.multi.length - 1)] ?? 0))
        ) {
          p.alive = false;
        }
      } else {
        p.fade = Math.max(0, f32(p.fade - f32(f32(cfg.fadeOutStep) * dtFadeOut)));
      }

      // Native consumes a unit-vector angle, then a separate magnitude.
      p.loc.x = f32(p.loc.x + f32(p.vel.x * dtScaled));
      p.loc.y = f32(p.loc.y + f32(p.vel.y * dtScaled));
      const jitter = this.rand.nextVec2(), magnitude = this.rand.nextFloat();
      p.loc.x = f32(p.loc.x + f32(f32(f32(jitter.x * magnitude) * f32(cfg.jitter)) * dtScaled));
      p.loc.y = f32(p.loc.y + f32(f32(f32(jitter.y * magnitude) * f32(cfg.jitter)) * dtScaled));
      p.angle = f32(p.angle + f32(p.angleVel * dtScaled));

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
    for (let i = 0; i < n; i++) this.tick(Boolean(this.timeScale));
    // Force fade in/out fully.
    for (const p of this.parts) p.fade = p.alive ? 1 : 0;
  }

  /** Pick the topmost particle whose ellipse contains `(x, y)`. -1 for miss. */
  pickPart(x: number, y: number): number {
    const cfg = MOLECULAR_SIM_TUNING;
    const f = Math.fround;
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      // Native inflates the copied Part before computing its transform, so
      // minimum pick radii also change multimer spacing. Picking deliberately
      // uses 2*minRadius, without the overlap used by the drawing path.
      const rx = Math.max(f(p.radius.x), f(cfg.partMinPickRadius));
      const ry = Math.max(f(p.radius.y), f(cfg.partMinPickRadius));
      const minR = Math.min(rx, ry);
      const c = f(Math.cos(f(p.angle))), s = f(Math.sin(f(p.angle)));
      for (const m of p.multi) {
        const ox = f(f(f(m.loc.x) * minR) * 2);
        const oy = f(f(f(m.loc.y) * minR) * 2);
        const cx = f(f(p.loc.x) + f(f(c * ox) - f(s * oy)));
        const cy = f(f(p.loc.y) + f(f(s * ox) + f(c * oy)));
        const mc = f(Math.cos(f(m.angle))), ms = f(Math.sin(f(m.angle)));
        const ca = f(f(c * mc) - f(s * ms));
        const sa = f(f(s * mc) + f(c * ms));
        // Preserve the native matrix inverse's cofactor/determinant rounding.
        // Rotating (point-center) and dividing by radius changes edge picks.
        const a = f(ca * rx), b = f(sa * rx);
        const cc = f(-sa * ry), d = f(ca * ry);
        // glm::rotate also rounds c + (1-c) on the Z diagonal; it can
        // differ from 1, and its cofactors affect the inverse's XY rounding.
        const z = f(f(c + f(1 - c)) * f(mc + f(1 - mc)));
        const iz00 = f(d * z), iz01 = -f(b * z);
        const iz10 = -f(cc * z), iz11 = f(a * z);
        const invDet = f(1 / f(f(a * iz00) + f(b * iz10)));
        const nx = -f(cx * z), ny = -f(cy * z);
        const tx = f(-f(f(cc * ny) - f(d * nx)) * invDet);
        const ty = f(f(f(a * ny) - f(b * nx)) * invDet);
        const lx = f(f(f(f(iz00 * invDet) * f(x)) + f(f(iz10 * invDet) * f(y))) + tx);
        const ly = f(f(f(f(iz01 * invDet) * f(x)) + f(f(iz11 * invDet) * f(y))) + ty);
        if (f(Math.sqrt(f(f(lx * lx) + f(ly * ly)))) <= 1) return i;
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
    const frag = this.fragments[f], f32 = Math.fround;
    const w = f32(this.bounds.x2 - this.bounds.x1), h = f32(this.bounds.y2 - this.bounds.y1);
    const loc = {x:f32(f32(this.rand.nextFloat()*w)+f32(this.bounds.x1)),
      y:f32(f32(this.rand.nextFloat()*h)+f32(this.bounds.y1))};
    const direction = this.rand.nextVec2();
    const vel = {x:f32(direction.x*0.5),y:f32(direction.y*0.5)};
    const age = this.rand.nextInt(MOLECULAR_SIM_TUNING.maxAge);
    const angle = f32(this.rand.nextFloat()*Math.PI*2);
    const angleVel = f32(this.globalRand.nextFloat(-1,1)*Math.PI*f32(0.002));
    const degradeKey = this.rand.nextFloat();
    const part: Part = {fragment:f,loc,vel,radius:{...frag.radius},angle,angleVel,
      color:frag.color,age,fade:0,alive:true,degradeKey,
      wholeness:lerp(frag.wholenessLo,frag.wholenessHi,degradeKey),
      multi:[{loc:{x:0,y:0},angle:0}]};
    const aggregate=this.pickAggregateSize(frag);
    while(part.multi.length<aggregate) {
      const angle=f32(this.rand.nextFloat()*Math.PI*2);
      // C++ signed nextInt converts to unsigned size_t before vector-size modulo.
      const index=Number(BigInt.asUintN(64,BigInt(this.rand.nextInt())) % BigInt(part.multi.length));
      const parent=part.multi[index], dir=this.rand.nextVec2();
      part.multi.push({loc:{x:f32(parent.loc.x+dir.x),y:f32(parent.loc.y+dir.y)},angle});
    }
    return part;
  }

  private pickAggregateSize(frag: FragState): number {
    if (frag.aggregate.length === 0) return 1;
    let r = Math.fround(this.rand.nextFloat() * frag.aggregateWeightSum);
    for (let i = 0; i < frag.aggregate.length; i++) {
      if (r <= frag.aggregate[i]) return i + 1;
      r = Math.fround(r - Math.fround(frag.aggregate[i]));
    }
    return 1;
  }
}

/**
 * Port of `basesToRadius` (C++ MolecularSim.cpp:64-69) — a linear lerp from
 * (0..baseCountHigh) to (radiusMin..radiusMax).
 */
export function basesToRadius(bases: number): number {
  const f = Math.fround;
  const { radiusMin, radiusMax } = MOLECULAR_SIM_TUNING;
  // Native lmap extrapolates and multiplies before dividing.
  return f(radiusMin + f(f(f(radiusMax - radiusMin) * f(Math.trunc(bases))) / f(GEL_SIM_TUNING.baseCountHigh)));
}
