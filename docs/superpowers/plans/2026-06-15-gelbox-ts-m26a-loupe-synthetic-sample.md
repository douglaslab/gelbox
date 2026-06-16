# M26a — Loupe: synthetic-sample content (static) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the M7 SVG dot-scatter loupe with a real `MolecularSim` rendered from a synthetic sample extracted at the clicked gel pixel, at a fixed popup position (drag + hover-preview come in M26b/c).

**Architecture:** Extend `Band` with the mass/aggregate/degrade it currently discards. Add a pure `lib/sim/sampleFromGel.ts` that ports C++ `pickBands` + `makeSampleFromGelPos` (+ a `DegradeFilter`). Extend `MolecularSim.setSample` to accept that filter. Generalize `MolecularSimCanvas` into a presentational, lane-agnostic `SampleSimCanvas` used by both the middle panel (thin wrapper) and each loupe. The loupe state stores a gel-space anchor; `LoupePortalLayer` computes each loupe's synthetic sample from the already-memoized `bands`.

**Tech Stack:** TypeScript, React, Vitest (unit), Playwright (visual), WebGPU/WebGL2 via the existing `meshBatch` primitive.

**Spec:** `docs/superpowers/specs/2026-06-14-gelbox-ts-m26-loupe-parity-design.md`

**C++ references:** `~/code/gelbox/src/GelView.cpp` `makeSampleFromGelPos` (984), `pickBands` (1273); `MolecularSim.cpp` `setSample` (143).

---

## File structure

- **Modify** `ts/src/lib/sim/band.ts` — add `mass`, `aggregate`, `degrade` to `Band`.
- **Modify** `ts/src/lib/sim/gelSim.ts` — populate the new fields at the two band-creation sites.
- **Create** `ts/src/lib/sim/sampleFromGel.ts` — `DegradeFilter`, `pickBands`, `pickSmearAbove/Below`, `makeSampleFromGel`.
- **Create** `ts/tests/unit/sampleFromGel.test.ts` — unit tests for the above.
- **Modify** `ts/src/lib/sim/molecularSimEngine.ts` — `setSample(sample, degradeFilter?)`.
- **Modify** `ts/tests/unit/molecularSim.test.ts` (or nearest existing engine test file) — degrade-filter test.
- **Create** `ts/src/components/sample/SampleSimCanvas.tsx` — presentational lane-agnostic canvas (extracted from `MolecularSimCanvas`).
- **Modify** `ts/src/components/sample/MolecularSimCanvas.tsx` — becomes a thin gel-state wrapper over `SampleSimCanvas`.
- **Modify** `ts/src/lib/gpu/device.ts` — cache the `requestDevice()` promise so N surfaces share one device.
- **Modify** `ts/src/lib/gel/gelState.ts` — `LoupeRef` gains a gel-space anchor; `ADD_LOUPE` carries it.
- **Modify** `ts/src/components/gel/GelOverlay.tsx` — Cmd-click computes gel-space anchor.
- **Rewrite** `ts/src/components/gel/Loupe.tsx` — render `SampleSimCanvas` of the synthetic sample.
- **Modify** `ts/src/components/gel/LoupePortalLayer.tsx` — compute each loupe's synthetic sample from `bands`.
- **Modify** `ts/src/routes/GelPage.tsx` — pass `bands`/`bandToLaneFragment`/`wellRects` to `LoupePortalLayer`.
- **Modify** `ts/tests/unit/gelState.test.ts` — update loupe reducer tests for the new `LoupeRef` shape.
- **Create** `ts/tests/visual/loupe.spec.ts` — loupe render goldens (both backends).

---

## Task 1: Extend the `Band` type with mass/aggregate/degrade

**Files:**
- Modify: `ts/src/lib/sim/band.ts:8-23`
- Modify: `ts/src/lib/sim/gelSim.ts:22-55` (`dyeToBand`), `:57-106` (`fragAggregateToBand`)
- Test: `ts/tests/unit/gelSim.test.ts` (existing; add a case — if absent, create it)

- [ ] **Step 1: Write the failing test**

Add to `ts/tests/unit/gelSim.test.ts` (create the file with the imports below if it does not exist):

```ts
import { describe, it, expect } from 'vitest';
import { fragToBands } from '../../src/lib/sim/gelSim';
import type { Sample } from '../../src/lib/sim/sample';
import { BUFFER_TBE } from '../../src/lib/sim/buffer';
import type { SimContext } from '../../src/lib/sim/mobility';

const CTX: SimContext = {
  voltage: 1, time: 0.5, wellDamage: 0, ySpaceScale: 480,
  gelBuffer: BUFFER_TBE, sampleBuffer: BUFFER_TBE,
};
const WELL = { x1: 10, y1: 0, x2: 50, y2: 12 };

function monomer(overrides: Partial<Sample['fragments'][0]> = {}) {
  const sample: Sample = {
    buffer: BUFFER_TBE,
    fragments: [{ bases: 1000, mass: 100, degrade: 0, dye: -1, aggregate: [], aspectRatio: 1, color: [1, 1, 1], ...overrides }],
  };
  return sample;
}

describe('fragToBands band metadata (M26a)', () => {
  it('a monomer band carries mass, aggregate=1, degrade', () => {
    const bands = fragToBands(monomer({ mass: 80, degrade: 0.4 }), 0, WELL, 0, CTX);
    expect(bands).toHaveLength(1);
    expect(bands[0].mass).toBeCloseTo(80, 5);
    expect(bands[0].aggregate).toBe(1);
    expect(bands[0].degrade).toBeCloseTo(0.4, 5);
  });

  it('an aggregated fragment emits one band per tier with scaled mass and the tier index', () => {
    const bands = fragToBands(monomer({ mass: 90, aggregate: [3, 1] }), 0, WELL, 0, CTX);
    expect(bands).toHaveLength(2);
    expect(bands[0].aggregate).toBe(1);
    expect(bands[1].aggregate).toBe(2);
    // massScale = weight/sum → 3/4 and 1/4 of 90
    expect(bands[0].mass).toBeCloseTo(90 * 0.75, 5);
    expect(bands[1].mass).toBeCloseTo(90 * 0.25, 5);
  });

  it('a dye band carries its mass, aggregate=1, degrade=0', () => {
    const bands = fragToBands(monomer({ dye: 0, mass: 50, degrade: 1 }), 0, WELL, 0, CTX);
    expect(bands).toHaveLength(1);
    expect(bands[0].mass).toBeCloseTo(50, 5);
    expect(bands[0].aggregate).toBe(1);
    expect(bands[0].degrade).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ts && npx vitest run tests/unit/gelSim.test.ts`
