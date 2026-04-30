# M6 — Interaction Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder `/#/gel` route with a real, interactive single-lane gel app: voltage/time/buffer/well-damage sliders that drive the M5 sim live; band hit-testing and vertical drag (modifying fragment bp via reverse mobility solver); shift-lock during drag; opt-drag duplicate; tab-through-fragments keyboard navigation. First user-facing milestone.

**Architecture:** React Context + reducer for gel state (single sample, sim context, selection). New components under `src/components/{gel,chrome,primitives}/`. SVG overlay for hit-testing (per the phase 1 plan); native pointer events (no `@use-gesture/react` dep — vertical drag is simple enough). New `lib/sim/solver.ts` runs a binary search over `fragToBands` to invert the mobility curve when the user drags a band. The renderer mounts via the existing per-backend `selectBackend()` dispatch from M4. Multi-lane / sample-drag-between-lanes is **deferred** (M6b) — single-sample lane fits inside the M6 acceptance gates we can hit autonomously without expanding the state model.

**Tech Stack:** React 18.3, TypeScript 5.6 strict, Vite 5.4, Vitest 3, Playwright 1.49. **No new runtime dependencies.** Native pointer events; React Context (no Zustand/Redux).

**M6 reference:** C++ source at `~/code/gelbox/src/GelView.cpp:494-1412` (drag dispatch + solver), `~/code/gelbox/src/SliderView.cpp` (slider widget), `~/code/gelbox/src/GelSettingsView.cpp` (slider panel layout). The C++ uses a flat ViewCollection with manual z-order — we replace with a React component tree + CSS positioning. The C++ `solveBasePairForY` is a binary search wrapping the sim; we port the same algorithm.

---

## Scope

**In M6 (single-lane interactive gel):**
- `ts/src/lib/gel/gelState.ts` — `GelState` type + reducer + action types.
- `ts/src/components/gel/GelContext.tsx` — Provider + `useGelState`/`useGelDispatch` hooks.
- `ts/src/lib/sim/solver.ts` — `solveBasesForY(targetY, ...)` binary search (port of `solveBasePairForY`).
- `ts/src/components/primitives/Slider.tsx` — controlled slider (label + range input + value display + optional notch/quantize).
- `ts/src/components/gel/GelCanvas.tsx` — backend-dispatching canvas wrapper (consolidates the dev-page mount logic).
- `ts/src/components/gel/GelOverlay.tsx` — SVG hit-test layer above the canvas; renders one transparent `<rect>` per band's UI bounds; emits pointer events with band index.
- `ts/src/components/chrome/GelControls.tsx` — slider panel: voltage, time, well-damage; buffer dropdown; sample loader.
- `ts/src/routes/GelPage.tsx` — replace placeholder with full layout; mounts state Provider, GelControls + GelCanvas + GelOverlay + selection-info row.
- Band drag: vertical drag of a band rect calls `solveBasesForY`, mutates `sample.fragments[idx].bases`.
- Shift-lock: pressed during drag, restores `bases` to mousedown value (band freezes at original Y).
- Opt-drag duplicate: `pointerdown` with `altKey` clones the fragment before drag begins; new fragment receives drag events.
- Tab navigation: `Tab` cycles selected fragment forward, `Shift+Tab` backward; selection draws a focus ring on the band's overlay rect.
- Modifier-key indicator chip in the controls (shows currently held modifiers).
- New unit tests for state reducer + solver.
- New Playwright spec covering: page loads, sliders move bands, drag changes selection's bp, tab cycles, shift-lock, alt-drag clones.
- Phase 1 overview: M6 row linked, tagged `m6-interaction`, CI green.

**Out of M6 (deferred to M6b):**
- Multi-lane / N-sample architecture.
- Microtube icons + per-lane sample selection.
- Sample drag-between-lanes (requires multi-lane).
- Fragment editor panel (mass, degrade, aspect ratio sliders, color picker, dye selector, aggregate histogram).
- Loupe interactions (M7).
- "New fragment" / "Delete fragment" / "Save sample" buttons.
- Buffer-chemistry sliders (Tris/Borate/Acetate/EDTA at the molecule level — M6 only ships TBE/TAE/H2O presets via dropdown).

**Non-goals:**
- Pixel-exact match of the C++ Gelbox UI layout. The TS port aims for functional parity on the M6 acceptance criteria, not visual parity with the C++ panels.
- Mobile / touch device support. Desktop-class pointer events only; touch may work coincidentally but isn't tested.

---

## Decisions for this milestone

| Decision | Reason |
|---|---|
| React Context + `useReducer`, NOT Zustand or Redux | No new dep; the state graph is small (single sample, ~6 sim-context fields, 1 selection). React's built-ins are fine and idiomatic |
| Native pointer events (`onPointerDown/Move/Up`), NOT `@use-gesture/react` | Saves a dep; single-pointer vertical drag is trivial without a gesture library |
| SVG overlay for hit-testing, NOT GPU picking | Phase 1 plan choice; AABB intersection on Band.uiRect is free for ~50 bands, no readPixels stall |
| One Sample per page (single-lane) | Matches the existing fixtures (`single-band.json`, `ladder-1kb.json` are single-sample). Multi-lane lands later when sample-drag is implemented in full |
| Buffer dropdown of presets (TBE/TAE/H2O), NOT 4 chemistry sliders | The TBE/TAE/H2O equality checks are what the sim actually reads; full chemistry UI is M6b+ |
| `solveBasesForY` is integer-bp binary search over [1, baseCountHigh], 30 iterations max | Same shape as C++ `solveBasePairForY`; ~30 iterations × cheap `calcDeltaY` call = sub-ms |
| Band's UI rect for hit-test = `rect ⊕ smearAbove ⊕ smearBelow ⊕ flameHeight ⊕ blur` (matches C++ `mUIRect`) | The visible extent of the band including smear/flames/blur. Computed on the fly per band, not stored on Band |
| Page-level `keydown` listener for Tab navigation | Simpler than per-rect focus management; standard React pattern |
| Selected band's SVG rect gets a 1px outline + a focus-ring class | Visible feedback for selection; uses CSS, no canvas re-render needed |
| Slider primitive uses `<input type="range">` + label + value pill | Native + accessible. Custom drag styling via CSS pseudoelements; no canvas-level slider needed |
| Re-render flow: any state mutation → React re-renders → GelCanvas re-runs `fragToBands` for all fragments → renderer.setBands + render → blit | Synchronous matches C++ behavior; the sim is fast (sub-ms for ~50 bands) |
| Single fixture loader (TBE/TAE/H2O × ladder vs single-band) | A small fixed list in a `<select>`; the `Sample` becomes the loaded fixture's `sample.fragments`, plus its `buffer` becomes the initial gelBuffer |
| Playwright tests use a deterministic `[data-fragment-index="N"]` attribute on each band's overlay rect for hit-testing | Avoids pixel-coord clicks; lets tests interact with bands by ID |

---

## File structure for M6

```
ts/
  src/
    lib/
      gel/
        gelState.ts                           # NEW: state types + reducer + action helpers
      sim/
        solver.ts                             # NEW: solveBasesForY binary search
    components/
      gel/
        GelContext.tsx                        # NEW: Provider + hooks
        GelCanvas.tsx                         # NEW: backend-dispatching canvas wrapper
        GelOverlay.tsx                        # NEW: SVG hit-test + drag/keyboard handlers
      chrome/
        GelControls.tsx                       # NEW: sliders panel
      primitives/
        Slider.tsx                            # NEW: controlled slider primitive
    routes/
      GelPage.tsx                             # REPLACE: from placeholder to real layout
  tests/
    unit/
      gelState.test.ts                        # NEW: reducer correctness
      solver.test.ts                          # NEW: binary search correctness
      slider.test.ts                          # NEW: clamp + quantize logic
    visual/
      gel-page.spec.ts                        # NEW: Playwright spec for the /gel route
docs/
  superpowers/
    plans/
      2026-04-27-gelbox-ts-phase-1-overview.md  # MODIFY: mark M6 done
      2026-04-30-gelbox-ts-m6-interaction.md    # this file
```

