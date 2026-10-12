# M5 — GelSim + State Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the C++ GelSim subsystem (`~/code/gelbox/src/GelSim.cpp`, ~475 LOC) to TypeScript. Given a `Sample` (fragments + buffer) and a `SimContext` (voltage, time, ySpaceScale, wellDamage, gelBuffer), produce `Band[]` that the existing WebGPU/WebGL2 renderers consume unchanged. Replace one hand-built fixture (`50-band.json`) with a sim-driven scene as proof-of-life.

**Architecture:** Pure functions, no classes. One file per algorithmic phase under `ts/src/lib/sim/`. The public entry point `fragToBands(sample, fragi, wellRect, lane, ctx)` dispatches by fragment type (dye / monomer / multimer) and runs the pipeline `degrade → mobility → brightness → diffusion → geometry → flames+seeds`. All constants live in `ts/src/data/tuning.ts` (extending the existing `GEL_RENDER_TUNING` with `GEL_SIM_TUNING`, sourced from `gel-sim.json` — note the JSON overrides several C++ header defaults). The existing `Band` interface (`lib/sim/band.ts`) already has every field the sim needs to set; no Band changes.

**Tech Stack:** TypeScript 5.6 strict, Vitest 3 unit tests, Playwright 1.49 golden frames. No new runtime dependencies.

**M5 reference:** C++ source at `~/code/gelbox/src/GelSim.cpp` (475 LOC), `~/code/gelbox/include/GelSim.h` (128 LOC), `~/code/gelbox/include/Sample.h`, `~/code/gelbox/include/Dye.h`, `~/code/gelbox/include/Buffer.h`, `~/code/gelbox/assets/tuning/gel-sim.json`. The TS port lands a faithful 1:1 mapping of the algorithm; the C++ commented-out branches (TEST buffers at line 130-136, WellDamage smear-up at line 300-303) stay disabled.

---

## Scope

**In M5:**
- `ts/src/lib/sim/buffer.ts` — `Buffer` interface (Tris/Borate/Acetate/EDTA), three presets, equality.
- `ts/src/lib/sim/dye.ts` — 4 dye constants (names, colors, BP ranges, max mass).
- `ts/src/lib/sim/aggregate.ts` — `Aggregate = number[]`, `aggregateSum()`.
- `ts/src/lib/sim/sample.ts` — `Sample` + `Fragment` interfaces (plain data; no class methods).
- `ts/src/data/tuning.ts` — extend with `GEL_SIM_TUNING` constants (sourced from `gel-sim.json`).
- `ts/src/lib/sim/mobility.ts` — `calcDegradeAsFrac`, `calcDegradeAsBP`, `calcDeltaY`.
- `ts/src/lib/sim/brightness.ts` — `calcBandAlpha`.
- `ts/src/lib/sim/diffusion.ts` — `calcBandDiffusion`.
- `ts/src/lib/sim/geometry.ts` — `calcBandGeometry`, `calcFlames`, `calcRandSeed`, `calcWellDamageRandSeed`.
- `ts/src/lib/sim/gelSim.ts` — `SimContext`, `dyeToBand`, `fragAggregateToBand`, `fragToBands`.
- `ts/fixtures/states/ladder-1kb.json` — a canonical sample (Sample-shaped, NOT bands-shaped) representing a 1 kb ladder.
- `ts/src/routes/DevSimPage.tsx` — new `/dev/sim` route that loads the sample, calls `fragToBands` per fragment+lane, and renders the resulting bands.
- `ts/tests/visual/sim-ladder.spec.ts` — Playwright golden for the sim-driven scene (both backend projects).
- Phase 1 overview: M5 row linked, tagged `m5-gelsim`, CI green.

**Out of M5 (deferred):**
- UI sliders to drive voltage/time/buffer/lane (M6 — interaction layer).
- Re-running the sim every frame; the dev page computes bands once at boot using fixed sim context.
- Full retirement of hand-built fixtures (`single-band.json`, `50-band.json` stay for renderer-only goldens).
- Loupes / molecular sim (M7).
- Save/load (M8).
- Per-Fragment color picker UI (M6).

**Non-goals:**
- Numerical bit-equality with the C++ output. The TS port follows the same algorithm with the same JSON tuning values; floating-point evaluation order may differ slightly. Visual parity (within `maxDiffPixelRatio: 0.02` per backend) is the bar.
- Performance gates beyond the existing M3/M4 perf goldens. The sim is reactive (called on state change), not per-frame.

---

## Decisions for this milestone

| Decision | Reason |
|---|---|
| Plain TS interfaces, no classes (`Buffer`, `Fragment`, `Sample`) | Matches the existing `Band`/`GlobalWarp` style; keeps data trivially serializable; no `this`-binding overhead in pure functions |
| Frozen tuning const, sourced from `gel-sim.json` values | Already established pattern in `data/tuning.ts` for `GEL_RENDER_TUNING`. JSON values DIFFER from C++ header defaults — use JSON |
| WellDamage smear-up STAYS disabled (matches C++ comment) | C++ has it commented out with `// Disabled for now by SD`; preserve behavior |
| TEST-buffers loop STAYS disabled (matches C++ `if ((0))`) | Same reason; commented-out code in the C++ should not influence behavior |
| `calcRandSeed` / `calcWellDamageRandSeed` use the C++ formulas verbatim | Determinism for goldens; the existing `RandSeed` field on Band is consumed by the renderer's flames mesh |
| Buffer equality is structural (deep equal on 4 fields) | C++ uses `operator==`. TS doesn't. We add `bufferEquals()` |
| No `mYSpaceScale` derivation in the sim itself | Caller passes it. M5's dev page hard-codes `ySpaceScale = gelHeight - 2*yMargin - laneWidth * 0.2` inline |
| Dye bands suppress smile/flames/wellDamage (matches C++) | Visual match with C++ Gelbox |
| Pixel-space output (Bands have `rect` in gel-pixels) | Renderer expects this; matches existing fixtures |
| New dev route `/dev/sim`, NOT a modification of `/dev/multi` | `/dev/multi` keeps renderer-isolated golden; `/dev/sim` exercises sim+renderer together |
| 1 kb ladder fixture has 10 fragments (100, 200, ... 1000 bp), one lane, default buffer (TBE 0.5×) | A canonical, recognizable scene that exercises mobility curve, blur, brightness, smile/flames, and aggregate (most fragments are monomer) |
| `fragToBands` test cases use mass values that produce round-number `calcBandAlpha` outputs | Hand-computed expected values should be checkable by inspection |

---

## File structure for M5

```
ts/
  src/
    lib/
      sim/
        aggregate.ts                       # NEW
        buffer.ts                          # NEW
        dye.ts                             # NEW
        sample.ts                          # NEW
        mobility.ts                        # NEW
        brightness.ts                      # NEW
        diffusion.ts                       # NEW
        geometry.ts                        # NEW
        gelSim.ts                          # NEW (entry point)
        band.ts                            # UNCHANGED
        globalWarp.ts                      # UNCHANGED
        rng.ts                             # UNCHANGED
    data/
      tuning.ts                            # MODIFY: add GEL_SIM_TUNING
    routes/
      DevSimPage.tsx                       # NEW
    App.tsx                                # MODIFY: register /dev/sim route
  fixtures/
    states/
      ladder-1kb.json                      # NEW (Sample-shaped fixture)
  tests/
    unit/
      buffer.test.ts                       # NEW
      dye.test.ts                          # NEW
      aggregate.test.ts                    # NEW
      mobility.test.ts                     # NEW
      brightness.test.ts                   # NEW
      diffusion.test.ts                    # NEW
      geometry.test.ts                     # NEW
      gelSim.test.ts                       # NEW
      tuning.test.ts                       # MODIFY (extend coverage)
    visual/
      sim-ladder.spec.ts                   # NEW (per-backend golden)
      sim-ladder.spec.ts-snapshots/
        sim-ladder-canvas-chromium-webgpu.png   # auto-generated
        sim-ladder-canvas-chromium-webgl2.png   # auto-generated
docs/
  superpowers/
    plans/
      2026-04-27-gelbox-ts-phase-1-overview.md  # MODIFY: mark M5 done
      2026-04-30-gelbox-ts-m5-gelsim.md         # this file
```

---

## Reference: C++ tuning values vs JSON values

**Use the JSON values.** The C++ header has different defaults that get overridden when `gel-sim.json` loads. Several differ:

| Constant | JSON | C++ default | Use |
|---|---|---|---|
| `SampleMassHigh` | 175 | 175 | — |
| `BaseCountHigh` | 14000 | 14000 | — |
| **`WellToDyeHeightScale`** | **3** | 4 | **JSON** |
| **`WellToHeightScale`** | **1.5** | 2 | **JSON** |
| **`SmearUpWithH2O`** | **6** | 2 | **JSON** |
| `SmearUpWithWellDamage` | 5 | 2 | JSON (but unused — wellDamage smear is disabled) |
| `SmearUpWithWellDamageThreshold` | 0.5 | 0.5 | — |
| `DeltaY.CurveExp` | 3.7 | 3.7 | — |
| `DeltaY.CurveBase` | 0.05 | 0.05 | — |
| **`DeltaY.CurveBaseTAE`** | **0.07** | 0.055 | **JSON** |
| `DeltaY.AspectRatioScale` | 0.06 | 0.06 | — |
| `Slider.VoltageNotch` | 70 | 70 | (default voltage) |
| `Slider.AspectRatioMax` | 16 | 16 | (used in mobility as `kHighAspectRatio`) |

Inline constants (NOT in JSON, embedded in `GelSim.cpp`):
- `calcBandDiffusion`: `kThresh = 1500`, `kUpperThresh = 10000`, `kThreshAmount = 2`, `kTinyScale = 16`, `kBaseline = 1`.
- `calcFlames`: `kOverloadThresh = SampleMassHigh * 0.8 = 140`.

---

## Tasks

### Task 1: Buffer types + presets

**Files:**
- Create: `ts/src/lib/sim/buffer.ts`
- Test: `ts/tests/unit/buffer.test.ts`

C++ reference: `~/code/gelbox/include/Buffer.h` lines 1-158 — Buffer is essentially `{ Tris, Borate, Acetate, EDTA: float }` plus three presets.