Expected: FAIL — `band.mass`/`aggregate`/`degrade` are `undefined` (property does not exist on type, or assertion fails).

- [ ] **Step 3: Add the fields to the `Band` interface**

In `ts/src/lib/sim/band.ts`, add to the `Band` interface (after `wellDamageRandSeed`):

```ts
  // --- M26a: source metadata for loupe synthetic-sample extraction. The
  // renderer ignores these; makeSampleFromGel reads them.
  mass:      number;   // ng — fragment mass that produced this band (already aggregate-scaled)
  aggregate: number;   // 1-based multimer tier this band represents (1 = monomer/dye)
  degrade:   number;   // 0..2 — source fragment's degrade
```

- [ ] **Step 4: Populate them at both creation sites**

In `ts/src/lib/sim/gelSim.ts`, `dyeToBand` return object (after `wellDamageRandSeed: 0,`):

```ts
    mass,
    aggregate: 1,
    degrade: 0,
```

In `fragAggregateToBand` return object (after `wellDamageRandSeed,`):

```ts
    mass,
    aggregate,
    degrade: frag.degrade,
```

(`mass` and `aggregate` are already locals in both functions — see `dyeToBand`'s `mass` param and `fragAggregateToBand`'s `const mass` / `aggregate` param.)

- [ ] **Step 5: Run test to verify it passes**

Run: `cd ts && npx vitest run tests/unit/gelSim.test.ts`
Expected: PASS (3 passing).

- [ ] **Step 6: Run the full unit suite + typecheck**

Run: `cd ts && npx vitest run && npx tsc --noEmit`
Expected: all green. (If any fixture/golden constructs a `Band` literal by hand, it will now fail typecheck — add the three fields there.)

- [ ] **Step 7: Commit**

```bash
git add ts/src/lib/sim/band.ts ts/src/lib/sim/gelSim.ts ts/tests/unit/gelSim.test.ts
git commit -m "feat(sim): Band carries mass/aggregate/degrade for loupe extraction [M26a]"
```

---

## Task 2: `pickBands` + smear helpers in `sampleFromGel.ts`

**Files:**
- Create: `ts/src/lib/sim/sampleFromGel.ts`
- Create: `ts/tests/unit/sampleFromGel.test.ts`

C++ parity notes: `pickBands` returns every band whose **UI rect** contains the point — the UI rect is the body rect expanded by `blur` on all sides, by `max(smearAbove, flameHeight)` above, and by `smearBelow` below (matches the extents computed in `GelOverlay.tsx:145-176`). `pickSmearAbove/Below` return a 0..1 fraction of how far into the smear band the point is (0 = at the body edge, 1 = at the far smear edge), or 0 when not in that smear region.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { pickBands, pickSmearAbove, pickSmearBelow, bandUIRect } from '../../src/lib/sim/sampleFromGel';
import type { Band } from '../../src/lib/sim/band';

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
    expect(r.y1).toBe(100 - 10 - 4);   // top - max(smearAbove,flame) - blur
    expect(r.y2).toBe(120 + 20 + 4);   // bottom + smearBelow + blur
  });
});

describe('pickBands', () => {
  it('returns bands whose UI rect contains the point, with their original index', () => {
    const bands = [band(), band({ rect: { x1: 200, y1: 100, x2: 240, y2: 120 } })];
    const hit = pickBands({ x: 30, y: 110 }, bands);
    expect(hit.map((h) => h.index)).toEqual([0]);
  });
});