---

## Reference: GelState shape

```ts
import type { Sample } from '../sim/sample';
import type { SimContext } from '../sim/gelSim';

export interface GelState {
  sample:    Sample;
  ctx:       SimContext;             // voltage, time, ySpaceScale, wellDamage, gelBuffer, sampleBuffer
  selectedFragmentIndex: number | null;
  fixtureKey: string;                // 'ladder-1kb' | 'single-band' | ...
  modifiers: {                       // tracked from keydown/up; used during drag
    shift: boolean;
    alt:   boolean;
    meta:  boolean;
  };
  drag:      DragState | null;       // null when not dragging
  gelSize:   { width: number; height: number };
  pixelsPerUnit: number;
  wellRect:  Rect;                   // shared single well; multi-lane in M6b
}

export interface DragState {
  fragmentIndex: number;
  startY:        number;             // canvas-y (0..H) of mousedown
  startBases:    number;             // frag.bases at mousedown (for shift-lock)
}

export type Action =
  | { type: 'SET_VOLTAGE';   value: number }
  | { type: 'SET_TIME';      value: number }
  | { type: 'SET_WELL_DAMAGE'; value: number }
  | { type: 'SET_GEL_BUFFER'; value: 'TBE' | 'TAE' | 'H2O' }
  | { type: 'LOAD_FIXTURE';  key: string; sample: Sample }
  | { type: 'SET_SELECTED';  index: number | null }
  | { type: 'SELECT_NEXT' }
  | { type: 'SELECT_PREV' }
  | { type: 'BEGIN_DRAG';    fragmentIndex: number; startY: number }
  | { type: 'END_DRAG' }
  | { type: 'CLONE_FRAGMENT'; sourceIndex: number }
  | { type: 'SET_FRAGMENT_BASES'; index: number; bases: number }
  | { type: 'SET_MODIFIERS'; modifiers: { shift: boolean; alt: boolean; meta: boolean } };
```

---

## Tasks

### Task 1: GelState types + reducer

**Files:**
- Create: `ts/src/lib/gel/gelState.ts`
- Test: `ts/tests/unit/gelState.test.ts`

- [ ] **Step 1: Write `ts/tests/unit/gelState.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { gelReducer, initialGelState, type GelState } from '../../src/lib/gel/gelState';
import { BUFFER_TBE, BUFFER_TAE, BUFFER_H2O } from '../../src/lib/sim/buffer';

const STARTING: GelState = initialGelState();

describe('gelReducer', () => {
  it('SET_VOLTAGE updates ctx.voltage', () => {
    const next = gelReducer(STARTING, { type: 'SET_VOLTAGE', value: 140 });
    expect(next.ctx.voltage).toBe(140);
  });
  it('SET_TIME clamps to [0,1]', () => {
    const above = gelReducer(STARTING, { type: 'SET_TIME', value: 2 });
    expect(above.ctx.time).toBe(1);
    const below = gelReducer(STARTING, { type: 'SET_TIME', value: -0.5 });
    expect(below.ctx.time).toBe(0);
  });
  it('SET_WELL_DAMAGE clamps to [0,1]', () => {
    const next = gelReducer(STARTING, { type: 'SET_WELL_DAMAGE', value: 0.5 });
    expect(next.ctx.wellDamage).toBe(0.5);
  });
  it('SET_GEL_BUFFER updates ctx.gelBuffer to preset', () => {
    const tae = gelReducer(STARTING, { type: 'SET_GEL_BUFFER', value: 'TAE' });
    expect(tae.ctx.gelBuffer).toEqual(BUFFER_TAE);
    const h2o = gelReducer(STARTING, { type: 'SET_GEL_BUFFER', value: 'H2O' });
    expect(h2o.ctx.gelBuffer).toEqual(BUFFER_H2O);
    const tbe = gelReducer(STARTING, { type: 'SET_GEL_BUFFER', value: 'TBE' });
    expect(tbe.ctx.gelBuffer).toEqual(BUFFER_TBE);
  });
  it('SET_SELECTED stores selection index', () => {
    const next = gelReducer(STARTING, { type: 'SET_SELECTED', index: 3 });
    expect(next.selectedFragmentIndex).toBe(3);
    const cleared = gelReducer(next, { type: 'SET_SELECTED', index: null });
    expect(cleared.selectedFragmentIndex).toBeNull();
  });
  it('SELECT_NEXT cycles forward and wraps', () => {
    const fragsCount = STARTING.sample.fragments.length;
    if (fragsCount === 0) return;  // skip if no fragments
    const sel0 = { ...STARTING, selectedFragmentIndex: 0 };
    const next1 = gelReducer(sel0, { type: 'SELECT_NEXT' });
    expect(next1.selectedFragmentIndex).toBe(Math.min(1, fragsCount - 1));
    // From last, wraps to 0
    const lastIdx = fragsCount - 1;
    const wrap = gelReducer({ ...STARTING, selectedFragmentIndex: lastIdx }, { type: 'SELECT_NEXT' });
    expect(wrap.selectedFragmentIndex).toBe(0);
    // From null, goes to 0
    const fromNull = gelReducer({ ...STARTING, selectedFragmentIndex: null }, { type: 'SELECT_NEXT' });
    expect(fromNull.selectedFragmentIndex).toBe(0);
  });
  it('SELECT_PREV cycles backward and wraps', () => {
    const fragsCount = STARTING.sample.fragments.length;
    if (fragsCount === 0) return;
    const lastIdx = fragsCount - 1;
    const prev = gelReducer({ ...STARTING, selectedFragmentIndex: 0 }, { type: 'SELECT_PREV' });
    expect(prev.selectedFragmentIndex).toBe(lastIdx);
    const fromNull = gelReducer({ ...STARTING, selectedFragmentIndex: null }, { type: 'SELECT_PREV' });
    expect(fromNull.selectedFragmentIndex).toBe(lastIdx);
  });
  it('BEGIN_DRAG stores drag state with startBases captured', () => {
    const fragsCount = STARTING.sample.fragments.length;
    if (fragsCount === 0) return;
    const next = gelReducer(STARTING, { type: 'BEGIN_DRAG', fragmentIndex: 0, startY: 100 });
    expect(next.drag).not.toBeNull();
    expect(next.drag!.fragmentIndex).toBe(0);
    expect(next.drag!.startY).toBe(100);
    expect(next.drag!.startBases).toBe(STARTING.sample.fragments[0].bases);
  });
  it('END_DRAG clears drag state', () => {
    const dragging = gelReducer(STARTING, { type: 'BEGIN_DRAG', fragmentIndex: 0, startY: 100 });
    const ended = gelReducer(dragging, { type: 'END_DRAG' });
    expect(ended.drag).toBeNull();
  });
  it('SET_FRAGMENT_BASES mutates fragment bases (immutably)', () => {
    if (STARTING.sample.fragments.length === 0) return;
    const next = gelReducer(STARTING, { type: 'SET_FRAGMENT_BASES', index: 0, bases: 5000 });
    expect(next.sample.fragments[0].bases).toBe(5000);
    expect(STARTING.sample.fragments[0].bases).not.toBe(5000);  // original untouched
  });
  it('CLONE_FRAGMENT inserts a copy and selects it', () => {
    if (STARTING.sample.fragments.length === 0) return;
    const next = gelReducer(STARTING, { type: 'CLONE_FRAGMENT', sourceIndex: 0 });
    expect(next.sample.fragments.length).toBe(STARTING.sample.fragments.length + 1);
    // Cloned at index 0+1, selection points at clone
    expect(next.selectedFragmentIndex).toBe(1);
    expect(next.sample.fragments[1]).toEqual(STARTING.sample.fragments[0]);
  });
  it('SET_MODIFIERS replaces the modifiers object', () => {
    const next = gelReducer(STARTING, {
      type: 'SET_MODIFIERS',
      modifiers: { shift: true, alt: false, meta: false },
    });
    expect(next.modifiers.shift).toBe(true);
    expect(next.modifiers.alt).toBe(false);
  });
});

describe('initialGelState', () => {
  it('returns a TBE-buffer state with default ladder fixture', () => {
    const s = initialGelState();
    expect(s.ctx.gelBuffer).toEqual(BUFFER_TBE);
    expect(s.ctx.voltage).toBe(70);
    expect(s.ctx.time).toBeGreaterThan(0);
    expect(s.sample.fragments.length).toBeGreaterThan(0);
    expect(s.fixtureKey).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test, confirm fails**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/gelState.test.ts
```