- [ ] **Step 1: Write `ts/tests/unit/buffer.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { BUFFER_H2O, BUFFER_TBE, BUFFER_TAE, bufferEquals, type Buffer } from '../../src/lib/sim/buffer';

describe('Buffer presets', () => {
  it('H2O is all zeros', () => {
    expect(BUFFER_H2O).toEqual({ tris: 0, borate: 0, acetate: 0, edta: 0 });
  });
  it('0.5x TBE is Tris=44.5, Borate=44.5, EDTA=1, Acetate=0', () => {
    expect(BUFFER_TBE).toEqual({ tris: 44.5, borate: 44.5, acetate: 0, edta: 1 });
  });
  it('1x TAE is Tris=40, Acetate=20, EDTA=1, Borate=0', () => {
    expect(BUFFER_TAE).toEqual({ tris: 40, borate: 0, acetate: 20, edta: 1 });
  });
});

describe('bufferEquals', () => {
  it('matches identical buffers', () => {
    expect(bufferEquals(BUFFER_TAE, BUFFER_TAE)).toBe(true);
    expect(bufferEquals(BUFFER_TAE, { ...BUFFER_TAE })).toBe(true);
  });
  it('differs on any field', () => {
    expect(bufferEquals(BUFFER_TAE, BUFFER_TBE)).toBe(false);
    const altered: Buffer = { ...BUFFER_TAE, tris: 41 };
    expect(bufferEquals(BUFFER_TAE, altered)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, confirm fails**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/buffer.test.ts
```

Expected: FAIL (module missing).

- [ ] **Step 3: Write `ts/src/lib/sim/buffer.ts`**

```ts
// Port of ~/code/gelbox/include/Buffer.h.
// All concentrations in mM (millimolar). The sim treats Buffer as pure data —
// it makes no derived computations (conductivity, heat). It influences mobility
// via two equality checks only: H2O triggers extra smear-above; TAE shifts the
// mobility curve base.

export interface Buffer {
  tris:    number;
  borate:  number;
  acetate: number;
  edta:    number;
}

export const BUFFER_H2O: Buffer = { tris:  0,   borate:  0,   acetate:  0, edta: 0 };
export const BUFFER_TBE: Buffer = { tris: 44.5, borate: 44.5, acetate:  0, edta: 1 };  // 0.5× TBE
export const BUFFER_TAE: Buffer = { tris: 40,   borate:  0,   acetate: 20, edta: 1 };  // 1× TAE

export function bufferEquals(a: Buffer, b: Buffer): boolean {
  return a.tris === b.tris && a.borate === b.borate && a.acetate === b.acetate && a.edta === b.edta;
}
```

- [ ] **Step 4: Run test, confirm passes**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/buffer.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 5: Run full unit suite + typecheck**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: typecheck clean, 37 + 5 = 42/42 unit tests.

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/sim/buffer.ts ts/tests/unit/buffer.test.ts
git commit -m "feat(sim): Buffer interface + TBE/TAE/H2O presets + equality"
```

---

### Task 2: Dye constants

**Files:**
- Create: `ts/src/lib/sim/dye.ts`
- Test: `ts/tests/unit/dye.test.ts`

C++ reference: `~/code/gelbox/include/Dye.h` lines 14-89 — 4 hardcoded dyes with names, colors, BP ranges, and a max mass constant. No JSON file.

- [ ] **Step 1: Write `ts/tests/unit/dye.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { DYE_NAMES, DYE_COLORS, DYE_BP_LO, DYE_BP_HI, DYE_MAX_MASS, DYE_COUNT, isValidDye } from '../../src/lib/sim/dye';