describe('pickSmearAbove / pickSmearBelow', () => {
  it('pickSmearAbove is 0 at the body top edge and approaches 1 at the far smear edge', () => {
    const b = band();
    expect(pickSmearAbove(b, { x: 30, y: 100 })).toBeCloseTo(0, 5);     // at body top
    expect(pickSmearAbove(b, { x: 30, y: 95 })).toBeCloseTo(0.5, 5);    // halfway up 10px smear
    expect(pickSmearAbove(b, { x: 30, y: 110 })).toBe(0);              // inside body → 0
  });

  it('pickSmearBelow is 0 at the body bottom edge and approaches 1 at the far smear edge', () => {
    const b = band();
    expect(pickSmearBelow(b, { x: 30, y: 120 })).toBeCloseTo(0, 5);     // at body bottom
    expect(pickSmearBelow(b, { x: 30, y: 130 })).toBeCloseTo(0.5, 5);   // halfway down 20px smear
    expect(pickSmearBelow(b, { x: 30, y: 110 })).toBe(0);              // inside body → 0
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ts && npx vitest run tests/unit/sampleFromGel.test.ts`
Expected: FAIL — module `sampleFromGel` not found.

- [ ] **Step 3: Implement `bandUIRect`, `pickBands`, smear helpers**

Create `ts/src/lib/sim/sampleFromGel.ts`:

```ts
// Port of ~/code/gelbox/src/GelView.cpp pickBands (1273) + makeSampleFromGelPos
// (984). Pure functions — no React. Builds a synthetic Sample from the gel
// pixel under a loupe.

import type { Band, Rect } from './band';
import type { Sample, Fragment } from './sample';
import type { SimContext } from './mobility';
import { solveBasesForY } from './solver';

export interface Vec2 { x: number; y: number }

/** fragmentIndex → base-pair-equivalent size after degradation at the pick point. */
export type DegradeFilter = Map<number, number>;

export interface PickedBand { band: Band; index: number }

/** The hit-test rect: body expanded by blur (all sides), smear/flame above, smear below. */
export function bandUIRect(b: Band): Rect {
  const upExt = Math.max(b.smearAbove, b.flameHeight);
  return {
    x1: b.rect.x1 - b.blur,
    x2: b.rect.x2 + b.blur,
    y1: b.rect.y1 - upExt - b.blur,
    y2: b.rect.y2 + b.smearBelow + b.blur,
  };
}

function rectContains(r: Rect, p: Vec2): boolean {
  return p.x >= r.x1 && p.x <= r.x2 && p.y >= r.y1 && p.y <= r.y2;
}

export function pickBands(p: Vec2, bands: readonly Band[]): PickedBand[] {
  const out: PickedBand[] = [];
  for (let i = 0; i < bands.length; i++) {
    if (rectContains(bandUIRect(bands[i]), p)) out.push({ band: bands[i], index: i });
  }
  return out;
}

/** 0 at body top edge → 1 at far smear edge; 0 if not above the body within the smear. */
export function pickSmearAbove(b: Band, p: Vec2): number {
  if (b.smearAbove <= 0) return 0;
  const d = b.rect.y1 - p.y;           // how far above the body top
  if (d <= 0 || d > b.smearAbove) return 0;
  return d / b.smearAbove;
}

/** 0 at body bottom edge → 1 at far smear edge; 0 if not below the body within the smear. */
export function pickSmearBelow(b: Band, p: Vec2): number {
  if (b.smearBelow <= 0) return 0;
  const d = p.y - b.rect.y2;           // how far below the body bottom
  if (d <= 0 || d > b.smearBelow) return 0;
  return d / b.smearBelow;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ts && npx vitest run tests/unit/sampleFromGel.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ts/src/lib/sim/sampleFromGel.ts ts/tests/unit/sampleFromGel.test.ts
git commit -m "feat(sim): pickBands + smear helpers for loupe extraction [M26a]"
```

---

## Task 3: `makeSampleFromGel` — massScale branches + DegradeFilter

**Files:**
- Modify: `ts/src/lib/sim/sampleFromGel.ts`
- Modify: `ts/tests/unit/sampleFromGel.test.ts`

C++ massScale (`GelView.cpp:984`): body hit → `band.mBrightness`; smear-above → `lerp(smearBrightnessAbove[1], smearBrightnessAbove[0], pickAbove)`; smear-below → `lerp(smearBrightnessBelow[1], smearBrightnessBelow[0], pickBelow)`; else blur halo → `d = 1 - min(1, dist/blur); d = d³`. Then `fragment.mass = band.mass * massScale`. Degrade: when smear-below or `frag.degrade > 0.5`, reverse-solve the bp size at the pick y and store in the filter; else set `fragment.degrade = 0`.

- [ ] **Step 1: Write the failing test**

Append to `ts/tests/unit/sampleFromGel.test.ts`:

```ts
import { makeSampleFromGel } from '../../src/lib/sim/sampleFromGel';
import type { Sample } from '../../src/lib/sim/sample';
import { BUFFER_TBE } from '../../src/lib/sim/buffer';
import type { SimContext } from '../../src/lib/sim/mobility';

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
    const { sample, degradeFilter } = makeSampleFromGel(
      { x: 30, y: 110 }, [b], lf, samples, wellRects, CTX,
    );
    expect(sample.fragments).toHaveLength(1);
    expect(sample.fragments[0].mass).toBeCloseTo(100 * 0.5, 5);
    expect(sample.fragments[0].color).toEqual([0.2, 0.4, 0.6]);
    expect(degradeFilter.size).toBe(0);            // degrade 0, not smear-below
  });

  it('a blur-halo hit scales mass by (1 - dist/blur)^3', () => {
    const { samples, wellRects } = setup();
    const b = band({ brightness: 1, mass: 100, blur: 10, smearAbove: 0, smearBelow: 0 });
    const lf = [{ lane: 0, fragment: 0 }];
    // 5px below the body bottom (y2=120), no smear → blur region, dist 5 of 10
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ts && npx vitest run tests/unit/sampleFromGel.test.ts`
Expected: FAIL — `makeSampleFromGel` is not exported.

- [ ] **Step 3: Implement `makeSampleFromGel`**

Append to `ts/src/lib/sim/sampleFromGel.ts`:

```ts
export interface BandLaneFragment { lane: number; fragment: number }

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

function bandRectDistance(r: Rect, p: Vec2): number {
  const dx = Math.max(r.x1 - p.x, 0, p.x - r.x2);
  const dy = Math.max(r.y1 - p.y, 0, p.y - r.y2);
  return Math.hypot(dx, dy);
}

/**
 * Build a synthetic Sample (and degrade filter) from the bands under a gel
 * pixel. Mirrors C++ GelView::makeSampleFromGelPos. `bandToLaneFragment` maps
 * each band index to its source (lane, fragment); `samples`/`wellRects` are the
 * gel's per-lane data; `ctx` is the sim context (for the reverse solver).
 */
export function makeSampleFromGel(
  p: Vec2,
  bands: readonly Band[],
  bandToLaneFragment: readonly BandLaneFragment[],
  samples: readonly (Sample | null)[],
  wellRects: readonly Rect[],
  ctx: SimContext,
): { sample: Sample; degradeFilter: DegradeFilter } {
  const fragments: Fragment[] = [];
  const degradeFilter: DegradeFilter = new Map();

  for (const { band: b, index } of pickBands(p, bands)) {
    const lf = bandToLaneFragment[index];
    const src = samples[lf.lane]?.fragments[lf.fragment];
    if (!src) continue;

    const above = pickSmearAbove(b, p);
    const below = pickSmearBelow(b, p);
    let massScale: number;
    if (p.x >= b.rect.x1 && p.x <= b.rect.x2 && p.y >= b.rect.y1 && p.y <= b.rect.y2) {
      massScale = b.brightness;
    } else if (above > 0) {
      massScale = lerp(b.smearBrightnessAbove[1], b.smearBrightnessAbove[0], above);
    } else if (below > 0) {
      massScale = lerp(b.smearBrightnessBelow[1], b.smearBrightnessBelow[0], below);
    } else {
      const d = 1 - Math.min(1, bandRectDistance(b.rect, p) / Math.max(1, b.blur));
      massScale = d * d * d;
    }

    const frag: Fragment = { ...src, mass: src.mass * massScale };

    if (below > 0 || src.degrade > 0.5) {
      const bpe = solveBasesForY({ targetY: p.y, frag: src, lane: lf.lane, ctx, wellRect: wellRects[lf.lane] });
      degradeFilter.set(fragments.length, bpe);
    } else {
      frag.degrade = 0;
    }

    // Single aggregate tier (this band's tier).
    frag.aggregate = b.aggregate > 1
      ? Array.from({ length: b.aggregate }, (_, i) => (i === b.aggregate - 1 ? 1 : 0))
      : [];

    fragments.push(frag);
  }

  return { sample: { buffer: ctx.sampleBuffer, fragments }, degradeFilter };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ts && npx vitest run tests/unit/sampleFromGel.test.ts`
Expected: PASS.

- [ ] **Step 5: Run full unit suite + typecheck**

Run: `cd ts && npx vitest run && npx tsc --noEmit`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add ts/src/lib/sim/sampleFromGel.ts ts/tests/unit/sampleFromGel.test.ts
git commit -m "feat(sim): makeSampleFromGel synthetic-sample extraction [M26a]"
```

---

## Task 4: `MolecularSim.setSample(sample, degradeFilter?)`

**Files:**
- Modify: `ts/src/lib/sim/molecularSimEngine.ts:152-186`
- Test: `ts/tests/unit/molecularSim.test.ts` (use the existing engine test file; if the name differs, run `ls ts/tests/unit | grep -i sim` and use that)

C++ (`MolecularSim.cpp:143`): when a `degradeFilter` entry exists for fragment `i`, constrain its wholeness toward the filtered base-pair size: `bpe /= aggregateTop+1; w = basesToRadius(bpe)/basesToRadius(bases); wholenessLo = wholenessHi = lerp(lo, hi, w)`, then floor each at `radiusMin/r`. With no filter, behaviour is unchanged.

- [ ] **Step 1: Write the failing test**

Add to the engine test file:

```ts
import { MolecularSim } from '../../src/lib/sim/molecularSimEngine';
import { BUFFER_TBE } from '../../src/lib/sim/buffer';

it('setSample with a degradeFilter shrinks the fragment wholeness toward the filtered size', () => {
  const sim = new MolecularSim({ bounds: { x1: 0, y1: 0, x2: 200, y2: 200 }, seed: 1 });
  const sample = {
    buffer: BUFFER_TBE,
    fragments: [{ bases: 8000, mass: 100, degrade: 0, dye: -1, aggregate: [], aspectRatio: 1, color: [1, 1, 1] as [number, number, number] }],
  };
  sim.setSample(sample);
  const wholeNoFilter = sim.fragments[0].wholenessHi;

  const filter = new Map<number, number>([[0, 1000]]); // much smaller bp than 8000
  sim.setSample(sample, filter);
  expect(sim.fragments[0].wholenessHi).toBeLessThan(wholeNoFilter);
  expect(sim.fragments[0].wholenessLo).toBeCloseTo(sim.fragments[0].wholenessHi, 5);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ts && npx vitest run tests/unit/molecularSim.test.ts`
Expected: FAIL — `setSample` takes one argument; the filtered wholeness is not smaller.

- [ ] **Step 3: Implement the optional filter**

In `molecularSimEngine.ts`, change the signature and add the constraint. Replace the `setSample` signature line and the per-fragment `wholeness` block:

```ts
  setSample(sample: Sample | null, degradeFilter?: ReadonlyMap<number, number>): void {
```

Inside the `sample.fragments.map((s) => { ... })`, replace the wholeness computation:

```ts
      const r = basesToRadius(s.bases);
      const ry = Math.sqrt((r * r) / s.aspectRatio);
      const rx = s.aspectRatio * ry;
      const aggregate = (s.aggregate ?? []).slice();
      const aggregateWeightSum = aggregate.reduce((a, b) => a + b, 0);

      let wholenessLo = clamp(1 - s.degrade / 2, 0, 1);
      let wholenessHi = wholenessLo;

      // M26a: loupe degrade filter constrains the visible size to a bp-equivalent.
      const idx = sample.fragments.indexOf(s);
      const bpe = degradeFilter?.get(idx);
      if (bpe !== undefined) {
        const aggTop = aggregate.length > 0 ? aggregate.length : 1;
        const w = basesToRadius(bpe / aggTop) / Math.max(1e-6, r);
        const lerped = lerp(wholenessLo, wholenessHi, clamp(w, 0, 1));
        wholenessLo = lerped;
        wholenessHi = lerped;
      }
      const floor = MOLECULAR_SIM_TUNING.radiusMin / Math.max(1e-6, r);
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
```

(Note `sample.fragments.indexOf(s)` is O(n) per fragment; fine for the small fragment counts here. If a reviewer objects, switch the `.map((s) => …)` to `.map((s, idx) => …)` and use `idx`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ts && npx vitest run tests/unit/molecularSim.test.ts`
Expected: PASS, and existing `setSample` tests still pass (no filter → unchanged path, modulo the new `radiusMin` floor which is a no-op for normal sizes).

- [ ] **Step 5: Full suite + typecheck**

Run: `cd ts && npx vitest run && npx tsc --noEmit`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add ts/src/lib/sim/molecularSimEngine.ts ts/tests/unit/molecularSim.test.ts
git commit -m "feat(sim): MolecularSim.setSample accepts a degradeFilter [M26a]"
```

---

## Task 5: Cache the GPU device

**Files:**
- Modify: `ts/src/lib/gpu/device.ts`

Multiple `SampleSimCanvas` surfaces (panel + N loupes) must not each create a `GPUDevice`. Memoize the promise.

- [ ] **Step 1: Implement a cached `requestDevice`**

Replace the body of `requestDevice` in `ts/src/lib/gpu/device.ts`:

```ts
let cached: Promise<DeviceBundle> | null = null;

export async function requestDevice(): Promise<DeviceBundle> {
  if (cached) return cached;
  cached = (async () => {
    if (typeof navigator === 'undefined' || !('gpu' in navigator) || !navigator.gpu) {
      throw new Error('WebGPU not available');
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('navigator.gpu.requestAdapter returned null');
    const device = await adapter.requestDevice();
    device.lost.then(() => { cached = null; });   // allow re-acquire after loss
    return { adapter, device, queue: device.queue };
  })();
  return cached;
}
```

- [ ] **Step 2: Typecheck + unit suite**

Run: `cd ts && npx tsc --noEmit && npx vitest run`
Expected: green (no unit test exercises WebGPU; this is a typecheck-only gate here).

- [ ] **Step 3: Verify the gel page still renders (manual smoke via Playwright)**

Run: `cd ts && npx playwright test tests/visual/sample-view.spec.ts --project=chromium-webgpu`
Expected: PASS — the panel still renders through the (now shared) device.

- [ ] **Step 4: Commit**

```bash
git add ts/src/lib/gpu/device.ts
git commit -m "perf(gpu): cache the GPUDevice so multiple surfaces share one [M26a]"
```

---

## Task 6: Extract `SampleSimCanvas` (presentational, lane-agnostic)

**Files:**
- Create: `ts/src/components/sample/SampleSimCanvas.tsx`
- Modify: `ts/src/components/sample/MolecularSimCanvas.tsx`

Move the entire engine + GPU-mount + rAF body of `MolecularSimCanvas` into a new `SampleSimCanvas` that takes explicit props instead of reading gel state. `MolecularSimCanvas` becomes a thin wrapper that reads gel state and renders `SampleSimCanvas`.

- [ ] **Step 1: Create `SampleSimCanvas` with this interface**

Create `ts/src/components/sample/SampleSimCanvas.tsx`. Copy the current `MolecularSimCanvas` implementation verbatim, then make these changes:
1. Props become:

```tsx
export interface SampleSimCanvasProps {
  sample: Sample | null;
  width: number;
  height: number;
  seed: number;
  degradeFilter?: ReadonlyMap<number, number>;
  selectedFragment?: number | null;
  rolloverFragment?: number | null;
  /** Pointer-down on a particle → its fragment index (omitted → non-interactive, e.g. loupe). */
  onPickFragment?: (fragment: number) => void;
  /** Pointer-move/leave → hovered fragment index or null (omitted → no hover dispatch). */
  onHoverFragment?: (fragment: number | null) => void;
  'data-testid'?: string;
}
```

2. Remove `useGelState`/`useGelDispatch` and all `state.*` reads. Replace:
   - the engine seed: `new MolecularSim({ bounds, seed })` uses the `seed` prop.
   - the sample effect: `simRef.current.setSample(sample ?? null, degradeFilter)` (pass the prop through).
   - selection/rollover: use the `selectedFragment ?? null` and `rolloverFragment ?? null` props directly when building the mesh — delete the `selectedFragForLane`/`classicSelectedFrag`/`rolloverFragForLane` derivations.
   - `onPointerMove`: compute `fragIdx` then call `onHoverFragment?.(fragIdx >= 0 ? fragIdx : null)`; keep `hoverRef` for the background-highlight state.
   - `onPointerLeave`: `onHoverFragment?.(null)`; keep clearing `hoverRef/downRef`.
   - `onPointerDown`: on `fragIdx >= 0`, call `onPickFragment?.(fragIdx)`.
3. Keep the `__molsimFreezeAfterTicks` freeze logic, the 2D fallback, and the `data-alive-count`/`data-frozen` attributes. Add a `data-testid` passthrough (default `'molecular-sim-canvas'`).

- [ ] **Step 2: Rewrite `MolecularSimCanvas` as a thin wrapper**

Replace `ts/src/components/sample/MolecularSimCanvas.tsx` with:

```tsx
import { useCallback } from 'react';
import { useGelState, useGelDispatch } from '../gel/GelContext';
import { SampleSimCanvas } from './SampleSimCanvas';

export interface MolecularSimCanvasProps {
  laneIndex: number;
  width: number;
  height: number;
}

export function MolecularSimCanvas({ laneIndex, width, height }: MolecularSimCanvasProps) {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const sample = state.samples[laneIndex] ?? null;

  const selectedFragment =
    state.selection?.lane === laneIndex ? state.selection.fragmentIndex
    : state.selectedLane === laneIndex ? state.selectedFragmentIndex
    : null;
  const rolloverFragment =
    state.rollover?.lane === laneIndex ? state.rollover.fragmentIndex : null;

  const onHoverFragment = useCallback((fragment: number | null) => {
    if (fragment !== null) dispatch({ type: 'SET_ROLLOVER', ref: { lane: laneIndex, fragmentIndex: fragment } });
    else if (state.rollover?.lane === laneIndex) dispatch({ type: 'SET_ROLLOVER', ref: null });
  }, [dispatch, laneIndex, state.rollover]);

  const onPickFragment = useCallback((fragment: number) => {
    dispatch({ type: 'SET_SELECTED', laneIndex, index: fragment });
  }, [dispatch, laneIndex]);

  return (
    <SampleSimCanvas
      sample={sample}
      width={width}
      height={height}
      seed={laneIndex * 31 + 1}
      selectedFragment={selectedFragment}
      rolloverFragment={rolloverFragment}
      onHoverFragment={onHoverFragment}
      onPickFragment={onPickFragment}
      data-testid="molecular-sim-canvas"
    />
  );
}
```

(Confirm the exact selected/dispatch action names against the current file — `SET_SELECTED` with `{laneIndex, index}` and `SET_ROLLOVER` with `{ref}` are what the current `MolecularSimCanvas` uses at lines 221/243.)

- [ ] **Step 3: Typecheck**

Run: `cd ts && npx tsc --noEmit`
Expected: green.

- [ ] **Step 4: Verify the panel is pixel-neutral (goldens unchanged)**

Run: `cd ts && npx playwright test tests/visual/sample-view.spec.ts --project=chromium-webgpu --project=chromium-webgl2`
Expected: PASS with no screenshot diffs — the refactor must not change panel pixels. If diffs appear, the wrapper is mis-mapping selection/rollover/seed; fix before committing (do NOT update snapshots).

- [ ] **Step 5: Commit**

```bash
git add ts/src/components/sample/SampleSimCanvas.tsx ts/src/components/sample/MolecularSimCanvas.tsx
git commit -m "refactor(sample): extract lane-agnostic SampleSimCanvas [M26a]"
```

---

## Task 7: Loupe state model → gel-space anchor

**Files:**
- Modify: `ts/src/lib/gel/gelState.ts:34-40` (`LoupeRef`), `:99` (`ADD_LOUPE` action), `:472-485` (reducer)
- Modify: `ts/tests/unit/gelState.test.ts:141-175`

For M26a (static popup) the loupe stores the gel-space anchor (for extraction) and a screen position (for fixed rendering). The fragment-index fields are dropped — content now comes from the pixel, not a single fragment.

- [ ] **Step 1: Update the loupe reducer tests**

Replace the loupe tests in `ts/tests/unit/gelState.test.ts` (the block at ~141-175) with:

```ts
it('ADD_LOUPE stores a gel-space anchor and screen position with an auto id', () => {
  let s = initialState();
  s = reducer(s, { type: 'ADD_LOUPE', anchor: { x: 120, y: 240 }, screen: { x: 300, y: 400 } });
  expect(s.loupes).toHaveLength(1);
  expect(s.loupes[0]).toMatchObject({ id: 1, anchor: { x: 120, y: 240 }, screen: { x: 300, y: 400 } });
  s = reducer(s, { type: 'ADD_LOUPE', anchor: { x: 1, y: 2 }, screen: { x: 3, y: 4 } });
  expect(s.loupes.map((l) => l.id)).toEqual([1, 2]);
});

it('REMOVE_LOUPE drops by id; CLEAR_LOUPES empties and resets the id counter', () => {
  let s = initialState();
  s = reducer(s, { type: 'ADD_LOUPE', anchor: { x: 0, y: 0 }, screen: { x: 0, y: 0 } });
  s = reducer(s, { type: 'REMOVE_LOUPE', id: 1 });
  expect(s.loupes).toHaveLength(0);
  s = reducer(s, { type: 'ADD_LOUPE', anchor: { x: 0, y: 0 }, screen: { x: 0, y: 0 } });
  s = reducer(s, { type: 'CLEAR_LOUPES' });
  expect(s.loupes).toHaveLength(0);
  s = reducer(s, { type: 'ADD_LOUPE', anchor: { x: 0, y: 0 }, screen: { x: 0, y: 0 } });
  expect(s.loupes[0].id).toBe(1);
});
```

(Use the existing test's helpers for `initialState()`/`reducer` — match their actual import names.)

- [ ] **Step 2: Run to verify it fails**

Run: `cd ts && npx vitest run tests/unit/gelState.test.ts`
Expected: FAIL — `ADD_LOUPE` still expects `lane`/`fragmentIndex`/`x`/`y`.

- [ ] **Step 3: Update the type, action, and reducer**

`LoupeRef`:

```ts
export interface LoupeRef {
  id:     number;
  anchor: { x: number; y: number };   // gel-space pixels (for synthetic-sample extraction)
  screen: { x: number; y: number };   // viewport-page px (fixed popup position; M26b makes this gel-space + draggable)
}
```

`ADD_LOUPE` action type (replace the existing line):

```ts
  | { type: 'ADD_LOUPE';     anchor: { x: number; y: number }; screen: { x: number; y: number } }
```

Reducer `ADD_LOUPE` case (replace):

```ts
    case 'ADD_LOUPE': {
      const id = state.loupeNextId;
      return {
        ...state,
        loupes: [...state.loupes, { id, anchor: action.anchor, screen: action.screen }],
        loupeNextId: id + 1,
      };
    }
```

(`REMOVE_LOUPE`/`CLEAR_LOUPES` are unchanged.)

- [ ] **Step 4: Run to verify it passes**

Run: `cd ts && npx vitest run tests/unit/gelState.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck (surfaces the GelOverlay + LoupePortalLayer call-site breaks)**

Run: `cd ts && npx tsc --noEmit`
Expected: FAIL in `GelOverlay.tsx` (old `ADD_LOUPE` shape) and `LoupePortalLayer.tsx`/`Loupe.tsx` (old `LoupeRef` fields). Those are fixed in Tasks 8–9; this is expected mid-stream. Commit after Task 9 when tsc is green again.

- [ ] **Step 6: Commit (tests only — code call-sites land in Tasks 8-9)**

```bash
git add ts/src/lib/gel/gelState.ts ts/tests/unit/gelState.test.ts
git commit -m "feat(gel): loupe state stores gel-space anchor + screen pos [M26a]"
```

---

## Task 8: Cmd-click computes the gel-space anchor

**Files:**
- Modify: `ts/src/components/gel/GelOverlay.tsx:98-106`

- [ ] **Step 1: Update `onBandPointerDown`'s Cmd branch**

Replace the `isCmd` branch in `onBandPointerDown`:

```ts
    if (isCmd) {
      // Cmd/Ctrl-click → open a loupe at this gel pixel; do NOT start a drag.
      const rect = svgRef.current!.getBoundingClientRect();
      const anchor = {
        x: ((e.clientX - rect.left) / rect.width)  * state.gelSize.width,
        y: ((e.clientY - rect.top)  / rect.height) * state.gelSize.height,
      };
      dispatch({ type: 'ADD_LOUPE', anchor, screen: { x: e.clientX, y: e.clientY } });
      return;
    }
```

- [ ] **Step 2: Typecheck this file's action shape**

Run: `cd ts && npx tsc --noEmit 2>&1 | grep GelOverlay || echo "GelOverlay OK"`
Expected: `GelOverlay OK` (remaining tsc errors are in Loupe/LoupePortalLayer, fixed next).

- [ ] **Step 3: Commit**

```bash
git add ts/src/components/gel/GelOverlay.tsx
git commit -m "feat(gel): Cmd-click opens a loupe at the gel-space pixel [M26a]"
```

---

## Task 9: Loupe renders the synthetic-sample `SampleSimCanvas`

**Files:**
- Rewrite: `ts/src/components/gel/Loupe.tsx`
- Modify: `ts/src/components/gel/LoupePortalLayer.tsx`
- Modify: `ts/src/routes/GelPage.tsx:24-39, 207`

Loupe geometry: 171×171 (C++ `mLoupeSize`), via `LAYOUT.loupeSize` if present, else the constant 171.

- [ ] **Step 1: Rewrite `Loupe.tsx`**

```tsx
import { useGelDispatch } from './GelContext';
import type { LoupeRef } from '../../lib/gel/gelState';
import type { Sample } from '../../lib/sim/sample';
import { SampleSimCanvas } from '../sample/SampleSimCanvas';

const LOUPE_SIZE = 171;

interface LoupeProps {
  loupe:          LoupeRef;
  sample:         Sample;
  degradeFilter?: ReadonlyMap<number, number>;
}

export function Loupe({ loupe, sample, degradeFilter }: LoupeProps) {
  const dispatch = useGelDispatch();
  return (
    <div
      data-testid={`loupe-${loupe.id}`}
      data-loupe-id={loupe.id}
      style={{
        position: 'fixed',
        left: loupe.screen.x,
        top: loupe.screen.y,
        width: LOUPE_SIZE,
        height: LOUPE_SIZE,
        background: 'var(--color-surface-raised, #14131a)',
        border: '1px solid var(--color-grid, #444)',
        borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      <button
        data-testid={`loupe-close-${loupe.id}`}
        onClick={() => dispatch({ type: 'REMOVE_LOUPE', id: loupe.id })}
        style={{
          position: 'absolute', top: 4, right: 4, zIndex: 1,
          width: 22, height: 22, padding: 0,
          background: 'transparent', border: 'none',
          color: 'var(--color-ink-muted, #888)', cursor: 'pointer',
          fontSize: 16, lineHeight: '20px',
        }}
        aria-label="Close loupe"
      >×</button>
      <SampleSimCanvas
        sample={sample}
        width={LOUPE_SIZE}
        height={LOUPE_SIZE}
        seed={Math.floor(loupe.anchor.x) * 19 + Math.floor(loupe.anchor.y) * 1723}
        degradeFilter={degradeFilter}
        data-testid={`loupe-canvas-${loupe.id}`}
      />
    </div>
  );
}
```

(Seed mirrors C++ `x*19 + y*1723 + floor(time*2393)`; the time term is added by the portal layer in Step 2 via `seed` recompute — keep it here as the position part. If you prefer the exact C++ seed including time, pass `seed` as a prop from the portal layer instead; see Step 2.)

- [ ] **Step 2: `LoupePortalLayer` builds each synthetic sample**

```tsx
import { useGelState } from './GelContext';
import { Loupe } from './Loupe';
import { makeSampleFromGel, type BandLaneFragment } from '../../lib/sim/sampleFromGel';
import type { Band } from '../../lib/sim/band';

interface LoupePortalLayerProps {
  bands: Band[];
  bandToLaneFragment: BandLaneFragment[];
}

export function LoupePortalLayer({ bands, bandToLaneFragment }: LoupePortalLayerProps) {
  const state = useGelState();
  return (
    <>
      {state.loupes.map((l) => {
        const { sample, degradeFilter } = makeSampleFromGel(
          l.anchor, bands, bandToLaneFragment, state.samples, state.wellRects, state.ctx,
        );
        return <Loupe key={l.id} loupe={l} sample={sample} degradeFilter={degradeFilter} />;
      })}
    </>
  );
}
```

- [ ] **Step 3: Pass `bands` into the portal layer in `GelPage`**

In `ts/src/routes/GelPage.tsx`, change the render at line 207 from `<LoupePortalLayer />` to:

```tsx
      <LoupePortalLayer bands={bands} bandToLaneFragment={bandToLaneFragment} />
```

(`bands` and `bandToLaneFragment` are already in scope from the `useMemo` at line 24.)

- [ ] **Step 4: Typecheck — should now be fully green**

Run: `cd ts && npx tsc --noEmit`
Expected: green (all call-sites updated).

- [ ] **Step 5: Full unit suite**

Run: `cd ts && npx vitest run`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add ts/src/components/gel/Loupe.tsx ts/src/components/gel/LoupePortalLayer.tsx ts/src/routes/GelPage.tsx
git commit -m "feat(gel): loupe renders synthetic-sample MolecularSim [M26a]"
```

---

## Task 10: Playwright loupe goldens (both backends)

**Files:**
- Create: `ts/tests/visual/loupe.spec.ts`
- Modify: `ts/tests/visual/gel-page.spec.ts:157-192` (existing loupe open/close/multi tests — update selectors only if they referenced the old loupe DOM/text)

- [ ] **Step 1: Write the interaction + golden test**

Use the existing `sample-view.spec.ts` as the pattern for the freeze hook (`window.__molsimFreezeAfterTicks`) and backend projects.

```ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { (window as unknown as { __molsimFreezeAfterTicks?: number }).__molsimFreezeAfterTicks = 60; });
  await page.goto('/gel');
});

test('cmd+click on a band opens a loupe showing live particles', async ({ page }) => {
  const band = page.locator('[data-testid="gel-page"] svg rect').first();
  await band.click({ modifiers: ['Meta'] });
  const loupe = page.locator('[data-testid^="loupe-"]').first();
  await expect(loupe).toBeVisible();
  const canvas = page.locator('[data-testid^="loupe-canvas-"]').first();
  await expect(canvas).toHaveAttribute('data-frozen', '1');         // settled
});

test('loupe close button removes it', async ({ page }) => {
  const band = page.locator('[data-testid="gel-page"] svg rect').first();
  await band.click({ modifiers: ['Meta'] });
  await page.locator('[data-testid^="loupe-close-"]').first().click();
  await expect(page.locator('[data-testid^="loupe-"]')).toHaveCount(0);
});

test('loupe render golden', async ({ page }) => {
  const band = page.locator('[data-testid="gel-page"] svg rect').first();
  await band.click({ modifiers: ['Meta'] });
  const canvas = page.locator('[data-testid^="loupe-canvas-"]').first();
  await expect(canvas).toHaveAttribute('data-frozen', '1');
  await expect(canvas).toHaveScreenshot('loupe-idle.png', { maxDiffPixelRatio: 0.01 });
});
```

- [ ] **Step 2: Run + capture goldens on both backends**

Run: `cd ts && npx playwright test tests/visual/loupe.spec.ts --project=chromium-webgpu --project=chromium-webgl2 --update-snapshots`
Expected: PASS; new `loupe-idle-*.png` snapshots written. Inspect them: the loupe must show colored particles (not blank, not the old SVG dots).

- [ ] **Step 3: Re-run without `--update-snapshots` to confirm determinism**

Run: `cd ts && npx playwright test tests/visual/loupe.spec.ts --project=chromium-webgpu --project=chromium-webgl2`
Expected: PASS (stable against the just-captured goldens).

- [ ] **Step 4: Confirm the old gel-page loupe tests still pass (or update selectors)**

Run: `cd ts && npx playwright test tests/visual/gel-page.spec.ts --project=chromium-webgl2`
Expected: PASS. If the old tests asserted the removed loupe text/SVG (`lane N · frag M`), update them to the new `[data-testid^="loupe-"]` presence checks shown above.

- [ ] **Step 5: Commit**

```bash
git add ts/tests/visual/loupe.spec.ts ts/tests/visual/gel-page.spec.ts ts/tests/visual/loupe.spec.ts-snapshots
git commit -m "test(gel): loupe synthetic-sample render goldens, both backends [M26a]"
```

---

## Task 11: Docs + status update

**Files:**
- Modify: `docs/STATUS.md`
- Modify: `docs/superpowers/plans/2026-05-09-gelbox-ts-phase-3-overview.md`

- [ ] **Step 1: Mark M26a shipped**

In `docs/STATUS.md`, update the M26 row to note M26a shipped (synthetic-sample loupe content; drag in M26b, hover-preview in M26c). In the phase-3 overview's sub-plans list, add a checked M26a entry pointing at this plan.

- [ ] **Step 2: Commit**

```bash
git add docs/STATUS.md docs/superpowers/plans/2026-05-09-gelbox-ts-phase-3-overview.md
git commit -m "docs(status): M26a shipped — synthetic-sample loupe content [M26a]"
```

---

## Definition of done (M26a)

- Cmd-click anywhere on a band opens a loupe rendering a live `MolecularSim` of the fragment(s) at that gel pixel, with mass/degrade reflected; the old SVG dot-scatter is gone.
- Multiple loupes coexist; the close button removes one.
- Middle panel pixels are unchanged (goldens pass).
- `cd ts && npx vitest run && npx tsc --noEmit` green; loupe Playwright goldens pass on chromium-webgpu and chromium-webgl2.
- No drag, no callout wedge, no hover-preview (M26b/M26c).
</content>