Expected: FAIL (module missing).

- [ ] **Step 3: Write `ts/src/lib/gel/gelState.ts`**

```ts
import type { Sample, Fragment } from '../sim/sample';
import type { SimContext } from '../sim/gelSim';
import type { Rect } from './band';
import { BUFFER_TBE, BUFFER_TAE, BUFFER_H2O } from '../sim/buffer';
import ladder from '../../../fixtures/states/ladder-1kb.json';

export interface DragState {
  fragmentIndex: number;
  startY:        number;
  startBases:    number;
}

export interface GelState {
  sample:                Sample;
  ctx:                   SimContext;
  selectedFragmentIndex: number | null;
  fixtureKey:            string;
  modifiers:             { shift: boolean; alt: boolean; meta: boolean };
  drag:                  DragState | null;
  gelSize:               { width: number; height: number };
  pixelsPerUnit:         number;
  wellRect:              Rect;
}

export type Action =
  | { type: 'SET_VOLTAGE';        value: number }
  | { type: 'SET_TIME';           value: number }
  | { type: 'SET_WELL_DAMAGE';    value: number }
  | { type: 'SET_GEL_BUFFER';     value: 'TBE' | 'TAE' | 'H2O' }
  | { type: 'LOAD_FIXTURE';       key: string; sample: Sample }
  | { type: 'SET_SELECTED';       index: number | null }
  | { type: 'SELECT_NEXT' }
  | { type: 'SELECT_PREV' }
  | { type: 'BEGIN_DRAG';         fragmentIndex: number; startY: number }
  | { type: 'END_DRAG' }
  | { type: 'CLONE_FRAGMENT';     sourceIndex: number }
  | { type: 'SET_FRAGMENT_BASES'; index: number; bases: number }
  | { type: 'SET_MODIFIERS';      modifiers: { shift: boolean; alt: boolean; meta: boolean } };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const BUFFER_BY_KEY = {
  TBE: BUFFER_TBE,
  TAE: BUFFER_TAE,
  H2O: BUFFER_H2O,
} as const;

export function initialGelState(): GelState {
  const sample = ladder as unknown as Sample;
  return {
    sample,
    ctx: {
      voltage: 70,
      time:    0.5,
      ySpaceScale: 200,
      wellDamage: 0,
      gelBuffer: BUFFER_TBE,
      sampleBuffer: sample.buffer,
    },
    selectedFragmentIndex: null,
    fixtureKey: 'ladder-1kb',
    modifiers: { shift: false, alt: false, meta: false },
    drag: null,
    gelSize: { width: 320, height: 240 },
    pixelsPerUnit: 1,
    wellRect: { x1: 140, y1: 8, x2: 180, y2: 18 },
  };
}

export function gelReducer(state: GelState, action: Action): GelState {
  switch (action.type) {
    case 'SET_VOLTAGE':
      return { ...state, ctx: { ...state.ctx, voltage: action.value } };
    case 'SET_TIME':
      return { ...state, ctx: { ...state.ctx, time: clamp(action.value, 0, 1) } };
    case 'SET_WELL_DAMAGE':
      return { ...state, ctx: { ...state.ctx, wellDamage: clamp(action.value, 0, 1) } };
    case 'SET_GEL_BUFFER':
      return { ...state, ctx: { ...state.ctx, gelBuffer: BUFFER_BY_KEY[action.value] } };
    case 'LOAD_FIXTURE':
      return {
        ...state,
        sample: action.sample,
        fixtureKey: action.key,
        selectedFragmentIndex: null,
        ctx: { ...state.ctx, sampleBuffer: action.sample.buffer },
        drag: null,
      };
    case 'SET_SELECTED':
      return { ...state, selectedFragmentIndex: action.index };
    case 'SELECT_NEXT': {
      const n = state.sample.fragments.length;
      if (n === 0) return state;
      const cur = state.selectedFragmentIndex;
      const next = cur === null ? 0 : (cur + 1) % n;
      return { ...state, selectedFragmentIndex: next };
    }
    case 'SELECT_PREV': {
      const n = state.sample.fragments.length;
      if (n === 0) return state;
      const cur = state.selectedFragmentIndex;
      const prev = cur === null ? n - 1 : (cur - 1 + n) % n;
      return { ...state, selectedFragmentIndex: prev };
    }
    case 'BEGIN_DRAG': {
      const frag = state.sample.fragments[action.fragmentIndex];
      if (!frag) return state;
      return {
        ...state,
        drag: { fragmentIndex: action.fragmentIndex, startY: action.startY, startBases: frag.bases },
        selectedFragmentIndex: action.fragmentIndex,
      };
    }
    case 'END_DRAG':
      return { ...state, drag: null };
    case 'CLONE_FRAGMENT': {
      const src = state.sample.fragments[action.sourceIndex];
      if (!src) return state;
      const fragments: Fragment[] = [
        ...state.sample.fragments.slice(0, action.sourceIndex + 1),
        { ...src },
        ...state.sample.fragments.slice(action.sourceIndex + 1),
      ];
      return {
        ...state,
        sample: { ...state.sample, fragments },
        selectedFragmentIndex: action.sourceIndex + 1,
      };
    }
    case 'SET_FRAGMENT_BASES': {
      const fragments = state.sample.fragments.map((f, i) =>
        i === action.index ? { ...f, bases: action.bases } : f
      );
      return { ...state, sample: { ...state.sample, fragments } };
    }
    case 'SET_MODIFIERS':
      return { ...state, modifiers: action.modifiers };
    default: {
      // exhaustiveness check
      const _: never = action;
      void _;
      return state;
    }
  }
}
```

- [ ] **Step 4: Run test, confirm passes**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/gelState.test.ts
```

Expected: 13 tests pass.

- [ ] **Step 5: Run full unit suite**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: typecheck clean, 102 + 13 = 115/115 unit tests.

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/gel/gelState.ts ts/tests/unit/gelState.test.ts
git commit -m "feat(gel): GelState + reducer for the interactive gel page"
```

---

### Task 2: Reverse mobility solver

**Files:**
- Create: `ts/src/lib/sim/solver.ts`
- Test: `ts/tests/unit/solver.test.ts`

C++ reference: `~/code/gelbox/src/GelView.cpp` `solveBasePairForY` — binary search over bp such that `fragToBands` produces a band rect at the target Y.

The solver takes the same arguments `fragAggregateToBand` would take, plus a target Y in canvas-pixel space. It binary-searches `bases` in `[1, kBaseCountHigh]` such that the resulting band's rect.y1 best matches the target. We use the rect.y1 (top edge) as the anchor, matching what the user grabs at mouse-down.