describe('Dye constants', () => {
  it('has 4 dyes', () => {
    expect(DYE_COUNT).toBe(4);
    expect(DYE_NAMES.length).toBe(4);
    expect(DYE_COLORS.length).toBe(4);
    expect(DYE_BP_LO.length).toBe(4);
    expect(DYE_BP_HI.length).toBe(4);
  });
  it('Xylene cyanol (idx 0): #00AFE2, BP 6000-7000', () => {
    expect(DYE_NAMES[0]).toBe('Xylene cyanol');
    expect(DYE_BP_LO[0]).toBe(6000);
    expect(DYE_BP_HI[0]).toBe(7000);
    expect(DYE_COLORS[0]).toEqual([0x00 / 255, 0xAF / 255, 0xE2 / 255]);
  });
  it('Cresol red (idx 1): #985D93, BP 700-900', () => {
    expect(DYE_NAMES[1]).toBe('Cresol red');
    expect(DYE_BP_LO[1]).toBe(700);
    expect(DYE_BP_HI[1]).toBe(900);
  });
  it('Bromphenol blue (idx 2): #B3A7D3, BP 300-500', () => {
    expect(DYE_NAMES[2]).toBe('Bromphenol blue');
    expect(DYE_BP_LO[2]).toBe(300);
    expect(DYE_BP_HI[2]).toBe(500);
  });
  it('Orange G (idx 3): #FACB01, BP 50-100', () => {
    expect(DYE_NAMES[3]).toBe('Orange G');
    expect(DYE_BP_LO[3]).toBe(50);
    expect(DYE_BP_HI[3]).toBe(100);
  });
  it('max mass is 125', () => {
    expect(DYE_MAX_MASS).toBe(125);
  });
  it('isValidDye accepts 0..3, rejects -1 and 4', () => {
    expect(isValidDye(-1)).toBe(false);
    expect(isValidDye(0)).toBe(true);
    expect(isValidDye(3)).toBe(true);
    expect(isValidDye(4)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, confirm fails**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/dye.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Write `ts/src/lib/sim/dye.ts`**

```ts
// Port of ~/code/gelbox/include/Dye.h. Pure constants — no JSON file backs these.

export const DYE_COUNT = 4;
export const DYE_MAX_MASS = 125;  // ng

export const DYE_NAMES = [
  'Xylene cyanol',
  'Cresol red',
  'Bromphenol blue',
  'Orange G',
] as const;

export const DYE_COLORS: readonly [number, number, number][] = [
  [0x00 / 255, 0xAF / 255, 0xE2 / 255],  // Xylene cyanol
  [0x98 / 255, 0x5D / 255, 0x93 / 255],  // Cresol red
  [0xB3 / 255, 0xA7 / 255, 0xD3 / 255],  // Bromphenol blue
  [0xFA / 255, 0xCB / 255, 0x01 / 255],  // Orange G
];

export const DYE_BP_LO = [6000, 700, 300, 50] as const;
export const DYE_BP_HI = [7000, 900, 500, 100] as const;

export function isValidDye(dye: number): boolean {
  return dye >= 0 && dye < DYE_COUNT;
}
```

- [ ] **Step 4: Run test + full unit suite**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: typecheck clean, 42 + 7 = 49/49 unit tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/sim/dye.ts ts/tests/unit/dye.test.ts
git commit -m "feat(sim): port 4 Dye constants (Xylene, Cresol, Bromphenol, Orange G)"
```

---

### Task 3: Aggregate utilities

**Files:**
- Create: `ts/src/lib/sim/aggregate.ts`
- Test: `ts/tests/unit/aggregate.test.ts`

C++ reference: `~/code/gelbox/include/Aggregate.h`. Aggregate is `vector<float>` where index `i` is the weight for the `(i+1)`-mer. Empty or sum==0 means "monomer only".

- [ ] **Step 1: Write `ts/tests/unit/aggregate.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { aggregateSum, type Aggregate } from '../../src/lib/sim/aggregate';

describe('aggregateSum', () => {
  it('returns 0 for empty aggregate', () => {
    expect(aggregateSum([])).toBe(0);
  });
  it('returns 0 for all-zero aggregate', () => {
    expect(aggregateSum([0, 0, 0])).toBe(0);
  });
  it('sums weights', () => {
    const agg: Aggregate = [1, 0, 0.5, 0, 2];  // monomer + trimer + 5-mer
    expect(aggregateSum(agg)).toBe(3.5);
  });
});
```

- [ ] **Step 2: Run, confirm fails. Write `ts/src/lib/sim/aggregate.ts`**

```ts
// Port of ~/code/gelbox/include/Aggregate.h.
// Aggregate is a 0-indexed weight array; index i = weight of the (i+1)-mer.
// Empty array OR sum == 0 means the fragment is monomer-only at full weight.
// Max multimer index is governed by the slider; no enforcement here.

export type Aggregate = readonly number[];

export function aggregateSum(a: Aggregate): number {
  let s = 0;
  for (const v of a) s += v;
  return s;
}
```

- [ ] **Step 3: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: typecheck clean, 49 + 3 = 52/52.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/sim/aggregate.ts ts/tests/unit/aggregate.test.ts
git commit -m "feat(sim): Aggregate type alias + aggregateSum() helper"
```

---

### Task 4: Sample + Fragment types

**Files:**
- Create: `ts/src/lib/sim/sample.ts`

C++ reference: `~/code/gelbox/include/Sample.h` lines 54-122. Fragment is 8 fields; Sample is `Fragment[]` plus a Buffer. The C++ class has a lot of UI/serialization methods we don't need for the sim. Pure data only here.

This task has no test file — `Sample` and `Fragment` are pure data interfaces validated by their use in later tasks.

- [ ] **Step 1: Write `ts/src/lib/sim/sample.ts`**

```ts
import type { Buffer } from './buffer';
import type { Aggregate } from './aggregate';

// Port of ~/code/gelbox/include/Sample.h.
// Plain data — no class methods, no parentage tracking (mOriginSample/Frag dropped),
// no UI fields (icon, name) live in the sim layer. Higher layers can extend with
// their own metadata if they need to round-trip.

export interface Fragment {
  bases:       number;             // base count, 100..14000 typical
  mass:        number;             // ng, 0..175
  degrade:     number;             // 0..2
  dye:         number;             // -1 = not a dye; 0..3 = dye index
  aggregate:   Aggregate;          // weight array, [] = monomer-only
  aspectRatio: number;             // 1..16
  color:       [number, number, number];  // linear RGB 0..1; used as Band.focusColor (not currently rendered)
}

export interface Sample {
  fragments: Fragment[];
  buffer:    Buffer;               // the sample's own buffer (may differ from gel buffer)
}

export function isDyeFragment(f: Fragment): boolean {
  return f.dye !== -1;
}
```

- [ ] **Step 2: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: typecheck clean (no behavior change yet); 52/52 unit.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/sim/sample.ts
git commit -m "feat(sim): Sample + Fragment interfaces"
```

---

### Task 5: Extend tuning.ts with GEL_SIM_TUNING

**Files:**
- Modify: `ts/src/data/tuning.ts`
- Modify: `ts/tests/unit/tuning.test.ts`

The existing `GEL_RENDER_TUNING` stays. We add a sibling `GEL_SIM_TUNING` keyed off `gel-sim.json` values. Important: use JSON values, NOT the C++ header defaults.

- [ ] **Step 1: Read `ts/src/data/tuning.ts`** to confirm current contents.

- [ ] **Step 2: Append GEL_SIM_TUNING to `ts/src/data/tuning.ts`**

After the existing `GEL_RENDER_TUNING` export, add:

```ts
// Port of ~/code/gelbox/assets/tuning/gel-sim.json (loaded at runtime in C++,
// constants here). NOTE: several values in JSON differ from the C++ header
// defaults — use the JSON values. See M5 plan "Reference: C++ vs JSON" table.
export const GEL_SIM_TUNING = {
  sampleMassHigh:        175,
  baseCountHigh:         14000,
  wellToDyeHeightScale:  3,        // JSON: 3 (C++ default: 4)
  wellToHeightScale:     1.5,      // JSON: 1.5 (C++ default: 2)
  smearUpWithH2O:        6,        // JSON: 6 (C++ default: 2)
  smearUpWithWellDamage:           5,    // unused — wellDamage smear is disabled in C++
  smearUpWithWellDamageThreshold:  0.5,  // unused
  deltaY: {
    curveExp:         3.7,
    curveBase:        0.05,
    curveBaseTAE:     0.07,        // JSON: 0.07 (C++ default: 0.055)
    aspectRatioScale: 0.06,
  },
  voltageNotch:        70,         // gTuning.mSliderVoltageDefaultValue
  aspectRatioMax:      16,         // gTuning.mSliderAspectRatioMax
  // Inline constants from GelSim.cpp (NOT in JSON):
  diffusion: {
    thresh:        1500,
    upperThresh:   10000,
    threshAmount:  2,
    tinyScale:     16,
    baseline:      1,
  },
  flames: {
    overloadThreshFrac: 0.8,       // overloadThresh = sampleMassHigh * 0.8 = 140
    maxScale:           2,         // 2× rect height when at maximum overload
  },
} as const;
```

- [ ] **Step 3: Extend `ts/tests/unit/tuning.test.ts`** with checks for the new constants

Add to the existing file (after the existing `describe('GEL_RENDER_TUNING'...)`):

```ts
import { GEL_SIM_TUNING } from '../../src/data/tuning';
// ...
describe('GEL_SIM_TUNING', () => {
  it('JSON-overridden values match gel-sim.json (not C++ header defaults)', () => {
    expect(GEL_SIM_TUNING.wellToDyeHeightScale).toBe(3);
    expect(GEL_SIM_TUNING.wellToHeightScale).toBe(1.5);
    expect(GEL_SIM_TUNING.smearUpWithH2O).toBe(6);
    expect(GEL_SIM_TUNING.deltaY.curveBaseTAE).toBe(0.07);
  });
  it('shared values match C++ defaults', () => {
    expect(GEL_SIM_TUNING.sampleMassHigh).toBe(175);
    expect(GEL_SIM_TUNING.baseCountHigh).toBe(14000);
    expect(GEL_SIM_TUNING.deltaY.curveExp).toBe(3.7);
    expect(GEL_SIM_TUNING.deltaY.curveBase).toBe(0.05);
    expect(GEL_SIM_TUNING.deltaY.aspectRatioScale).toBe(0.06);
    expect(GEL_SIM_TUNING.voltageNotch).toBe(70);
    expect(GEL_SIM_TUNING.aspectRatioMax).toBe(16);
  });
  it('inline diffusion constants match GelSim.cpp', () => {
    expect(GEL_SIM_TUNING.diffusion.thresh).toBe(1500);
    expect(GEL_SIM_TUNING.diffusion.upperThresh).toBe(10000);
    expect(GEL_SIM_TUNING.diffusion.threshAmount).toBe(2);
    expect(GEL_SIM_TUNING.diffusion.tinyScale).toBe(16);
    expect(GEL_SIM_TUNING.diffusion.baseline).toBe(1);
  });
  it('flames constants give overload threshold 140 ng', () => {
    expect(GEL_SIM_TUNING.flames.overloadThreshFrac * GEL_SIM_TUNING.sampleMassHigh).toBe(140);
  });
});
```

- [ ] **Step 4: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: clean, 52 + 4 = 56/56 unit tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/data/tuning.ts ts/tests/unit/tuning.test.ts
git commit -m "feat(sim): extend tuning.ts with GEL_SIM_TUNING (JSON-sourced + inline constants)"
```

---

### Task 6: Degrade helpers + calcDeltaY (mobility)

**Files:**
- Create: `ts/src/lib/sim/mobility.ts`
- Test: `ts/tests/unit/mobility.test.ts`

C++ reference: `GelSim.cpp` lines 76-151. `calcDegradeAsFrac`, `calcDegradeAsBP`, `calcDeltaY`. The mobility curve has 5 stages: normalize → aspect-ratio adjust → curve (1-y)^exp → voltage scale → time scale.

- [ ] **Step 1: Write `ts/tests/unit/mobility.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { calcDegradeAsFrac, calcDegradeAsBP, calcDeltaY, type SimContext } from '../../src/lib/sim/mobility';
import { BUFFER_TBE, BUFFER_TAE, BUFFER_H2O } from '../../src/lib/sim/buffer';

describe('calcDegradeAsFrac', () => {
  it('degrade 0 → both zero', () => {
    expect(calcDegradeAsFrac(0)).toEqual({ lo: 0, hi: 0 });
  });
  it('degrade 0.5 → lo=0.5, hi=0', () => {
    expect(calcDegradeAsFrac(0.5)).toEqual({ lo: 0.5, hi: 0 });
  });
  it('degrade 1 → lo=1, hi=0', () => {
    expect(calcDegradeAsFrac(1)).toEqual({ lo: 1, hi: 0 });
  });
  it('degrade 1.5 → lo=1, hi=0.5', () => {
    expect(calcDegradeAsFrac(1.5)).toEqual({ lo: 1, hi: 0.5 });
  });
  it('degrade 2 → both one', () => {
    expect(calcDegradeAsFrac(2)).toEqual({ lo: 1, hi: 1 });
  });
});

describe('calcDegradeAsBP', () => {
  it('degrade 0 / 1000 bases → lo=0, hi=0 then floored to 1', () => {
    // C++: max(1, ...). 0 fraction × 1000 = 0 → max(1,0)=1
    expect(calcDegradeAsBP(0, 1000)).toEqual({ lo: 1, hi: 1 });
  });
  it('degrade 0.5 / 1000 bases → lo=500, hi=1', () => {
    expect(calcDegradeAsBP(0.5, 1000)).toEqual({ lo: 500, hi: 1 });
  });
  it('degrade 1.5 / 1000 bases → lo=1000, hi=500', () => {
    expect(calcDegradeAsBP(1.5, 1000)).toEqual({ lo: 1000, hi: 500 });
  });
});

const CTX_DEFAULT: SimContext = {
  voltage: 70, time: 1, ySpaceScale: 1, wellDamage: 0,
  gelBuffer: BUFFER_TBE, sampleBuffer: BUFFER_TBE,
};

describe('calcDeltaY', () => {
  it('at 14000 bases (max) on 1× TBE @ 70V, t=1: returns curveBase = 0.05', () => {
    // y = 14000/14000 = 1; (1-1)^3.7 = 0; +curveBase=0.05; voltage scale = 1; time = 1.
    expect(calcDeltaY(14000, 1, 1, CTX_DEFAULT)).toBeCloseTo(0.05, 6);
  });
  it('at 0 bases on TBE: returns curveBase + 1 = 1.05', () => {
    // y = 0; (1-0)^3.7 = 1; +0.05 = 1.05.
    expect(calcDeltaY(0, 1, 1, CTX_DEFAULT)).toBeCloseTo(1.05, 6);
  });
  it('TAE buffer uses curveBase=0.07 (not 0.05)', () => {
    const ctxTae = { ...CTX_DEFAULT, gelBuffer: BUFFER_TAE };
    expect(calcDeltaY(14000, 1, 1, ctxTae)).toBeCloseTo(0.07, 6);
  });
  it('voltage 0 → deltaY = 0 (no migration)', () => {
    const ctx0 = { ...CTX_DEFAULT, voltage: 0 };
    // voltage scale: (1 + (0 - 70)/70 * 1) = 1 + (-1) = 0
    expect(calcDeltaY(7000, 1, 1, ctx0)).toBe(0);
  });
  it('voltage 140 (2×) doubles deltaY vs 70V baseline', () => {
    const v70 = calcDeltaY(7000, 1, 1, CTX_DEFAULT);
    const v140 = calcDeltaY(7000, 1, 1, { ...CTX_DEFAULT, voltage: 140 });
    expect(v140).toBeCloseTo(v70 * 2, 6);
  });
  it('time 0 → deltaY = 0', () => {
    expect(calcDeltaY(7000, 1, 1, { ...CTX_DEFAULT, time: 0 })).toBe(0);
  });
  it('aggregation 2 (dimer) on 7000 bases ≈ same y-position as 14000-base monomer', () => {
    // Effective y in [0,1]: 7000*2/14000 = 1 → curve term 0
    expect(calcDeltaY(7000, 2, 1, CTX_DEFAULT)).toBeCloseTo(calcDeltaY(14000, 1, 1, CTX_DEFAULT), 6);
  });
  it('higher aspectRatio reduces deltaY (faster migration in time>0)', () => {
    const aspectLow = calcDeltaY(5000, 1, 1, CTX_DEFAULT);
    const aspectHigh = calcDeltaY(5000, 1, 16, CTX_DEFAULT);
    expect(aspectHigh).toBeLessThan(aspectLow);
  });
  it('H2O buffer uses curveBase=0.05 (no special-case in calcDeltaY)', () => {
    // H2O affects smear-above in geometry, NOT mobility curve base.
    expect(calcDeltaY(14000, 1, 1, { ...CTX_DEFAULT, gelBuffer: BUFFER_H2O })).toBeCloseTo(0.05, 6);
  });
});
```

- [ ] **Step 2: Run, confirm fails. Write `ts/src/lib/sim/mobility.ts`**

```ts
// Port of ~/code/gelbox/src/GelSim.cpp lines 76-151.
//
// Five-phase mobility curve:
//   1. y = bases × aggregation, normalized by baseCountHigh, clamped to [0,1].
//   2. Aspect-ratio shift: (aspectRatio - 1)/aspectRatioMax × aspectRatioScale × time, subtracted.
//   3. Curve: y = curveBase + (1 - y)^curveExp.
//   4. Voltage scale: × (1 + (V - notch) / notch).
//   5. Time scale: × time.
// Buffer detection: if gelBuffer == TAE, use curveBaseTAE (0.07); else curveBase (0.05).
// The C++ "TEST buffers" branch (GelSim.cpp:130-136) is wrapped in `if ((0))` and stays disabled here.

import { GEL_SIM_TUNING } from '../../data/tuning';
import { bufferEquals, BUFFER_TAE, type Buffer } from './buffer';

export interface SimContext {
  voltage:      number;   // V; default notch = 70
  time:         number;   // 0..1 normalized
  ySpaceScale:  number;   // pixel height of usable lane area
  wellDamage:   number;   // 0..1
  gelBuffer:    Buffer;
  sampleBuffer: Buffer;
}

export interface DegradeFrac { lo: number; hi: number; }
export interface DegradeBP   { lo: number; hi: number; }

/**
 * As degrade goes 0..1, lo (band's y2 / lower end) grows toward 1 (band shrinks at the lo end).
 * As degrade goes 1..2, hi (band's y1 / upper end) grows toward 1.
 */
export function calcDegradeAsFrac(degrade: number): DegradeFrac {
  const lo = Math.min(1, degrade);
  const hi = degrade > 1 ? Math.min(1, degrade - 1) : 0;
  return { lo, hi };
}

/** Scale degradation fractions to BP counts; floor at 1 to avoid degenerate zero-bases. */
export function calcDegradeAsBP(degrade: number, bases: number): DegradeBP {
  const f = calcDegradeAsFrac(degrade);
  return {
    lo: Math.max(1, Math.round(f.lo * bases)),
    hi: Math.max(1, Math.round(f.hi * bases)),
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function calcDeltaY(
  bases: number,
  aggregation: number,
  aspectRatio: number,
  ctx: SimContext,
): number {
  const T = GEL_SIM_TUNING;
  const curveBase = bufferEquals(ctx.gelBuffer, BUFFER_TAE) ? T.deltaY.curveBaseTAE : T.deltaY.curveBase;
  const curveExp = T.deltaY.curveExp;
  const aspectRatioMax = T.aspectRatioMax;
  const aspectRatioScale = T.deltaY.aspectRatioScale;
  const baseCountHigh = T.baseCountHigh;
  const notch = T.voltageNotch;

  // 1. size, normalized
  let y = (bases * aggregation) / baseCountHigh;
  y = clamp(y, 0, 1);

  // 2. aspect ratio (subtractive, time-dependent)
  const aspectDelta = ((aspectRatio - 1) / aspectRatioMax) * aspectRatioScale;
  y -= aspectDelta * ctx.time;

  // (TEST buffers branch in C++ is disabled — `if ((0))` — skip)

  // 3. curve
  y = curveBase + Math.pow(1 - y, curveExp);

  // 4. voltage
  const vn = (ctx.voltage - notch) / notch;
  y *= (1 + vn);

  // 5. time
  y *= ctx.time;

  return y;
}
```

- [ ] **Step 3: Run tests + full suite**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: typecheck clean, 56 + 14 = 70/70 unit tests.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/sim/mobility.ts ts/tests/unit/mobility.test.ts
git commit -m "feat(sim): degrade helpers + calcDeltaY mobility curve (port from GelSim.cpp)"
```

---

### Task 7: Brightness (calcBandAlpha)

**Files:**
- Create: `ts/src/lib/sim/brightness.ts`
- Test: `ts/tests/unit/brightness.test.ts`

C++ reference: `GelSim.cpp` lines 192-225. `a = clamp(mass/massHigh, 0,1)`, dim by `sqrt(degrade/2)`, then raise to `^0.75`.

- [ ] **Step 1: Write `ts/tests/unit/brightness.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { calcBandAlpha } from '../../src/lib/sim/brightness';

describe('calcBandAlpha', () => {
  it('mass=0 → 0', () => {
    expect(calcBandAlpha(0, 0)).toBe(0);
  });
  it('mass=massHigh, no degrade → 1', () => {
    expect(calcBandAlpha(175, 0)).toBeCloseTo(1, 6);
  });
  it('clamps mass above massHigh → 1 (no degrade)', () => {
    expect(calcBandAlpha(500, 0)).toBeCloseTo(1, 6);
  });
  it('mass=massHigh, full degrade=2 → 0', () => {
    // d = sqrt(2/2) = 1; a *= (1-1) = 0; pow(0, .75) = 0
    expect(calcBandAlpha(175, 2)).toBe(0);
  });
  it('half mass, no degrade: pow(0.5, 0.75) ≈ 0.5946', () => {
    expect(calcBandAlpha(87.5, 0)).toBeCloseTo(Math.pow(0.5, 0.75), 6);
  });
  it('full mass, degrade=1 → pow(0.2929, 0.75) ≈ 0.398', () => {
    // d = sqrt(0.5) ≈ 0.7071; a = 1 × (1 - 0.7071) ≈ 0.2929; pow(.2929, .75) ≈ 0.398
    const expected = Math.pow(1 - Math.sqrt(0.5), 0.75);
    expect(calcBandAlpha(175, 1)).toBeCloseTo(expected, 6);
  });
});
```

- [ ] **Step 2: Run, confirm fails. Write `ts/src/lib/sim/brightness.ts`**

```ts
// Port of ~/code/gelbox/src/GelSim.cpp:192-225 (the live branch; the commented-out
// "diffuseScale via area ratio" tail at lines 206-224 stays disabled in the port).

import { GEL_SIM_TUNING } from '../../data/tuning';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Returns the band's overall brightness multiplier as a function of mass and
 * degradation. The output is clamped to [0,1]. Used as `Band.brightness` for
 * dye bands and as the `a` term in the fragment-band brightness assembly.
 */
export function calcBandAlpha(mass: number, degrade: number): number {
  let a = clamp(mass / GEL_SIM_TUNING.sampleMassHigh, 0, 1);
  const d = Math.sqrt(degrade / 2);
  a *= 1 - d;
  a = Math.pow(a, 0.75);
  return a;
}
```

- [ ] **Step 3: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: clean, 70 + 6 = 76/76.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/sim/brightness.ts ts/tests/unit/brightness.test.ts
git commit -m "feat(sim): calcBandAlpha for mass+degrade brightness curve"
```

---

### Task 8: Diffusion (blur)

**Files:**
- Create: `ts/src/lib/sim/diffusion.ts`
- Test: `ts/tests/unit/diffusion.test.ts`

C++ reference: `GelSim.cpp` lines 227-264. Two-piece curve: above 1500 bp linear ramp down, below 1500 bp inverse-curve up.

- [ ] **Step 1: Write `ts/tests/unit/diffusion.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { calcBandDiffusion } from '../../src/lib/sim/diffusion';
import type { SimContext } from '../../src/lib/sim/mobility';
import { BUFFER_TBE } from '../../src/lib/sim/buffer';

const CTX_DEFAULT: SimContext = {
  voltage: 70, time: 1, ySpaceScale: 1, wellDamage: 0,
  gelBuffer: BUFFER_TBE, sampleBuffer: BUFFER_TBE,
};

describe('calcBandDiffusion', () => {
  it('at 1500 bases (kThresh) → 1 + 2 = 3', () => {
    // bases=1500: enters else branch with v = 0/1500 = 0; baseline + threshAmount + 0 = 3
    // Actually wait — the else branch is bases <= kThresh. At bases===1500: bases > kThresh is false.
    // v = (1500-1500)/1500 = 0; v = 1 + 2 + (0 * 16) = 3
    expect(calcBandDiffusion(1500, 1, 1, CTX_DEFAULT)).toBeCloseTo(3, 6);
  });
  it('at 10000 bases (kUpperThresh) → max(1, 0+1) = 1', () => {
    // bases=10000 > kThresh: v = lmap(10000, 1500, 10000, 2, 0) = 0; v = max(0, 0) + 1 = 1
    expect(calcBandDiffusion(10000, 1, 1, CTX_DEFAULT)).toBeCloseTo(1, 6);
  });
  it('at 1bp (full tiny scale) → 1 + 2 + (1 * 16) = 19', () => {
    // bases=1: v = (1500-1)/1500 ≈ 1.0; v = 1 + 2 + (≈1 * 16) ≈ 19
    expect(calcBandDiffusion(1, 1, 1, CTX_DEFAULT)).toBeCloseTo(1 + 2 + ((1500 - 1) / 1500) * 16, 4);
  });
  it('voltage 0 → blur = max(1, 0) = 1 (clamped to baseline)', () => {
    // voltage normalizer = 0 → v *= 0 → 0; max(1, 0) = 1
    const v = calcBandDiffusion(1, 1, 1, { ...CTX_DEFAULT, voltage: 0 });
    expect(v).toBe(1);
  });
  it('time 0 → blur = max(1, 0) = 1', () => {
    expect(calcBandDiffusion(5000, 1, 1, { ...CTX_DEFAULT, time: 0 })).toBe(1);
  });
  it('voltage 140 (2x) doubles uncapped blur', () => {
    // base case bases=5000: v = lmap(5000, 1500, 10000, 2, 0) = 1.176... + baseline 1 = 2.176
    // voltage 140 doubles: 4.353
    const base = calcBandDiffusion(5000, 1, 1, CTX_DEFAULT);
    const dbl = calcBandDiffusion(5000, 1, 1, { ...CTX_DEFAULT, voltage: 140 });
    expect(dbl).toBeCloseTo(base * 2, 4);
  });
});
```

- [ ] **Step 2: Run, confirm fails. Write `ts/src/lib/sim/diffusion.ts`**

```ts
// Port of ~/code/gelbox/src/GelSim.cpp:227-264.
//
// Curve:
//   bases > 1500:   v = lmap(bases, 1500, 10000, 2, 0); clamped >= 0; + baseline=1
//   bases <= 1500:  v = (1500 - bases) / 1500;  v = 1 + 2 + v*16
// Then × time × |voltage|/notch; max(1, ...).
//
// Note: aggregation and aspectRatio are unused in the C++ implementation but kept
// in the signature to mirror the upstream API (called with concrete values from
// fragAggregateToBand / dyeToBand later).

import { GEL_SIM_TUNING } from '../../data/tuning';
import type { SimContext } from './mobility';

function lmap(v: number, inLo: number, inHi: number, outLo: number, outHi: number): number {
  const t = (v - inLo) / (inHi - inLo);
  return outLo + (outHi - outLo) * t;
}

export function calcBandDiffusion(
  bases: number,
  aggregation: number,
  aspectRatio: number,
  ctx: SimContext,
): number {
  void aggregation; void aspectRatio;  // unused — present in API for parity with C++
  const D = GEL_SIM_TUNING.diffusion;
  let v: number;
  if (bases > D.thresh) {
    v = lmap(bases, D.thresh, D.upperThresh, D.threshAmount, 0);
    v = Math.max(0, v);
    v += D.baseline;
  } else {
    const t = (D.thresh - bases) / D.thresh;
    v = D.baseline + D.threshAmount + t * D.tinyScale;
  }
  v *= ctx.time;
  v *= Math.abs(ctx.voltage) / GEL_SIM_TUNING.voltageNotch;
  return Math.max(1, v);
}
```

- [ ] **Step 3: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: clean, 76 + 6 = 82/82.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/sim/diffusion.ts ts/tests/unit/diffusion.test.ts
git commit -m "feat(sim): calcBandDiffusion (two-piece blur curve)"
```

---

### Task 9: Geometry + flames + seeds

**Files:**
- Create: `ts/src/lib/sim/geometry.ts`
- Test: `ts/tests/unit/geometry.test.ts`

C++ reference: `GelSim.cpp` lines 153-190 (calcFlames, calcRandSeed, calcWellDamageRandSeed) and 266-315 (calcBandGeometry). `calcBandGeometry` takes a partially-filled Band, deltaY1/2 from the mobility, and produces `rect`, `smearAbove`, `smearBelow`, `flameHeight`, `smileHeight`, `smileExp` populated.

- [ ] **Step 1: Write `ts/tests/unit/geometry.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { calcFlames, calcBandGeometry } from '../../src/lib/sim/geometry';
import type { SimContext } from '../../src/lib/sim/mobility';
import { BUFFER_TBE, BUFFER_H2O } from '../../src/lib/sim/buffer';

const CTX_DEFAULT: SimContext = {
  voltage: 70, time: 1, ySpaceScale: 1, wellDamage: 0,
  gelBuffer: BUFFER_TBE, sampleBuffer: BUFFER_TBE,
};

describe('calcFlames', () => {
  it('mass below 140 ng (overload threshold) → 0', () => {
    expect(calcFlames(100)).toBe(0);
    expect(calcFlames(140)).toBe(0);  // exactly at threshold
  });
  it('mass at sampleMassHigh=175 → 2 (max scale)', () => {
    expect(calcFlames(175)).toBeCloseTo(2, 6);
  });
  it('halfway between 140 and 175 = 157.5 → 1', () => {
    expect(calcFlames(157.5)).toBeCloseTo(1, 6);
  });
});

describe('calcBandGeometry', () => {
  it('places band at wellRect + deltaY (pixel space) with no inflate at fatness=1', () => {
    const wellRect = { x1: 50, y1: 10, x2: 60, y2: 20 };
    const out = calcBandGeometry(CTX_DEFAULT, {
      wellRect, deltaY1: 100, deltaY2: 100, fatness: 1,
    });
    expect(out.rect).toEqual({ x1: 50, y1: 110, x2: 60, y2: 120 });
    expect(out.smearBelow).toBe(0);  // (wellRect.y2 + deltaY2) - rect.y2 = (20+100) - 120 = 0
    expect(out.smearAbove).toBe(0);
  });
  it('inflates rect vertically when fatness > 1 (and time > 0)', () => {
    const wellRect = { x1: 50, y1: 10, x2: 60, y2: 20 };  // height 10
    const out = calcBandGeometry(CTX_DEFAULT, {
      wellRect, deltaY1: 100, deltaY2: 100, fatness: 1.5,
    });
    // inflate amount = (1.5 - 1) * 1 (time) * 0.5 * 10 = 2.5; applied to both y1 and y2 outward
    expect(out.rect.y1).toBeCloseTo(110 - 2.5, 6);
    expect(out.rect.y2).toBeCloseTo(120 + 2.5, 6);
  });
  it('H2O buffer: smearAbove gets bumped to rect.height × 6 (then clipped to wellRect gap)', () => {
    const wellRect = { x1: 50, y1: 10, x2: 60, y2: 20 };
    const out = calcBandGeometry({ ...CTX_DEFAULT, gelBuffer: BUFFER_H2O }, {
      wellRect, deltaY1: 200, deltaY2: 200, fatness: 1,
    });
    // rect at y1=210, y2=220, height 10. smearAbove = max(0, 10*6) = 60.
    // Clip: rect.y1 - wellRect.y2 = 210 - 20 = 190. min(60, 190) = 60. ✓
    expect(out.smearAbove).toBe(60);
  });
  it('H2O smearAbove gets clipped when band is close to well bottom', () => {
    const wellRect = { x1: 50, y1: 10, x2: 60, y2: 20 };
    const out = calcBandGeometry({ ...CTX_DEFAULT, gelBuffer: BUFFER_H2O }, {
      wellRect, deltaY1: 30, deltaY2: 30, fatness: 1,
    });
    // rect at y1=40, y2=50. smearAbove = max(0, 10*6) = 60.
    // Clip: rect.y1 - wellRect.y2 = 40 - 20 = 20. min(60, 20) = 20.
    expect(out.smearAbove).toBe(20);
  });
  it('smearBelow extends down by (wellRect.y2 + deltaY2 - rect.y2)', () => {
    const wellRect = { x1: 50, y1: 10, x2: 60, y2: 20 };
    const out = calcBandGeometry(CTX_DEFAULT, {
      wellRect, deltaY1: 100, deltaY2: 130, fatness: 1,
    });
    // (20 + 130) - 120 = 30
    expect(out.smearBelow).toBe(30);
  });
  it('ySpaceScale multiplies deltaY values (handled by caller, but test the API contract)', () => {
    // calcBandGeometry expects deltaY already pre-scaled by ySpaceScale (caller responsibility)
    // This test pins the contract by passing pre-scaled values.
    const wellRect = { x1: 50, y1: 10, x2: 60, y2: 20 };
    const out = calcBandGeometry({ ...CTX_DEFAULT, ySpaceScale: 2 }, {
      wellRect, deltaY1: 200, deltaY2: 200, fatness: 1,  // 100 × 2 = 200, caller did the multiply
    });
    expect(out.rect.y1).toBe(210);
  });
});
```

- [ ] **Step 2: Run, confirm fails. Write `ts/src/lib/sim/geometry.ts`**

```ts
// Port of ~/code/gelbox/src/GelSim.cpp:153-190 (flames + seeds) and 266-315 (geometry).
//
// calcBandGeometry takes pre-scaled deltaY values (caller multiplies by ySpaceScale).
// It returns the geometry-related fields a Band would have post-mobility, BEFORE the
// flames/smile/randSeed assembly which depends on rect.height — those happen in gelSim.ts.
//
// The wellDamage smear-up branch (C++ lines 300-303) is commented out in the C++; we keep
// it disabled here. The UI rect (b.mUIRect) is for hit-testing and not rendered, so we
// don't compute it in the TS port — the renderer only reads `rect`, `smearAbove`, `smearBelow`,
// `flameHeight`.

import { GEL_SIM_TUNING } from '../../data/tuning';
import type { Rect } from './band';
import type { SimContext } from './mobility';
import { bufferEquals, BUFFER_H2O } from './buffer';

export interface GeometryInput {
  wellRect: Rect;
  deltaY1:  number;  // pre-scaled by ctx.ySpaceScale
  deltaY2:  number;  // pre-scaled by ctx.ySpaceScale
  fatness:  number;  // wellToHeightScale (1.5) or wellToDyeHeightScale (3)
}

export interface GeometryOutput {
  rect:        Rect;
  smearAbove:  number;
  smearBelow:  number;
}

export function calcBandGeometry(ctx: SimContext, input: GeometryInput): GeometryOutput {
  const { wellRect, deltaY1, deltaY2, fatness } = input;

  // Move
  let y1 = wellRect.y1 + deltaY1;
  let y2 = wellRect.y2 + deltaY1;

  // Inflate (vertical only)
  const fatscale = ctx.time;
  const height = y2 - y1;
  const inflateAmt = (fatness - 1) * fatscale * 0.5 * height;
  y1 -= inflateAmt;
  y2 += inflateAmt;

  const rect: Rect = { x1: wellRect.x1, y1, x2: wellRect.x2, y2 };

  // Smear below: distance from rect.y2 down to wellRect.y2 + deltaY2.
  const smearBelow = (wellRect.y2 + deltaY2) - rect.y2;

  // Smear above: H2O bumps it to rect.height × 6 (clipped to fit between band and well bottom).
  let smearAbove = 0;  // C++ default Band has smearAbove=0 unless something sets it
  if (bufferEquals(ctx.gelBuffer, BUFFER_H2O)) {
    smearAbove = Math.max(smearAbove, (rect.y2 - rect.y1) * GEL_SIM_TUNING.smearUpWithH2O);
  }
  // (wellDamage smear-up disabled in C++ — skip)

  // Clip smear above with well bottom
  smearAbove = Math.min(smearAbove, rect.y1 - wellRect.y2);
  smearAbove = Math.max(0, smearAbove);  // clip negative if band is above well (shouldn't happen normally)

  return { rect, smearAbove, smearBelow };
}

/**
 * Flame height scale, applied as: flameHeight = rect.height × calcFlames(mass).
 * Returns 0 below the overload threshold (140 ng), ramping linearly to 2× at 175 ng.
 */
export function calcFlames(mass: number): number {
  const overloadThresh = GEL_SIM_TUNING.flames.overloadThreshFrac * GEL_SIM_TUNING.sampleMassHigh;
  if (mass <= overloadThresh) return 0;
  const t = (mass - overloadThresh) / (GEL_SIM_TUNING.sampleMassHigh - overloadThresh);
  return t * GEL_SIM_TUNING.flames.maxScale;
}

/**
 * Deterministic seed derived from band metadata (lane, voltage, mass, rect.y1).
 * Mirrors the C++ formula at GelSim.cpp:171-183.
 */
export function calcRandSeed(lane: number, mass: number, voltage: number, rectY1: number): number {
  return (
    lane * 17 +
    Math.trunc(rectY1) +
    Math.trunc(voltage * 200) +
    Math.trunc(mass * 10)
  ) >>> 0;  // force to uint32
}

export function calcWellDamageRandSeed(lane: number): number {
  return (lane * 23) >>> 0;
}
```

- [ ] **Step 3: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: clean, 82 + 9 = 91/91.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/sim/geometry.ts ts/tests/unit/geometry.test.ts
git commit -m "feat(sim): geometry helpers — calcBandGeometry, calcFlames, randSeeds"
```

---

### Task 10: GelSim entry point — fragToBands

**Files:**
- Create: `ts/src/lib/sim/gelSim.ts`
- Test: `ts/tests/unit/gelSim.test.ts`

C++ reference: `GelSim.cpp` lines 317-473. Three sub-functions: `dyeToBand`, `fragAggregateToBand`, `fragToBands` (dispatch).

- [ ] **Step 1: Write `ts/tests/unit/gelSim.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { fragToBands } from '../../src/lib/sim/gelSim';
import type { SimContext } from '../../src/lib/sim/mobility';
import type { Sample } from '../../src/lib/sim/sample';
import { BUFFER_TBE } from '../../src/lib/sim/buffer';

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
    expect(bands[0].color).toEqual([1, 1, 1]);  // fragment bands always emit white tint; per-band color is for picking
  });
  it('fragment with [0,1,0,2] aggregate → 2 bands (dimer 1/3 mass + tetramer 2/3 mass)', () => {
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
```

- [ ] **Step 2: Run, confirm fails. Write `ts/src/lib/sim/gelSim.ts`**

```ts
// Port of ~/code/gelbox/src/GelSim.cpp:317-473 (dyeToBand, fragAggregateToBand, fragToBands).
//
// fragToBands is the public entry. It dispatches by fragment type:
//   - mDye >= 0 + mass > 0:       single dye band
//   - empty aggregate or sum == 0: single monomer band
//   - else:                       one band per nonzero aggregate entry

import type { Band } from './band';
import type { SimContext } from './mobility';
import type { Sample, Fragment } from './sample';
import type { Rect } from './band';
import { GEL_SIM_TUNING } from '../../data/tuning';
import { calcDeltaY, calcDegradeAsBP } from './mobility';
import { calcBandAlpha } from './brightness';
import { calcBandDiffusion } from './diffusion';
import { calcBandGeometry, calcFlames, calcRandSeed, calcWellDamageRandSeed } from './geometry';
import { aggregateSum } from './aggregate';
import { DYE_BP_LO, DYE_COLORS, isValidDye } from './dye';

export type { SimContext } from './mobility';

function dyeToBand(lane: number, dye: number, mass: number, ctx: SimContext, wellRect: Rect): Band {
  if (!isValidDye(dye)) throw new Error(`invalid dye index: ${dye}`);

  const bases = DYE_BP_LO[dye];
  const aggregate = 1;
  const aspectRatio = 1;

  // Dye bands diffuse like a 1bp fragment (max blur).
  const blur = Math.round(calcBandDiffusion(1, 1, 1, ctx));

  // Mobility (uses dye's BP_LO as the position; no degrade)
  const deltaY = calcDeltaY(bases, aggregate, aspectRatio, ctx) * ctx.ySpaceScale;
  const geom = calcBandGeometry(ctx, {
    wellRect, deltaY1: deltaY, deltaY2: deltaY, fatness: GEL_SIM_TUNING.wellToDyeHeightScale,
  });

  // Dye bands have NO flames, NO smile, NO welldamage (matches C++ "Disabled by SD").
  return {
    rect: geom.rect,
    smearAbove: geom.smearAbove,
    smearBelow: geom.smearBelow,
    smearBrightnessAbove: [1, 0],
    smearBrightnessBelow: [1, 0],
    flameHeight: 0,
    smileHeight: 0,
    smileExp: 0,
    blur,
    brightness: calcBandAlpha(mass, 0),
    color: DYE_COLORS[dye],
    randSeed: 0,
    wellDamage: 0,
    wellDamageRandSeed: 0,
  };
}

function fragAggregateToBand(
  lane: number, frag: Fragment, aggregate: number, massScale: number,
  ctx: SimContext, wellRect: Rect,
): Band {
  if (aggregate <= 0) throw new Error(`aggregate must be > 0, got ${aggregate}`);

  const mass = frag.mass * massScale;
  const { lo: degradeLo, hi: degradeHi } = calcDegradeAsBP(frag.degrade, frag.bases);
  const blur = Math.round(calcBandDiffusion(frag.bases, aggregate, frag.aspectRatio, ctx));

  // Mobility: y1 from (bases - degradeHi), y2 from (bases - degradeLo)
  const deltaY1 = calcDeltaY(frag.bases - degradeHi, aggregate, frag.aspectRatio, ctx) * ctx.ySpaceScale;
  const deltaY2 = calcDeltaY(frag.bases - degradeLo, aggregate, frag.aspectRatio, ctx) * ctx.ySpaceScale;
  const geom = calcBandGeometry(ctx, {
    wellRect, deltaY1, deltaY2, fatness: GEL_SIM_TUNING.wellToHeightScale,
  });
  const height = geom.rect.y2 - geom.rect.y1;

  // Brightness assembly (C++ GelSim.cpp:376-383)
  const a = calcBandAlpha(mass, frag.degrade);
  const d = frag.degrade / 2;
  const brightness = Math.sqrt(a * (1 - d));
  const smearBrightnessBelowNear = Math.sqrt(a * d);
  // smearBrightnessAbove[0] starts at default 1, multiplied by brightness (C++: `*=`)
  const smearBrightnessAboveNear = 1 * brightness;

  // Seeds + smile + flames depend on rect, computed AFTER calcBandGeometry
  const randSeed = calcRandSeed(lane, mass, ctx.voltage, geom.rect.y1);
  const wellDamageRandSeed = calcWellDamageRandSeed(lane);
  const smileHeight = height * 0.35;
  const smileExp = 4;
  const flameHeight = height * calcFlames(mass);

  return {
    rect: geom.rect,
    smearAbove: geom.smearAbove,
    smearBelow: geom.smearBelow,
    smearBrightnessAbove: [smearBrightnessAboveNear, 0],
    smearBrightnessBelow: [smearBrightnessBelowNear, 0],
    flameHeight,
    smileHeight,
    smileExp,
    blur,
    brightness,
    color: [1, 1, 1],  // fragment bands always emit white; per-fragment color is metadata, applied at composite
    randSeed,
    wellDamage: ctx.wellDamage,
    wellDamageRandSeed,
  };
}

export function fragToBands(
  sample: Sample, fragi: number, wellRect: Rect, lane: number, ctx: SimContext,
): Band[] {
  const frag = sample.fragments[fragi];
  if (!frag) throw new Error(`fragi out of range: ${fragi}`);

  if (frag.dye >= 0) {
    if (frag.mass <= 0) return [];
    return [dyeToBand(lane, frag.dye, frag.mass, ctx, wellRect)];
  }

  const asum = aggregateSum(frag.aggregate);
  if (frag.aggregate.length === 0 || asum === 0) {
    return [fragAggregateToBand(lane, frag, 1, 1, ctx, wellRect)];
  }

  const result: Band[] = [];
  for (let m = 0; m < frag.aggregate.length; m++) {
    const w = frag.aggregate[m];
    if (w > 0) {
      const massScale = w / asum;
      result.push(fragAggregateToBand(lane, frag, m + 1, massScale, ctx, wellRect));
    }
  }
  return result;
}
```

- [ ] **Step 3: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: clean, 91 + 9 = 100/100.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/sim/gelSim.ts ts/tests/unit/gelSim.test.ts
git commit -m "feat(sim): fragToBands entry point + dye/fragAggregate dispatch"
```

---

### Task 11: 1 kb ladder fixture

**Files:**
- Create: `ts/scripts/gen-ladder-1kb.mjs`
- Create: `ts/fixtures/states/ladder-1kb.json`

A canonical sample fixture. 10 fragments at 100, 200, 400, 800, 1600, 3200, 6400, ... covering the full mobility range. Single lane. Default TBE buffer. Mass 50 ng each.

The script generates the JSON deterministically; commit both the script and its output.

- [ ] **Step 1: Write `ts/scripts/gen-ladder-1kb.mjs`**

```js
// Generates fixtures/states/ladder-1kb.json — a canonical sample fixture
// representing a 1 kb ladder spanning 100 bp to 12800 bp, suitable for
// driving fragToBands and producing a recognizable Sample-driven scene.
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = resolve(__dirname, '..', 'fixtures', 'states', 'ladder-1kb.json');

const sizes = [100, 200, 400, 800, 1600, 3200, 6400, 9000, 12000, 13500];
const fragments = sizes.map((bp) => ({
  bases: bp,
  mass: 50,
  degrade: 0,
  dye: -1,
  aggregate: [],
  aspectRatio: 1,
  color: [1, 1, 1],
}));

const fixture = {
  schema: 'gel-sample-v0',
  // Buffer: TBE 0.5×
  buffer: { tris: 44.5, borate: 44.5, acetate: 0, edta: 1 },
  fragments,
};

writeFileSync(out, JSON.stringify(fixture, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${out} (${fragments.length} fragments)`);
```

- [ ] **Step 2: Run the generator**

```bash
cd /Users/shawn/code/gel/ts && node scripts/gen-ladder-1kb.mjs
ls -la fixtures/states/ladder-1kb.json
```

Expected: file exists, 10 fragments, valid JSON.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/scripts/gen-ladder-1kb.mjs ts/fixtures/states/ladder-1kb.json
git commit -m "feat(fixtures): 1kb ladder Sample fixture (10 fragments, TBE 0.5x)"
```

---

### Task 12: DevSimPage route

**Files:**
- Create: `ts/src/routes/DevSimPage.tsx`
- Modify: `ts/src/App.tsx`

Renders the ladder-1kb sample by computing bands via `fragToBands` and passing them to either GelRenderer (WebGPU) or GlGelRenderer (WebGL2). Mirrors `DevMultiPage` shape — `mountWebGpu` + `mountWebGl2` helpers, `selectBackend()` dispatch.

Sim context: voltage=70, time=0.5, ySpaceScale = 240 - 2*15 - 12*0.2 = 207.6 (gel height − margins − partial lane width). wellRect at the top of the canvas. Single lane (lane=0).

- [ ] **Step 1: Read** `ts/src/routes/DevMultiPage.tsx` to see the canonical mount pattern (it already dispatches on backend, blits composite → canvas, etc).

- [ ] **Step 2: Write `ts/src/routes/DevSimPage.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { selectBackend } from '../lib/gel/backend';
import type { Sample } from '../lib/sim/sample';
import type { Band } from '../lib/sim/band';
import type { SimContext } from '../lib/sim/gelSim';

type BootState =
  | { status: 'pending' }
  | { status: 'ready' }
  | { status: 'error'; message: string };

const GEL_SIZE = { width: 320, height: 240 };
const PIXELS_PER_UNIT = 1;

export function DevSimPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [boot, setBoot] = useState<BootState>({ status: 'pending' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let rendererGpu: ReturnType<typeof import('../lib/gel/render').createGelRenderer> | null = null;
    let rendererGl: ReturnType<typeof import('../lib/gel/render-gl').createGlGelRenderer> | null = null;

    (async () => {
      try {
        const sample: Sample = (await import('../../fixtures/states/ladder-1kb.json')).default;
        canvas.width = GEL_SIZE.width * PIXELS_PER_UNIT;
        canvas.height = GEL_SIZE.height * PIXELS_PER_UNIT;

        // Compute bands via the sim
        const { fragToBands } = await import('../lib/sim/gelSim');
        const ctx: SimContext = {
          voltage: 70, time: 0.5, ySpaceScale: 200,
          wellDamage: 0, gelBuffer: sample.buffer, sampleBuffer: sample.buffer,
        };
        const wellRect = { x1: 140, y1: 8, x2: 180, y2: 18 };  // single centered well
        const bands: Band[] = [];
        for (let i = 0; i < sample.fragments.length; i++) {
          bands.push(...fragToBands(sample, i, wellRect, 0, ctx));
        }

        const backend = selectBackend();
        if (backend === 'webgl2') {
          await mountWebGl2(canvas, bands, () => cancelled, (r) => { rendererGl = r; });
        } else {
          await mountWebGpu(canvas, bands, () => cancelled, (r) => { rendererGpu = r; });
        }
        if (!cancelled) setBoot({ status: 'ready' });
      } catch (err) {
        if (!cancelled) setBoot({ status: 'error', message: (err as Error).message });
      }
    })();

    return () => {
      cancelled = true;
      rendererGpu?.destroy();
      rendererGl?.destroy();
    };
  }, []);

  return (
    <section style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Dev / Sim</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>
        1 kb ladder rendered by GelSim → GelRenderer pipeline.
      </p>
      <div data-testid="renderer-status" style={{ margin: '12px 0', color: 'var(--color-ink-muted)' }}>
        {boot.status === 'error' ? `boot error: ${boot.message}` : `renderer: ${boot.status}`}
      </div>
      <canvas
        ref={canvasRef}
        data-testid="gel-canvas"
        style={{ width: '320px', height: '240px', display: 'block', border: '1px solid var(--color-grid)', imageRendering: 'pixelated' }}
      />
    </section>
  );
}

async function mountWebGpu(
  canvas: HTMLCanvasElement,
  bands: Band[],
  isCancelled: () => boolean,
  onRenderer: (r: ReturnType<typeof import('../lib/gel/render').createGelRenderer>) => void,
): Promise<void> {
  const { requestDevice } = await import('../lib/gpu/device');
  const { configureContext } = await import('../lib/gpu/context');
  const { device, queue } = await requestDevice();
  if (isCancelled()) return;
  const { context, format } = configureContext(canvas, device);

  const [
    { createGelRenderer },
    { createQuad },
    { createShaderModule },
    { createUniformBuffer },
    passVertSrc,
    gelPassthroughSrc,
  ] = await Promise.all([
    import('../lib/gel/render'),
    import('../lib/gpu/quad'),
    import('../lib/gpu/shader'),
    import('../lib/gpu/uniforms'),
    import('../shaders/passthrough.vert.wgsl?raw'),
    import('../shaders/gel-passthrough.frag.wgsl?raw'),
  ]);

  const renderer = createGelRenderer(device, GEL_SIZE, PIXELS_PER_UNIT);
  renderer.setBands(bands);
  renderer.render();
  if (isCancelled()) return;
  onRenderer(renderer);

  // Same blit pipeline as DevMultiPage / DevPage
  const quad = createQuad(device);
  const vs = createShaderModule(device, passVertSrc.default, 'passthrough.vert');
  const fs = createShaderModule(device, gelPassthroughSrc.default, 'gel-passthrough.frag');
  const bgl = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX,   buffer:  { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
    ],
  });
  const pipeline = device.createRenderPipeline({
    label: 'sim-blit',
    layout: device.createPipelineLayout({ bindGroupLayouts: [bgl] }),
    vertex: { module: vs, entryPoint: 'vs_main', buffers: [quad.layout] },
    fragment: { module: fs, entryPoint: 'fs_main', targets: [{ format }] },
    primitive: { topology: 'triangle-strip' },
  });
  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' });
  const uPass = createUniformBuffer(device, 48, 'sim-blit-pass-uniforms');
  const dv = uPass.view, w = canvas.width, h = canvas.height;
  dv.setFloat32(0,  0, true); dv.setFloat32(4,  0, true);
  dv.setFloat32(8,  w, true); dv.setFloat32(12, h, true);
  dv.setFloat32(16, 0, true); dv.setFloat32(20, 0, true);
  dv.setFloat32(24, 1, true); dv.setFloat32(28, 1, true);
  dv.setFloat32(32, w, true); dv.setFloat32(36, h, true);
  dv.setFloat32(40, 0, true); dv.setFloat32(44, 0, true);
  uPass.upload(queue);
  const bg = device.createBindGroup({
    layout: bgl,
    entries: [
      { binding: 0, resource: { buffer: uPass.buffer } },
      { binding: 1, resource: renderer.output.view },
      { binding: 2, resource: sampler },
    ],
  });
  const enc = device.createCommandEncoder();
  const pass = enc.beginRenderPass({
    colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }],
  });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bg);
  pass.setVertexBuffer(0, quad.buffer);
  pass.draw(quad.vertexCount);
  pass.end();
  queue.submit([enc.finish()]);
}

async function mountWebGl2(
  canvas: HTMLCanvasElement,
  bands: Band[],
  isCancelled: () => boolean,
  onRenderer: (r: ReturnType<typeof import('../lib/gel/render-gl').createGlGelRenderer>) => void,
): Promise<void> {
  const { configureGl2Context } = await import('../lib/gpu/gl/context');
  const { gl } = configureGl2Context(canvas);
  if (isCancelled()) return;

  const [
    { createGlGelRenderer },
    { createGlProgram },
    { createGlQuad, bindQuadAttribs },
    passthroughVertSrc,
    gelPassthroughSrc,
  ] = await Promise.all([
    import('../lib/gel/render-gl'),
    import('../lib/gpu/gl/program'),
    import('../lib/gpu/gl/quad'),
    import('../shaders/passthrough.vert.glsl?raw'),
    import('../shaders/gel-passthrough.frag.glsl?raw'),
  ]);

  const renderer = createGlGelRenderer(gl, GEL_SIZE, PIXELS_PER_UNIT);
  renderer.setBands(bands);
  renderer.render();
  if (isCancelled()) return;
  onRenderer(renderer);

  const blit = createGlProgram(gl, passthroughVertSrc.default, gelPassthroughSrc.default, 'gl-blit');
  const quad = createGlQuad(gl);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(blit.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, renderer.output.texture);
  gl.uniform1i(blit.uniform('uTex0'), 0);
  gl.uniform2f(blit.uniform('uPositionOffset'), 0, 0);
  gl.uniform2f(blit.uniform('uPositionScale'), GEL_SIZE.width, GEL_SIZE.height);
  gl.uniform2f(blit.uniform('uTexCoordOffset'), 0, 0);
  gl.uniform2f(blit.uniform('uTexCoordScale'), 1, 1);
  gl.uniform2f(blit.uniform('uGelSize'), GEL_SIZE.width, GEL_SIZE.height);
  bindQuadAttribs(gl, quad.buffer, blit.attrib('aPos'), blit.attrib('aTexCoord'));
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
```

- [ ] **Step 3: Register the route in `ts/src/App.tsx`**

Add the import alongside the other dev page imports, and the route alongside the other `dev/...` routes:

```tsx
import { DevSimPage } from './routes/DevSimPage';
// ...
<Route path="dev/sim" element={<DevSimPage />} />
```

- [ ] **Step 4: Verify dev server boots**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run dev > /tmp/m5-task12-dev.log 2>&1 &
SERVE_PID=$!
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
kill $SERVE_PID 2>/dev/null
wait $SERVE_PID 2>/dev/null
```

Expected: 200.

- [ ] **Step 5: Run typecheck + existing visuals**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit && npx playwright test --project chromium-webgpu smoke.spec.ts single-band.spec.ts multi-band.spec.ts
```

Expected: clean, 100/100 unit, 7/7 chromium-webgpu visual (5 smoke + single-band + multi-band).

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/routes/DevSimPage.tsx ts/src/App.tsx
git commit -m "feat(dev): /dev/sim route — Sample → fragToBands → GelRenderer pipeline"
```

---

### Task 13: Playwright golden for sim-driven scene

**Files:**
- Create: `ts/tests/visual/sim-ladder.spec.ts`
- Create (auto-generated): `sim-ladder.spec.ts-snapshots/sim-ladder-canvas-chromium-webgpu.png`
- Create (auto-generated): `sim-ladder.spec.ts-snapshots/sim-ladder-canvas-chromium-webgl2.png`

Per-backend golden, mirroring the multi-band spec pattern.

- [ ] **Step 1: Write `ts/tests/visual/sim-ladder.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  const backend = testInfo.project.name === 'chromium-webgl2' ? 'webgl2' : 'webgpu';
  await page.addInitScript((b: string) => { localStorage.setItem('gelBackend', b); }, backend);
});

test('1kb ladder — sim-driven golden frame', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/dev/sim');
  await expect(page.getByTestId('renderer-status')).toHaveText('renderer: ready');
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
  const canvas = page.getByTestId('gel-canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveScreenshot('sim-ladder-canvas.png', {
    maxDiffPixelRatio: 0.02,
  });
});
```

- [ ] **Step 2: Generate baselines for both backends**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npx playwright test sim-ladder.spec.ts --update-snapshots
```

Expected: 2 passes (one per project on macOS), 2 PNG files generated under `sim-ladder.spec.ts-snapshots/`.

- [ ] **Step 3: Inspect baselines visually**

Open the generated PNGs in an image viewer (or use the centroid analysis pattern from M4). Both backends should depict ~10 distinct horizontal bands distributed vertically across the canvas — small fast-moving fragments near the bottom, large slow-moving fragments near the top. Variation across band width, thickness, and brightness is normal (mass × mobility curve).

If the WebGL2 baseline doesn't visually match the WebGPU baseline within "same scene, slightly different sampling", STOP — the M4 fix has regressed somehow.

```bash
ls -la tests/visual/sim-ladder.spec.ts-snapshots/
file tests/visual/sim-ladder.spec.ts-snapshots/*.png
```

- [ ] **Step 4: Lock baselines (clean re-run)**

```bash
cd /Users/shawn/code/gel/ts && npx playwright test sim-ladder.spec.ts
```

Expected: 2 passes on macOS.

- [ ] **Step 5: Run full Playwright suite**

```bash
cd /Users/shawn/code/gel/ts && npx playwright test
```

Expected: 18/18 on macOS (existing 16 + 2 new from sim-ladder).

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/tests/visual/sim-ladder.spec.ts ts/tests/visual/sim-ladder.spec.ts-snapshots
git commit -m "test(visual): per-backend goldens for sim-driven 1kb ladder scene"
```

---

### Task 14: Mark M5 done, tag, verify CI

**Files:**
- Modify: `docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md`

- [ ] **Step 1: Mark M5 done in the overview**

In `docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md`:

a) In the milestones table, M5 row:

OLD: `| M5 | GelSim + state pipeline | ... | TBW after M4 | Week 4 |`
NEW: `| M5 | GelSim + state pipeline | Voltage/time/buffer/lane sliders drive band positions correctly; goldens exist for canonical states | [`m5-gelsim.md`](2026-04-30-gelbox-ts-m5-gelsim.md) | Week 4 |`

b) Sub-plans section:

OLD: `- [ ] **M5 GelSim + state pipeline** — TBW after M4`
NEW: `- [x] **M5 GelSim + state pipeline** — [`2026-04-30-gelbox-ts-m5-gelsim.md`](2026-04-30-gelbox-ts-m5-gelsim.md)`

- [ ] **Step 2: Run full local CI green check**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run typecheck && npm run test:unit && npm run build
```

Then Playwright per-project to avoid GPU contention flakes:

```bash
cd /Users/shawn/code/gel/ts && npx playwright test --project chromium-webgpu
cd /Users/shawn/code/gel/ts && npx playwright test --project chromium-webgl2
```

Expected:
- typecheck clean
- 100/100 unit
- build succeeds
- chromium-webgpu: 9/9 (5 smoke + single-band + multi-band + perf + sim-ladder) on macOS
- chromium-webgl2: 9/9 on macOS

- [ ] **Step 3: Commit, push, tag**

```bash
cd /Users/shawn/code/gel
git add docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md
git commit -m "docs(plan): mark M5 GelSim + state pipeline complete and link sub-plan"
git push origin main
git tag m5-gelsim
git push origin m5-gelsim
```

- [ ] **Step 4: Verify CI green**

```bash
cd /Users/shawn/code/gel
RUN_ID=$(gh run list --workflow=ci.yml --limit 1 --json databaseId --jq '.[0].databaseId')
echo "Watching run $RUN_ID"
until gh run view "$RUN_ID" --json status --jq '.status' | grep -q '^completed$'; do
  sleep 30
  echo "Still running..."
done
gh run view "$RUN_ID"
```

Expected: success. On Linux, the WebGL2 sim-ladder spec runs and passes; the WebGPU sim-ladder spec skips. Total: 16 pass + 3 skip (existing 13 + 3 from M4 sim-related additions and existing skips).

If CI is red:
- WebGL2 baseline drift between Mac and Linux → bump `maxDiffPixelRatio` to 0.05 in `sim-ladder.spec.ts` (consistent with the M4 mitigation) and regenerate.
- Sim numerical issues (NaN, Infinity) → check `calcDeltaY` voltage math when `notch` happens to equal voltage exactly (vn = 0, scale = 1 — fine, but worth verifying).
- TypeScript build fails on JSON import shape mismatch → ensure the fixture's JSON shape matches the `Sample` interface (the test page does `(await import(...)).default as Sample`; if JSON has `schema` field that's tolerated since extra fields are allowed in TS structural typing).

---

## Self-review

**Spec coverage** (against M5 acceptance "Voltage/time/buffer/lane sliders drive band positions correctly; goldens exist for canonical states"):

- ✅ GelSim algorithm port — Tasks 6-10 cover mobility, brightness, diffusion, geometry, plus the `fragToBands` dispatcher.
- ✅ Voltage/time/buffer/lane drive band positions correctly — Verified by `mobility.test.ts` (voltage 0/70/140 → 0×/1×/2× scaling, time 0 → 0 deltaY, TAE buffer → curveBaseTAE, different lanes → different randSeeds).
- ⚠️ "Sliders" are NOT shipped in M5 — they're M6. The sim is fully driveable from any voltage/time/buffer/lane values; the dev page hard-codes them. Acceptance interpretation: the SIM API is correct; sliders connecting to it land in M6.
- ✅ Goldens exist for canonical states — Task 13 ships the 1 kb ladder golden in both backends. Future canonical states (TAE, H2O, voltage variants) are easy follow-ups via additional fixtures.

**Placeholder scan:** No `TBD`/`TODO`/"add appropriate"/"similar to Task N" markers. Every algorithmic step shows the C++ source line numbers and a complete TS port. Test cases use exact inputs and either hand-computed expected values (mobility, brightness, diffusion) or `toBeCloseTo` for floating-point comparisons.

**Type consistency:**
- `SimContext` declared in `mobility.ts`, re-exported by `gelSim.ts`, and consumed unchanged by `diffusion.ts`, `geometry.ts`, and the test files.
- `Sample`, `Fragment`, `Buffer`, `Aggregate` defined once and consumed by `gelSim.ts` and tests.
- Output `Band` matches the existing `lib/sim/band.ts` interface exactly. Verified by `gelSim.test.ts` checks of `smileExp`, `randSeed`, `wellDamageRandSeed`, `flameHeight`, `color`, `brightness` — all fields read by the renderer.
- `wellRect`/`Rect` shape `{x1,y1,x2,y2}` matches the renderer's existing `Band.rect`.

**Risks specific to M5:**

1. **Floating-point drift between TS and C++ goldens.** The plan does NOT compare TS output against C++ output — only against per-backend baseline PNGs. Since the rendering pipeline is the same, intra-TS reproducibility is what matters. If a future "compare TS sim output to native Gelbox" QA pass surfaces visible drift, expect to revisit `pow`/`sqrt` argument ordering.

2. **The sim is reactive in C++ (called on state change), not per-frame.** The TS dev page calls it once at boot. M6's slider integration must wire change events back through `fragToBands` and re-call `setBands(...)` + `render()`. M5 plan doesn't yet exercise this — the integration test arrives in M6.

3. **The 1 kb ladder fixture sizes (100..13500 bp) span the full mobility range.** A future denser fixture (more fragments, narrower spacing) will exercise additive blending more aggressively — same scenario as the 50-band post-fix golden. Both backends should cope per the M4-era fix.

4. **`Sample`'s `buffer` field vs `SimContext.gelBuffer`.** The fixture JSON ships a Sample with its OWN buffer (the buffer the sample was prepared in). The dev page sets `ctx.gelBuffer = sample.buffer` and `ctx.sampleBuffer = sample.buffer` — equivalent for now since the C++ TEST-buffers branch is disabled. M6's slider integration may want to surface gelBuffer as a separate UI control distinct from sampleBuffer.

5. **The aggregate model emits one Band per nonzero entry.** A fragment with aggregate `[1, 1, 1, 1, 1]` produces 5 bands at progressively-slower positions (monomer, dimer, trimer, tetramer, pentamer). The renderer handles up to ~50 bands per scene comfortably; the slider max-multimer = 7 caps practical fragment expansion. No special handling needed in M5.

Plan complete and saved to `docs/superpowers/plans/2026-04-30-gelbox-ts-m5-gelsim.md`.