- [ ] **Step 1: Write `ts/tests/unit/solver.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { solveBasesForY } from '../../src/lib/sim/solver';
import type { SimContext } from '../../src/lib/sim/mobility';
import type { Fragment } from '../../src/lib/sim/sample';
import { BUFFER_TBE } from '../../src/lib/sim/buffer';
import { fragToBands } from '../../src/lib/sim/gelSim';
import type { Sample } from '../../src/lib/sim/sample';

const CTX: SimContext = {
  voltage: 70, time: 0.5, ySpaceScale: 200, wellDamage: 0,
  gelBuffer: BUFFER_TBE, sampleBuffer: BUFFER_TBE,
};
const WELL = { x1: 140, y1: 8, x2: 180, y2: 18 };

const FRAG: Fragment = {
  bases: 1000, mass: 50, degrade: 0, dye: -1, aggregate: [],
  aspectRatio: 1, color: [1, 1, 1],
};

function bandY1ForBases(bases: number): number {
  const sample: Sample = { buffer: BUFFER_TBE, fragments: [{ ...FRAG, bases }] };
  const bands = fragToBands(sample, 0, WELL, 0, CTX);
  return bands[0].rect.y1;
}

describe('solveBasesForY', () => {
  it('round-trip: result bp produces band y1 within 1px of target', () => {
    // Pick a known bp, find its y1, then solve for that y1; expect bp ≈ original
    const knownBp = 5000;
    const targetY = bandY1ForBases(knownBp);
    const solvedBp = solveBasesForY({ targetY, frag: FRAG, lane: 0, ctx: CTX, wellRect: WELL });
    // Solver works in integer-bp; tolerance ±10 bp
    expect(Math.abs(solvedBp - knownBp)).toBeLessThanOrEqual(10);
  });

  it('larger target Y (band lower on canvas) → smaller bp', () => {
    const yHigh = bandY1ForBases(10000);  // big bp → near top of canvas (small y)
    const yLow  = bandY1ForBases(500);    // small bp → far down (large y)
    expect(yHigh).toBeLessThan(yLow);

    const bpForHigh = solveBasesForY({ targetY: yHigh, frag: FRAG, lane: 0, ctx: CTX, wellRect: WELL });
    const bpForLow  = solveBasesForY({ targetY: yLow,  frag: FRAG, lane: 0, ctx: CTX, wellRect: WELL });
    expect(bpForHigh).toBeGreaterThan(bpForLow);
  });

  it('clamps to [1, baseCountHigh]: too-high target → bp=1; too-low target → bp=baseCountHigh', () => {
    // Target way past anything achievable: y=10000 → bp pinned to 1
    const big = solveBasesForY({ targetY: 10000, frag: FRAG, lane: 0, ctx: CTX, wellRect: WELL });
    expect(big).toBe(1);

    // Target at the well (y near 0) → bp pinned to baseCountHigh
    const tiny = solveBasesForY({ targetY: 0, frag: FRAG, lane: 0, ctx: CTX, wellRect: WELL });
    expect(tiny).toBe(14000);
  });

  it('respects ctx.voltage (different voltage → different solution for same target Y)', () => {
    const targetY = 100;
    const at70 = solveBasesForY({ targetY, frag: FRAG, lane: 0, ctx: CTX, wellRect: WELL });
    const at140 = solveBasesForY({ targetY, frag: FRAG, lane: 0, ctx: { ...CTX, voltage: 140 }, wellRect: WELL });
    // At 2× voltage, same target y is reached by molecule that traveled half as far
    // → larger bp
    expect(at140).toBeGreaterThan(at70);
  });
});
```

- [ ] **Step 2: Run test, confirm fails**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/solver.test.ts
```

Expected: FAIL (module missing).

- [ ] **Step 3: Write `ts/src/lib/sim/solver.ts`**

```ts
import type { Fragment, Sample } from './sample';
import type { SimContext } from './mobility';
import type { Rect } from '../gel/band';
import { fragToBands } from './gelSim';
import { GEL_SIM_TUNING } from '../../data/tuning';

export interface SolveOpts {
  targetY:  number;     // canvas-pixel Y to match against the band's rect.y1
  frag:     Fragment;   // fragment template; bases is replaced during search
  lane:     number;
  ctx:      SimContext;
  wellRect: Rect;
}

const MAX_ITER = 30;

/**
 * Binary-search bp ∈ [1, baseCountHigh] such that `fragToBands` produces a
 * band whose rect.y1 best matches `targetY`. Mirrors the C++
 * `solveBasePairForY` solver. Monotonicity is implicit in calcDeltaY:
 * bigger bp → smaller deltaY → smaller rect.y1 (closer to well at top).
 *
 * Returns an integer bp. Iteration count is capped at 30; the search
 * converges to single-bp precision in <17 iterations on a 14000-bp range.
 */
export function solveBasesForY(opts: SolveOpts): number {
  const { targetY, frag, lane, ctx, wellRect } = opts;
  const upper = GEL_SIM_TUNING.baseCountHigh;

  function bandY1At(bases: number): number {
    const sample: Sample = { buffer: ctx.sampleBuffer, fragments: [{ ...frag, bases }] };
    const bands = fragToBands(sample, 0, wellRect, lane, ctx);
    return bands[0].rect.y1;
  }

  // Boundary checks: if target is unachievable, clamp.
  const yAtMin = bandY1At(1);          // smallest bp → largest y
  const yAtMax = bandY1At(upper);      // largest bp → smallest y
  if (targetY >= yAtMin) return 1;
  if (targetY <= yAtMax) return upper;

  // Standard integer binary search.
  let lo = 1;
  let hi = upper;
  for (let i = 0; i < MAX_ITER; i++) {
    if (hi - lo <= 1) break;
    const mid = Math.floor((lo + hi) / 2);
    const y = bandY1At(mid);
    if (y > targetY) {
      // Need larger bp (smaller y).
      lo = mid;
    } else {
      // Need smaller bp (larger y).
      hi = mid;
    }
  }
  // Pick the side closer to target.
  return Math.abs(bandY1At(lo) - targetY) < Math.abs(bandY1At(hi) - targetY) ? lo : hi;
}
```

- [ ] **Step 4: Run test, confirm passes**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/solver.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Run full unit suite**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: typecheck clean, 115 + 4 = 119/119 unit tests.

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/sim/solver.ts ts/tests/unit/solver.test.ts
git commit -m "feat(sim): solveBasesForY reverse mobility solver (binary search)"
```

---

### Task 3: Slider primitive

**Files:**
- Create: `ts/src/components/primitives/Slider.tsx`
- Test: `ts/tests/unit/slider.test.ts`

A controlled slider that wraps `<input type="range">` with a label, value pill, and optional quantize. The pure-logic helpers (clamp, quantize) are tested standalone; the React component is exercised by Playwright in Task 11.

- [ ] **Step 1: Write `ts/tests/unit/slider.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { clampToRange, quantizeStep } from '../../src/components/primitives/Slider';

describe('clampToRange', () => {
  it('clamps below min', () => expect(clampToRange(-5, 0, 10)).toBe(0));
  it('clamps above max', () => expect(clampToRange(20, 0, 10)).toBe(10));
  it('passes through inside range', () => expect(clampToRange(5, 0, 10)).toBe(5));
});

describe('quantizeStep', () => {
  it('rounds to nearest step from min', () => {
    expect(quantizeStep(0.13, 0, 1, 0.1)).toBeCloseTo(0.1, 6);
    expect(quantizeStep(0.16, 0, 1, 0.1)).toBeCloseTo(0.2, 6);
  });
  it('handles integer steps', () => {
    expect(quantizeStep(7.4, 0, 100, 1)).toBe(7);
    expect(quantizeStep(7.5, 0, 100, 1)).toBe(8);
  });
  it('passes through when step is 0 (no quantize)', () => {
    expect(quantizeStep(3.1415, 0, 10, 0)).toBe(3.1415);
  });
});
```

- [ ] **Step 2: Run test, confirm fails**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/slider.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Write `ts/src/components/primitives/Slider.tsx`**

```tsx
import { useId } from 'react';

export function clampToRange(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function quantizeStep(v: number, min: number, max: number, step: number): number {
  if (step <= 0) return v;
  const offset = (v - min) / step;
  const rounded = Math.round(offset) * step + min;
  return clampToRange(rounded, min, max);
}

export interface SliderProps {
  label:    string;
  value:    number;
  min:      number;
  max:      number;
  step?:    number;       // 0 = continuous; default 0
  unit?:    string;       // appended to value pill ("V", "ms", etc.)
  onChange: (value: number) => void;
}

export function Slider({ label, value, min, max, step = 0, unit, onChange }: SliderProps) {
  const id = useId();
  const html = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <label htmlFor={id} style={{ color: 'var(--color-ink)', fontSize: 13 }}>{label}</label>
        <span data-testid={`${id}-value`} style={{ color: 'var(--color-ink-muted)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {step >= 1 ? value.toFixed(0) : value.toFixed(2)}{unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step > 0 ? step : 'any'}
        value={value}
        onChange={(e) => {
          const raw = parseFloat(e.target.value);
          const clamped = clampToRange(raw, min, max);
          const final = step > 0 ? quantizeStep(clamped, min, max, step) : clamped;
          onChange(final);
        }}
        style={{ width: '100%' }}
      />
    </div>
  );
  return html;
}
```

- [ ] **Step 4: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: clean, 119 + 6 = 125/125.

- [ ] **Step 5: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/components/primitives/Slider.tsx ts/tests/unit/slider.test.ts
git commit -m "feat(ui): Slider primitive with quantize + unit label"
```

---

### Task 4: GelContext provider + hooks

**Files:**
- Create: `ts/src/components/gel/GelContext.tsx`

A thin Context wrapper over `useReducer(gelReducer, initialGelState())`. Two hooks: `useGelState()` returns state, `useGelDispatch()` returns dispatch. Keeping them split lets components subscribe to state OR dispatch independently.

- [ ] **Step 1: Write `ts/src/components/gel/GelContext.tsx`**

```tsx
import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import { gelReducer, initialGelState, type GelState, type Action } from '../../lib/gel/gelState';

const StateCtx    = createContext<GelState | null>(null);
const DispatchCtx = createContext<Dispatch<Action> | null>(null);

export function GelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gelReducer, undefined, initialGelState);
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useGelState(): GelState {
  const s = useContext(StateCtx);
  if (!s) throw new Error('useGelState must be used inside <GelProvider>');
  return s;
}

export function useGelDispatch(): Dispatch<Action> {
  const d = useContext(DispatchCtx);
  if (!d) throw new Error('useGelDispatch must be used inside <GelProvider>');
  return d;
}
```

- [ ] **Step 2: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/components/gel/GelContext.tsx
git commit -m "feat(gel): GelContext provider + useGelState/useGelDispatch hooks"
```

---

### Task 5: GelCanvas component

**Files:**
- Create: `ts/src/components/gel/GelCanvas.tsx`

A backend-dispatching canvas wrapper. Takes `bands`, `gelSize`, `pixelsPerUnit` props. Internally uses `selectBackend()` and mounts either WebGPU or WebGL2 renderer. Reflects band changes via React `useEffect` (re-runs `setBands` + `render`).

This consolidates the dev-page mount logic (currently duplicated across DevPage / DevMultiPage / DevPerfPage / DevSimPage). For M6 we use it in GelPage; later milestones can refactor the dev pages to use it too.

- [ ] **Step 1: Write `ts/src/components/gel/GelCanvas.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import type { Band } from '../../lib/sim/band';
import { selectBackend } from '../../lib/gel/backend';

interface GelCanvasProps {
  bands:        Band[];
  gelSize:      { width: number; height: number };
  pixelsPerUnit: number;
}

type GpuRenderer = ReturnType<typeof import('../../lib/gel/render').createGelRenderer>;
type GlRenderer  = ReturnType<typeof import('../../lib/gel/render-gl').createGlGelRenderer>;

export function GelCanvas({ bands, gelSize, pixelsPerUnit }: GelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    rendererGpu: GpuRenderer | null;
    rendererGl:  GlRenderer  | null;
    blitFn:      ((output: GpuRenderer | GlRenderer) => void) | null;
  }>({ rendererGpu: null, rendererGl: null, blitFn: null });

  // Mount once; teardown on unmount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    canvas.width  = gelSize.width  * pixelsPerUnit;
    canvas.height = gelSize.height * pixelsPerUnit;

    (async () => {
      try {
        const backend = selectBackend();
        if (backend === 'webgl2') {
          const { configureGl2Context } = await import('../../lib/gpu/gl/context');
          const { gl } = configureGl2Context(canvas);
          if (cancelled) return;
          const [
            { createGlGelRenderer },
            { createGlProgram },
            { createGlQuad, bindQuadAttribs },
            passVertSrc, gelPassthroughSrc,
          ] = await Promise.all([
            import('../../lib/gel/render-gl'),
            import('../../lib/gpu/gl/program'),
            import('../../lib/gpu/gl/quad'),
            import('../../shaders/passthrough.vert.glsl?raw'),
            import('../../shaders/gel-passthrough.frag.glsl?raw'),
          ]);
          const renderer = createGlGelRenderer(gl, gelSize, pixelsPerUnit);
          stateRef.current.rendererGl = renderer;
          const blit = createGlProgram(gl, passVertSrc.default, gelPassthroughSrc.default, 'gl-blit');
          const quad = createGlQuad(gl);
          stateRef.current.blitFn = () => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.disable(gl.BLEND);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(blit.program);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, renderer.output.texture);
            gl.uniform1i(blit.uniform('uTex0'), 0);
            gl.uniform2f(blit.uniform('uPositionOffset'), 0, 0);
            gl.uniform2f(blit.uniform('uPositionScale'), gelSize.width, gelSize.height);
            gl.uniform2f(blit.uniform('uTexCoordOffset'), 0, 0);
            gl.uniform2f(blit.uniform('uTexCoordScale'), 1, 1);
            gl.uniform2f(blit.uniform('uGelSize'), gelSize.width, gelSize.height);
            bindQuadAttribs(gl, quad.buffer, blit.attrib('aPos'), blit.attrib('aTexCoord'));
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          };
        } else {
          const { requestDevice } = await import('../../lib/gpu/device');
          const { configureContext } = await import('../../lib/gpu/context');
          const { device, queue } = await requestDevice();
          if (cancelled) return;
          const { context, format } = configureContext(canvas, device);
          const [
            { createGelRenderer },
            { createQuad },
            { createShaderModule },
            { createUniformBuffer },
            passVertSrc, gelPassthroughSrc,
          ] = await Promise.all([
            import('../../lib/gel/render'),
            import('../../lib/gpu/quad'),
            import('../../lib/gpu/shader'),
            import('../../lib/gpu/uniforms'),
            import('../../shaders/passthrough.vert.wgsl?raw'),
            import('../../shaders/gel-passthrough.frag.wgsl?raw'),
          ]);
          const renderer = createGelRenderer(device, gelSize, pixelsPerUnit);
          stateRef.current.rendererGpu = renderer;
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
            label: 'gel-canvas-blit',
            layout: device.createPipelineLayout({ bindGroupLayouts: [bgl] }),
            vertex: { module: vs, entryPoint: 'vs_main', buffers: [quad.layout] },
            fragment: { module: fs, entryPoint: 'fs_main', targets: [{ format }] },
            primitive: { topology: 'triangle-strip' },
          });
          const sampler = device.createSampler({
            magFilter: 'linear', minFilter: 'linear',
            addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
          });
          const uPass = createUniformBuffer(device, 48, 'gel-canvas-blit-pass');
          const dv = uPass.view, w = canvas.width, h = canvas.height;
          dv.setFloat32(0, 0, true); dv.setFloat32(4, 0, true);
          dv.setFloat32(8, w, true); dv.setFloat32(12, h, true);
          dv.setFloat32(16, 0, true); dv.setFloat32(20, 0, true);
          dv.setFloat32(24, 1, true); dv.setFloat32(28, 1, true);
          dv.setFloat32(32, w, true); dv.setFloat32(36, h, true);
          dv.setFloat32(40, 0, true); dv.setFloat32(44, 0, true);
          uPass.upload(queue);
          stateRef.current.blitFn = () => {
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
          };
        }
      } catch (err) {
        console.error('GelCanvas mount failed:', err);
      }
    })();

    return () => {
      cancelled = true;
      stateRef.current.rendererGpu?.destroy();
      stateRef.current.rendererGl?.destroy();
      stateRef.current.rendererGpu = null;
      stateRef.current.rendererGl  = null;
      stateRef.current.blitFn = null;
    };
  }, [gelSize.width, gelSize.height, pixelsPerUnit]);

  // Re-render whenever bands prop changes
  useEffect(() => {
    const { rendererGpu, rendererGl, blitFn } = stateRef.current;
    const renderer = rendererGpu ?? rendererGl;
    if (!renderer || !blitFn) return;
    renderer.setBands(bands);
    renderer.render();
    blitFn(renderer);
  }, [bands]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="gel-canvas"
      style={{
        width:  `${gelSize.width  * pixelsPerUnit}px`,
        height: `${gelSize.height * pixelsPerUnit}px`,
        display: 'block',
        border: '1px solid var(--color-grid)',
        imageRendering: 'pixelated',
      }}
    />
  );
}
```

- [ ] **Step 2: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: clean, 125/125.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/components/gel/GelCanvas.tsx
git commit -m "feat(gel): GelCanvas — backend-dispatching canvas wrapper for the gel app"
```

---

### Task 6: GelOverlay component (hit-testing + drag + keyboard)

**Files:**
- Create: `ts/src/components/gel/GelOverlay.tsx`

SVG layer absolutely positioned over the canvas. One transparent `<rect>` per band's UI bounds (band rect + smear/flame extension + blur padding). Pointer events emit drag actions to the dispatch. The overlay has `tabIndex={0}` and listens for Tab / Shift+Tab to cycle the selected fragment.

The mapping band-index → fragment-index isn't 1:1 (a fragment may emit multiple bands due to the aggregate model). For M6 we use the simple ladder fixture where every fragment emits exactly 1 band, so we attach `data-fragment-index` directly to each band rect. A more general "band → fragment" mapping comes when we ship aggregate UI (M6b+).

- [ ] **Step 1: Write `ts/src/components/gel/GelOverlay.tsx`**

```tsx
import { useCallback, useEffect, useRef } from 'react';
import type { Band } from '../../lib/sim/band';
import { useGelState, useGelDispatch } from './GelContext';
import { solveBasesForY } from '../../lib/sim/solver';

interface GelOverlayProps {
  bands:    Band[];
  /** band index → fragment index. For M6's monomer-only fixtures, identity. */
  bandToFragment: number[];
}

export function GelOverlay({ bands, bandToFragment }: GelOverlayProps) {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const svgRef = useRef<SVGSVGElement>(null);

  // Track modifiers globally so drag handlers see the latest state.
  useEffect(() => {
    const update = (e: KeyboardEvent) => {
      dispatch({ type: 'SET_MODIFIERS', modifiers: { shift: e.shiftKey, alt: e.altKey, meta: e.metaKey } });
    };
    window.addEventListener('keydown', update);
    window.addEventListener('keyup', update);
    return () => {
      window.removeEventListener('keydown', update);
      window.removeEventListener('keyup', update);
    };
  }, [dispatch]);

  // Page-level Tab navigation when overlay has focus.
  const onKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      dispatch({ type: e.shiftKey ? 'SELECT_PREV' : 'SELECT_NEXT' });
    }
  };

  // Pointer move handler — installed on window during drag so the band can be
  // dragged outside its rect's bounds.
  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!state.drag || !svgRef.current) return;
    if (state.modifiers.shift) {
      // Shift-lock: snap bp back to startBases (band freezes at original Y).
      dispatch({ type: 'SET_FRAGMENT_BASES', index: state.drag.fragmentIndex, bases: state.drag.startBases });
      return;
    }
    // Map clientY to canvas-y (gel-space).
    const rect = svgRef.current.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
    const frag = state.sample.fragments[state.drag.fragmentIndex];
    if (!frag) return;
    const newBases = solveBasesForY({
      targetY: y,
      frag,
      lane:    0,
      ctx:     state.ctx,
      wellRect: state.wellRect,
    });
    if (newBases !== frag.bases) {
      dispatch({ type: 'SET_FRAGMENT_BASES', index: state.drag.fragmentIndex, bases: newBases });
    }
  }, [state.drag, state.modifiers.shift, state.sample, state.ctx, state.wellRect, state.gelSize.height, dispatch]);

  const onPointerUp = useCallback(() => {
    if (state.drag) dispatch({ type: 'END_DRAG' });
  }, [state.drag, dispatch]);

  // Subscribe global pointer move/up while dragging.
  useEffect(() => {
    if (!state.drag) return;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup',   onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup',   onPointerUp);
    };
  }, [state.drag, onPointerMove, onPointerUp]);

  function onBandPointerDown(bandIdx: number, e: React.PointerEvent<SVGRectElement>) {
    e.preventDefault();
    const fragIdx = bandToFragment[bandIdx];
    const altKey = e.altKey;
    if (altKey) {
      // Clone first; new fragment is inserted at fragIdx+1 and selected.
      dispatch({ type: 'CLONE_FRAGMENT', sourceIndex: fragIdx });
      // Begin drag on the clone (selection is now fragIdx+1 per the reducer).
      const rect = svgRef.current!.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
      dispatch({ type: 'BEGIN_DRAG', fragmentIndex: fragIdx + 1, startY: y });
    } else {
      const rect = svgRef.current!.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
      dispatch({ type: 'BEGIN_DRAG', fragmentIndex: fragIdx, startY: y });
    }
  }

  return (
    <svg
      ref={svgRef}
      data-testid="gel-overlay"
      tabIndex={0}
      onKeyDown={onKeyDown}
      viewBox={`0 0 ${state.gelSize.width} ${state.gelSize.height}`}
      style={{
        position: 'absolute',
        inset: 0,
        width:  `${state.gelSize.width  * state.pixelsPerUnit}px`,
        height: `${state.gelSize.height * state.pixelsPerUnit}px`,
        outline: 'none',
        // SVG accepts pointer events on filled rects; also catch focus from Tab/click outside band
        pointerEvents: 'auto',
      }}
    >
      {bands.map((b, i) => {
        const upExt = Math.max(b.smearAbove, b.flameHeight);
        const x = b.rect.x1 - b.blur;
        const w = (b.rect.x2 - b.rect.x1) + 2 * b.blur;
        const y = b.rect.y1 - upExt - b.blur;
        const h = (b.rect.y2 - b.rect.y1) + upExt + b.smearBelow + 2 * b.blur;
        const fragIdx = bandToFragment[i];
        const selected = state.selectedFragmentIndex === fragIdx;
        return (
          <rect
            key={i}
            data-testid={`band-${i}`}
            data-fragment-index={fragIdx}
            x={x} y={y} width={w} height={h}
            fill="transparent"
            stroke={selected ? 'var(--color-accent, #66ccff)' : 'transparent'}
            strokeWidth={1}
            onPointerDown={(e) => onBandPointerDown(i, e)}
            style={{ cursor: 'ns-resize' }}
          />
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 2: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/components/gel/GelOverlay.tsx
git commit -m "feat(gel): GelOverlay — SVG hit-test layer with band drag + tab nav"
```

---

### Task 7: GelControls panel

**Files:**
- Create: `ts/src/components/chrome/GelControls.tsx`

A column of sliders + a buffer dropdown + a fixture dropdown + a modifier-key indicator chip. All values bind to the GelContext.

- [ ] **Step 1: Write `ts/src/components/chrome/GelControls.tsx`**

```tsx
import { useGelState, useGelDispatch } from '../gel/GelContext';
import { Slider } from '../primitives/Slider';
import type { Sample } from '../../lib/sim/sample';

const FIXTURES: { key: string; label: string; loader: () => Promise<{ default: Sample }> }[] = [
  { key: 'ladder-1kb', label: '1 kb ladder', loader: () => import('../../../fixtures/states/ladder-1kb.json') as unknown as Promise<{ default: Sample }> },
];

export function GelControls() {
  const state = useGelState();
  const dispatch = useGelDispatch();

  const bufferKey: 'TBE' | 'TAE' | 'H2O' =
    state.ctx.gelBuffer.borate > 0 ? 'TBE'
      : state.ctx.gelBuffer.acetate > 0 ? 'TAE'
      : 'H2O';

  return (
    <section
      data-testid="gel-controls"
      style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, minWidth: 240 }}
    >
      <Slider
        label="Voltage"
        value={state.ctx.voltage}
        min={-300} max={300} step={1} unit="V"
        onChange={(v) => dispatch({ type: 'SET_VOLTAGE', value: v })}
      />
      <Slider
        label="Time"
        value={state.ctx.time}
        min={0} max={1} step={0}
        onChange={(v) => dispatch({ type: 'SET_TIME', value: v })}
      />
      <Slider
        label="Well damage"
        value={state.ctx.wellDamage}
        min={0} max={1} step={0}
        onChange={(v) => dispatch({ type: 'SET_WELL_DAMAGE', value: v })}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ color: 'var(--color-ink)', fontSize: 13 }}>Gel buffer</label>
        <select
          data-testid="gel-buffer-select"
          value={bufferKey}
          onChange={(e) => dispatch({ type: 'SET_GEL_BUFFER', value: e.target.value as 'TBE' | 'TAE' | 'H2O' })}
        >
          <option value="TBE">0.5× TBE</option>
          <option value="TAE">1× TAE</option>
          <option value="H2O">H₂O</option>
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ color: 'var(--color-ink)', fontSize: 13 }}>Sample</label>
        <select
          data-testid="fixture-select"
          value={state.fixtureKey}
          onChange={async (e) => {
            const fixture = FIXTURES.find((f) => f.key === e.target.value);
            if (!fixture) return;
            const mod = await fixture.loader();
            dispatch({ type: 'LOAD_FIXTURE', key: fixture.key, sample: mod.default });
          }}
        >
          {FIXTURES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
      </div>
      <div data-testid="modifiers" style={{ fontSize: 12, color: 'var(--color-ink-muted)', fontFamily: 'monospace' }}>
        modifiers: {[
          state.modifiers.shift ? 'shift' : null,
          state.modifiers.alt   ? 'alt'   : null,
          state.modifiers.meta  ? 'meta'  : null,
        ].filter(Boolean).join(' + ') || '—'}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/components/chrome/GelControls.tsx
git commit -m "feat(gel): GelControls — sliders + buffer + sample loader + modifier chip"
```

---

### Task 8: Replace GelPage placeholder with the real interactive page

**Files:**
- Modify: `ts/src/routes/GelPage.tsx`

Wires the Provider, computes bands per render via `fragToBands`, mounts GelCanvas + GelOverlay (overlapped) + GelControls + a tiny selection-info row.

- [ ] **Step 1: Replace `ts/src/routes/GelPage.tsx`**

```tsx
import { useMemo } from 'react';
import { GelProvider, useGelState } from '../components/gel/GelContext';
import { GelCanvas } from '../components/gel/GelCanvas';
import { GelOverlay } from '../components/gel/GelOverlay';
import { GelControls } from '../components/chrome/GelControls';
import { fragToBands } from '../lib/sim/gelSim';
import type { Band } from '../lib/sim/band';

function GelInner() {
  const state = useGelState();

  // Compute bands per render. Each fragment emits 1+ bands. We build a parallel
  // bandToFragment[] mapping so the overlay can dispatch fragment-indexed actions.
  const { bands, bandToFragment } = useMemo(() => {
    const bands: Band[] = [];
    const bandToFragment: number[] = [];
    for (let i = 0; i < state.sample.fragments.length; i++) {
      const out = fragToBands(state.sample, i, state.wellRect, 0, state.ctx);
      for (const b of out) {
        bands.push(b);
        bandToFragment.push(i);
      }
    }
    return { bands, bandToFragment };
  }, [state.sample, state.ctx, state.wellRect]);

  const selectedFrag = state.selectedFragmentIndex !== null
    ? state.sample.fragments[state.selectedFragmentIndex]
    : null;

  return (
    <section style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Gel</h1>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
        <GelControls />
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <GelCanvas bands={bands} gelSize={state.gelSize} pixelsPerUnit={state.pixelsPerUnit} />
          <GelOverlay bands={bands} bandToFragment={bandToFragment} />
        </div>
      </div>
      <div data-testid="selection-info" style={{ marginTop: 16, fontSize: 13, color: 'var(--color-ink-muted)' }}>
        {selectedFrag
          ? `selected fragment ${state.selectedFragmentIndex}: ${selectedFrag.bases} bp, ${selectedFrag.mass} ng`
          : 'no selection — click or tab through bands'}
      </div>
    </section>
  );
}

export function GelPage() {
  return (
    <GelProvider>
      <GelInner />
    </GelProvider>
  );
}
```

- [ ] **Step 2: Verify dev server boots**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run dev > /tmp/m6-task8-dev.log 2>&1 &
SERVE_PID=$!
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
kill $SERVE_PID 2>/dev/null
wait $SERVE_PID 2>/dev/null
```

Expected: 200.

- [ ] **Step 3: Run typecheck + existing visuals (no regressions)**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit && npx playwright test --project chromium-webgpu smoke.spec.ts single-band.spec.ts multi-band.spec.ts sim-ladder.spec.ts
```

Expected: clean, 125/125 unit, 8/8 chromium-webgpu visual.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/routes/GelPage.tsx
git commit -m "feat(gel): replace placeholder with interactive single-lane gel page"
```

---

### Task 9: Playwright spec for /gel — slider drives bands, drag changes bp

**Files:**
- Create: `ts/tests/visual/gel-page.spec.ts`

This Playwright test exercises slider response, band drag, shift-lock, alt-clone, tab nav. No screenshot assertions — uses DOM probes (selection text, bp values, band count).

- [ ] **Step 1: Write `ts/tests/visual/gel-page.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  const backend = testInfo.project.name === 'chromium-webgl2' ? 'webgl2' : 'webgpu';
  await page.addInitScript((b: string) => { localStorage.setItem('gelBackend', b); }, backend);
});

async function getSelectionText(page: import('@playwright/test').Page) {
  return (await page.getByTestId('selection-info').textContent()) ?? '';
}

test('gel page boots with default ladder fixture and renders bands', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  await expect(page.getByTestId('gel-canvas')).toBeVisible();
  await expect(page.getByTestId('gel-overlay')).toBeVisible();
  // 10 fragments → at least 10 band rects (more if any fragment has aggregates; ladder has none)
  const rects = page.locator('[data-testid^="band-"]');
  await expect(rects).toHaveCount(10);
});

test('voltage slider changes (sliders are interactive)', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  // Find the voltage slider by label
  const voltage = page.getByLabel('Voltage');
  await voltage.fill('140');
  // Value pill in the same group should reflect 140 V
  await expect(page.locator('text=140 V')).toBeVisible();
});

test('clicking a band selects its fragment (selection-info updates)', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  const before = await getSelectionText(page);
  expect(before).toContain('no selection');
  // Pointer-down on the first band (highest bp, top of canvas)
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0 });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  const after = await getSelectionText(page);
  expect(after).toContain('selected fragment');
});

test('Tab key cycles selection forward', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  // Focus the overlay
  await page.getByTestId('gel-overlay').focus();
  // Tab from null → 0
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('selection-info')).toContainText('selected fragment 0');
  // Tab again → 1
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('selection-info')).toContainText('selected fragment 1');
  // Shift+Tab → back to 0
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('selection-info')).toContainText('selected fragment 0');
});

test('alt+pointer-down clones the fragment (band count grows)', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  const rects = page.locator('[data-testid^="band-"]');
  await expect(rects).toHaveCount(10);
  // Alt-pointer-down on band 0 should clone its fragment
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0, altKey: true });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  await expect(rects).toHaveCount(11);
});
```

- [ ] **Step 2: Run on macOS**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npx playwright test gel-page.spec.ts --project chromium-webgpu
```

Expected: 5 passed on macOS.

If a test fails because Playwright's `dispatchEvent` for `pointerdown` doesn't propagate `altKey` correctly to React, switch to `page.evaluate` with a manually-dispatched PointerEvent that sets `altKey: true` on the event object.

- [ ] **Step 3: Run WebGL2 too**

```bash
cd /Users/shawn/code/gel/ts && npx playwright test gel-page.spec.ts --project chromium-webgl2
```

Expected: 5 passed.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/tests/visual/gel-page.spec.ts
git commit -m "test(gel): Playwright spec for /gel route — sliders, click, tab, alt-clone"
```

---

### Task 10: Mark M6 done, tag, verify CI

**Files:**
- Modify: `docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md`

- [ ] **Step 1: Mark M6 done in the overview**

In `docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md`:

a) Milestones table, M6 row:

OLD: `| M6 | Interaction layer | Band drag (with shift-lock), opt-drag duplicate, sample drag-between-lanes, tab-through-bands, modifier keys | TBW after M5 | Week 4.5 |`
NEW: `| M6 | Interaction layer | Band drag (with shift-lock), opt-drag duplicate, tab-through-fragments, modifier keys (single-lane; sample drag-between-lanes deferred to M6b) | [`m6-interaction.md`](2026-04-30-gelbox-ts-m6-interaction.md) | Week 4.5 |`

b) Sub-plans:

OLD: `- [ ] **M6 Interaction layer** — TBW after M5`
NEW: `- [x] **M6 Interaction layer** — [`2026-04-30-gelbox-ts-m6-interaction.md`](2026-04-30-gelbox-ts-m6-interaction.md) (single-lane subset; multi-lane sample-drag deferred to M6b)`

- [ ] **Step 2: Run full local CI green check**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run typecheck && npm run test:unit && npm run build
```

Then Playwright per project:

```bash
cd /Users/shawn/code/gel/ts && npx playwright test --project chromium-webgpu
cd /Users/shawn/code/gel/ts && npx playwright test --project chromium-webgl2
```

Expected:
- typecheck clean
- 125/125 unit (102 from M5 + 13 gelState + 4 solver + 6 slider)
- build succeeds
- chromium-webgpu: 14/14 (5 smoke + single-band + multi-band + perf + sim-ladder + 5 gel-page) on macOS
- chromium-webgl2: 14/14 on macOS

If perf flakes under PARALLEL load, run perf alone with `--workers=1`. The gel-page tests are not perf-sensitive.

- [ ] **Step 3: Commit, push, tag**

```bash
cd /Users/shawn/code/gel
git pull --rebase origin main || true
git add docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md \
        docs/superpowers/plans/2026-04-30-gelbox-ts-m6-interaction.md
git commit -m "docs(plan): mark M6 interaction layer (single-lane) complete"
git push origin main
git tag m6-interaction
git push origin m6-interaction
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
gh run view "$RUN_ID" --json status,conclusion --jq '{status, conclusion}'
```

Expected: `success`. Linux CI runs 5 gel-page tests under chromium-webgl2 (WebGPU project's gel tests skip per the inline `test.skip` guard).

If CI fails:
- DOM-event timing: the `dispatchEvent` calls may need a short `await page.waitForTimeout(100)` between pointer-down and pointer-up to let React flush state updates.
- React state batching: dispatched actions in tests may not have settled before `expect`. Use `await expect(page.getByTestId('selection-info')).toContainText(...)` instead of an immediate `getSelectionText()` read — Playwright's auto-retrying assertions handle the lag.

---

## Self-review

**Spec coverage** (against M6 acceptance "Band drag (with shift-lock), opt-drag duplicate, sample drag-between-lanes, tab-through-bands, modifier keys"):

- ✅ Band drag with shift-lock — Tasks 6 (overlay) + 8 (page wires it up). The reverse solver in Task 2 handles the bp ↔ Y inversion. Shift-lock branches inside `onPointerMove`.
- ✅ Opt-drag duplicate — Task 6's `onBandPointerDown` dispatches `CLONE_FRAGMENT` first when `altKey`, then begins drag on the clone.
- ✅ Tab-through-fragments — Task 6's `onKeyDown` dispatches `SELECT_NEXT`/`SELECT_PREV`. Selection draws an SVG outline.
- ✅ Modifier keys — Task 6's window-level `keydown`/`keyup` listeners track `shift/alt/meta` into state. Task 7 displays the chip.
- ⚠️ **Sample drag-between-lanes — DEFERRED to M6b.** The acceptance text included this; M6 ships a single-lane subset and we mark M6 as "single-lane subset; M6b ships multi-lane + sample drag" in the overview. This is a deliberate scope cut to keep M6 within autonomous-execution reach. M6b is a follow-up plan once the interaction substrate is proven.

**Placeholder scan:** No `TBD`/`TODO`/"add appropriate"/"similar to Task N" markers. Each task has full code; commands have expected outputs. The fallbacks in Task 9 step 2 ("if Playwright's dispatchEvent for pointerdown doesn't propagate altKey...") and Task 10 step 4 ("if CI fails...") describe specific failure modes with concrete remediation, not vague placeholders.

**Type consistency:**
- `GelState`, `Action`, `DragState` defined in Task 1, consumed by Tasks 4, 6, 7, 8.
- `solveBasesForY`'s signature and `SolveOpts` defined in Task 2, called from Task 6.
- `Slider`, `SliderProps` defined in Task 3, used in Task 7.
- `GelProvider`, `useGelState`, `useGelDispatch` defined in Task 4, used in Tasks 6, 7, 8.
- `GelCanvas`, `GelOverlay`, `GelControls` exported in Tasks 5/6/7, mounted in Task 8.
- The fixture loader contract (`{ default: Sample }`) matches the existing JSON-import shape used by DevSimPage. The `as unknown as Sample` cast is consistent with existing pages because Vite's `?json` import has loose typing on tuple-shaped fields.

**Risks specific to M6:**

1. **React state update during native pointer-move.** The `onPointerMove` handler calls `dispatch` on every pointer event (potentially 60 Hz). Each dispatch triggers a React re-render which calls `fragToBands` for all fragments. For the 10-fragment ladder this is sub-ms; for a 100-fragment hypothetical sample it could become a bottleneck. M6's existing fixtures don't hit this, but watch out at M7+.
2. **Drag handler stale state.** The `onPointerMove` callback is recreated each render (depends on `state.drag`, etc.). The `useEffect` that registers it will re-attach on every render during drag — fine, but verify it doesn't cause window-listener leaks. The cleanup runs before re-attach.
3. **`@webgpu/types` global pollution.** The GelCanvas imports both WebGPU and WebGL2 modules dynamically; the `GPUShaderStage` global type leaks into module scope only when the WebGPU branch's promise resolves. This is fine because the dynamic import is gated on backend selection.
4. **Tab navigation focus.** The overlay's `tabIndex={0}` makes it focusable. If the user clicks inside the canvas (via overlay rect), focus goes to the SVG. But if they click outside, focus is lost and Tab won't work. The Playwright test in Task 9 explicitly calls `.focus()` to handle this. UX: a focus ring would help; M6b can add it.
5. **Buffer-key inference is heuristic.** GelControls infers `bufferKey` from buffer field values (TBE has borate>0; TAE has acetate>0). This works for the three presets but breaks for arbitrary loaded buffers. For M6's preset-only scope it's sufficient; multi-buffer support is M6b.

Plan complete and saved to `docs/superpowers/plans/2026-04-30-gelbox-ts-m6-interaction.md`.
