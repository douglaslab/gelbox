# M6b — Multi-Lane + Sample Drag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining M6 acceptance gap: multi-lane state (`samples: (Sample|null)[]`), microtube icons above the gel canvas, sample drag-between-lanes, opt-drag-microtube to clone a sample. Builds directly on M6 (commit `87ec9d6`).

**Architecture:** Refactor `GelState` from `sample: Sample` to `samples: (Sample|null)[]` of fixed length 7 (per the C++ default). `wellRect` becomes `wellRects: Rect[]` computed from `numLanes` and gel-width. Add a `<MicrotubeRow>` component above the canvas with one SVG circle/icon per lane. Drag a microtube to another lane → `MOVE_SAMPLE { from, to }`. Alt-drag → `CLONE_SAMPLE_TO_LANE { from, to }`. Per-lane fragToBands accumulation. Bands gain an implicit `laneIndex` via the per-fragment dispatch loop in GelPage; the existing `band → fragment` mapping in the overlay extends to `band → (lane, fragment)`.

**Tech Stack:** Same as M6. No new deps.

**M6b reference:** C++ source at `~/code/gelbox/src/GelView.cpp:469–491` (microtube click + alt-drag), `:1185-1196` (lane pick), `~/code/gelbox/include/Gel.h` (multi-sample storage), `~/code/gelbox/src/GelView.cpp:1261-1271` (calcMicrotubeWellRect). C++ has up to `mSliderNumLanesMax=20`; we ship 7.

---

## Scope

**In M6b:**
- `ts/src/lib/gel/gelState.ts` — refactor to multi-lane: `samples`, `wellRects`, `numLanes`, `selectedLane`, drag types include lane, `MOVE_SAMPLE`, `CLONE_SAMPLE_TO_LANE`, `BEGIN_SAMPLE_DRAG`, `END_SAMPLE_DRAG`.
- `ts/tests/unit/gelState.test.ts` — extend tests to cover multi-lane shape + sample-drag actions.
- `ts/src/components/gel/MicrotubeRow.tsx` — SVG row of microtube icons above the canvas; pointer-drag dispatches sample-drag actions.
- `ts/src/components/gel/GelOverlay.tsx` — already accepts `bandToFragment[]`; extend to `bandToLaneFragment[]` (array of `{lane, fragment}` tuples) so band drag dispatches lane-aware actions.
- `ts/src/routes/GelPage.tsx` — compute bands per lane via nested loop; pass through to overlay; render MicrotubeRow above canvas.
- `ts/src/components/chrome/GelControls.tsx` — render lane info in the modifier chip (e.g., "lane 0 selected").
- `ts/tests/visual/gel-page.spec.ts` — extend with multi-lane test (drag microtube to empty lane).
- Phase 1 overview: M6b row added, tagged `m6b-multilane`, CI green.

**Out of M6b (deferred):**
- NumLanes slider (fixed at 7).
- Per-fragment color picker / fragment editor panel.
- Loupes (M7).
- Save/load (M8).
- Buffer chemistry sliders (currently dropdown only).
- Multi-sample fixtures beyond "lane 0 only" (sample loader still loads into lane 0).

**Non-goals:**
- Per-lane buffer (all lanes share `gelBuffer`; per-sample `sampleBuffer` is preserved per Sample but not yet UI-editable).
- DnD between samples (e.g., dragging a fragment from one sample to another) — only sample-level drag for now.

---

## Decisions for this milestone

| Decision | Reason |
|---|---|
| Fixed `numLanes = 7` (matches C++ `mSliderNumLanesMin`) | Avoids slider plumbing overhead; M6b shippable in tight scope |
| `samples: (Sample \| null)[]` of length numLanes (sparse array) | C++ uses a similar sparse model. `null` = empty lane. Sample loader fills lane 0 by default |
| Lane geometry: `laneWidth = gelWidth / numLanes`, well y-range stays `(8, 18)` | Even split. Microtubes sit above each lane center |
| Microtube y-position: `y = -32` (above canvas, but rendered in the same SVG via negative-y) | Keeps everything in one SVG with a flexible viewBox so pointer events propagate cleanly |
| Microtube hit area: a 16×16 circle at `(laneCenterX, -22)` | Generous click target |
| Sample drag uses ABSOLUTE swap, NOT visual translation while dragging | Matches C++ behavior; mouse-up commits the destination lane |
| Alt-drag clones the source sample into the target lane (overwrite if non-empty) | Matches C++ `make_shared<Sample>(*src)` clone semantics |
| Selected lane (the one whose fragment editing is in scope) highlighted with a tinted background rect behind the microtube | Subtle visual; not in the canvas itself |
| BandToLaneFragment is `Array<{ lane: number; fragment: number }>` | Replaces M6's flat `number[]`. The overlay dispatches `BEGIN_DRAG` with both indices |

---

## File structure for M6b

```
ts/
  src/
    lib/
      gel/
        gelState.ts                          # MODIFY: multi-lane state shape
    components/
      gel/
        GelContext.tsx                       # UNCHANGED (Provider transparent to state shape)
        GelCanvas.tsx                        # UNCHANGED (takes Band[])
        GelOverlay.tsx                       # MODIFY: bandToLaneFragment instead of bandToFragment
        MicrotubeRow.tsx                     # NEW
      chrome/
        GelControls.tsx                      # MODIFY: load fixture into a chosen lane; show selected lane
    routes/
      GelPage.tsx                            # MODIFY: per-lane fragToBands, mount MicrotubeRow
  tests/
    unit/
      gelState.test.ts                       # EXTEND: multi-lane + sample drag actions
    visual/
      gel-page.spec.ts                       # EXTEND: microtube drag test
docs/
  superpowers/
    plans/
      2026-04-27-gelbox-ts-phase-1-overview.md  # MODIFY: M6b row added
      2026-04-30-gelbox-ts-m6b-multilane.md     # this file
```

---

## Reference: New GelState shape

```ts
export interface DragState {
  type:           'band' | 'sample';
  laneIndex:      number;          // for both band and sample drags
  fragmentIndex?: number;          // band drag only
  startY?:        number;          // band drag only
  startBases?:    number;          // band drag only
}

export interface GelState {
  samples:               (Sample | null)[];   // length = numLanes
  numLanes:              number;
  ctx:                   SimContext;
  selectedLane:          number;               // 0..numLanes-1; defaults to 0
  selectedFragmentIndex: number | null;        // within selectedLane's sample
  fixtureKey:            string;
  modifiers:             { shift: boolean; alt: boolean; meta: boolean };
  drag:                  DragState | null;
  gelSize:               { width: number; height: number };
  pixelsPerUnit:         number;
  wellRects:             Rect[];               // length = numLanes; computed from numLanes + gelSize
}

// New actions:
| { type: 'SET_SELECTED_LANE'; laneIndex: number }
| { type: 'BEGIN_SAMPLE_DRAG'; laneIndex: number }
| { type: 'END_SAMPLE_DRAG' }
| { type: 'MOVE_SAMPLE'; from: number; to: number }            // swap
| { type: 'CLONE_SAMPLE_TO_LANE'; from: number; to: number }   // overwrite
```

---

## Tasks

### Task 1: GelState refactor for multi-lane

**Files:**
- Modify: `ts/src/lib/gel/gelState.ts`
- Modify: `ts/tests/unit/gelState.test.ts`

This is the foundational refactor. The reducer shape changes; existing M6 actions migrate (`BEGIN_DRAG` adds `laneIndex`, `SET_FRAGMENT_BASES` adds `laneIndex`, `CLONE_FRAGMENT` adds `laneIndex`). Existing M6 tests update inline.

- [ ] **Step 1: Rewrite `ts/src/lib/gel/gelState.ts`**

```ts
import type { Sample, Fragment } from '../sim/sample';
import type { SimContext } from '../sim/gelSim';
import type { Rect } from '../sim/band';
import { BUFFER_TBE, BUFFER_TAE, BUFFER_H2O } from '../sim/buffer';
import ladder from '../../../fixtures/states/ladder-1kb.json';

const NUM_LANES = 7;
const GEL_SIZE = { width: 320, height: 240 };
const WELL_Y1 = 8;
const WELL_Y2 = 18;

export interface BandDrag {
  type:          'band';
  laneIndex:     number;
  fragmentIndex: number;
  startY:        number;
  startBases:    number;
}
export interface SampleDrag {
  type:      'sample';
  laneIndex: number;
}
export type DragState = BandDrag | SampleDrag;

export interface GelState {
  samples:               (Sample | null)[];
  numLanes:              number;
  ctx:                   SimContext;
  selectedLane:          number;
  selectedFragmentIndex: number | null;
  fixtureKey:            string;
  modifiers:             { shift: boolean; alt: boolean; meta: boolean };
  drag:                  DragState | null;
  gelSize:               { width: number; height: number };
  pixelsPerUnit:         number;
  wellRects:             Rect[];
}

export type Action =
  | { type: 'SET_VOLTAGE';        value: number }
  | { type: 'SET_TIME';           value: number }
  | { type: 'SET_WELL_DAMAGE';    value: number }
  | { type: 'SET_GEL_BUFFER';     value: 'TBE' | 'TAE' | 'H2O' }
  | { type: 'LOAD_FIXTURE';       key: string; sample: Sample; lane: number }
  | { type: 'SET_SELECTED_LANE';  laneIndex: number }
  | { type: 'SET_SELECTED';       laneIndex: number; index: number | null }
  | { type: 'SELECT_NEXT' }
  | { type: 'SELECT_PREV' }
  | { type: 'BEGIN_DRAG';         laneIndex: number; fragmentIndex: number; startY: number }
  | { type: 'END_DRAG' }
  | { type: 'BEGIN_SAMPLE_DRAG';  laneIndex: number }
  | { type: 'END_SAMPLE_DRAG' }
  | { type: 'MOVE_SAMPLE';        from: number; to: number }
  | { type: 'CLONE_SAMPLE_TO_LANE'; from: number; to: number }
  | { type: 'CLONE_FRAGMENT';     laneIndex: number; sourceIndex: number }
  | { type: 'SET_FRAGMENT_BASES'; laneIndex: number; index: number; bases: number }
  | { type: 'SET_MODIFIERS';      modifiers: { shift: boolean; alt: boolean; meta: boolean } };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const BUFFER_BY_KEY = {
  TBE: BUFFER_TBE,
  TAE: BUFFER_TAE,
  H2O: BUFFER_H2O,
} as const;

function computeWellRects(numLanes: number, gelSize: { width: number; height: number }): Rect[] {
  const laneWidth = gelSize.width / numLanes;
  const wellWidth = laneWidth * 0.7;
  const out: Rect[] = [];
  for (let i = 0; i < numLanes; i++) {
    const cx = laneWidth * (i + 0.5);
    out.push({ x1: cx - wellWidth / 2, y1: WELL_Y1, x2: cx + wellWidth / 2, y2: WELL_Y2 });
  }
  return out;
}

export function initialGelState(): GelState {
  const sample = ladder as unknown as Sample;
  const samples: (Sample | null)[] = new Array(NUM_LANES).fill(null);
  samples[0] = sample;
  return {
    samples,
    numLanes: NUM_LANES,
    ctx: {
      voltage: 70,
      time:    0.5,
      ySpaceScale: 200,
      wellDamage: 0,
      gelBuffer: BUFFER_TBE,
      sampleBuffer: sample.buffer,
    },
    selectedLane: 0,
    selectedFragmentIndex: null,
    fixtureKey: 'ladder-1kb',
    modifiers: { shift: false, alt: false, meta: false },
    drag: null,
    gelSize: GEL_SIZE,
    pixelsPerUnit: 1,
    wellRects: computeWellRects(NUM_LANES, GEL_SIZE),
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
    case 'LOAD_FIXTURE': {
      const samples = state.samples.slice();
      samples[action.lane] = action.sample;
      return {
        ...state,
        samples,
        fixtureKey: action.key,
        selectedLane: action.lane,
        selectedFragmentIndex: null,
        ctx: { ...state.ctx, sampleBuffer: action.sample.buffer },
        drag: null,
      };
    }
    case 'SET_SELECTED_LANE':
      return { ...state, selectedLane: action.laneIndex, selectedFragmentIndex: null };
    case 'SET_SELECTED':
      return { ...state, selectedLane: action.laneIndex, selectedFragmentIndex: action.index };
    case 'SELECT_NEXT': {
      const sample = state.samples[state.selectedLane];
      if (!sample) return state;
      const n = sample.fragments.length;
      if (n === 0) return state;
      const cur = state.selectedFragmentIndex;
      const next = cur === null ? 0 : (cur + 1) % n;
      return { ...state, selectedFragmentIndex: next };
    }
    case 'SELECT_PREV': {
      const sample = state.samples[state.selectedLane];
      if (!sample) return state;
      const n = sample.fragments.length;
      if (n === 0) return state;
      const cur = state.selectedFragmentIndex;
      const prev = cur === null ? n - 1 : (cur - 1 + n) % n;
      return { ...state, selectedFragmentIndex: prev };
    }
    case 'BEGIN_DRAG': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const frag = sample.fragments[action.fragmentIndex];
      if (!frag) return state;
      return {
        ...state,
        drag: {
          type: 'band',
          laneIndex: action.laneIndex,
          fragmentIndex: action.fragmentIndex,
          startY: action.startY,
          startBases: frag.bases,
        },
        selectedLane: action.laneIndex,
        selectedFragmentIndex: action.fragmentIndex,
      };
    }
    case 'END_DRAG':
      return { ...state, drag: null };
    case 'BEGIN_SAMPLE_DRAG':
      return { ...state, drag: { type: 'sample', laneIndex: action.laneIndex } };
    case 'END_SAMPLE_DRAG':
      return { ...state, drag: null };
    case 'MOVE_SAMPLE': {
      if (action.from === action.to) return state;
      const samples = state.samples.slice();
      const tmp = samples[action.from];
      samples[action.from] = samples[action.to];
      samples[action.to] = tmp;
      return { ...state, samples, selectedLane: action.to, drag: null };
    }
    case 'CLONE_SAMPLE_TO_LANE': {
      if (action.from === action.to) return state;
      const src = state.samples[action.from];
      if (!src) return state;
      const samples = state.samples.slice();
      samples[action.to] = { ...src, fragments: src.fragments.map((f) => ({ ...f })) };
      return { ...state, samples, selectedLane: action.to, drag: null };
    }
    case 'CLONE_FRAGMENT': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const src = sample.fragments[action.sourceIndex];
      if (!src) return state;
      const fragments: Fragment[] = [
        ...sample.fragments.slice(0, action.sourceIndex + 1),
        { ...src },
        ...sample.fragments.slice(action.sourceIndex + 1),
      ];
      const samples = state.samples.slice();
      samples[action.laneIndex] = { ...sample, fragments };
      return {
        ...state,
        samples,
        selectedLane: action.laneIndex,
        selectedFragmentIndex: action.sourceIndex + 1,
      };
    }
    case 'SET_FRAGMENT_BASES': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, bases: action.bases } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = { ...sample, fragments };
      return { ...state, samples };
    }
    case 'SET_MODIFIERS':
      return { ...state, modifiers: action.modifiers };
    default: {
      const _: never = action;
      void _;
      return state;
    }
  }
}
```

- [ ] **Step 2: Replace `ts/tests/unit/gelState.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { gelReducer, initialGelState, type GelState } from '../../src/lib/gel/gelState';
import { BUFFER_TBE, BUFFER_TAE, BUFFER_H2O } from '../../src/lib/sim/buffer';

const STARTING: GelState = initialGelState();

describe('gelReducer (multi-lane)', () => {
  it('initial state has 7 lanes with sample at lane 0 only', () => {
    expect(STARTING.numLanes).toBe(7);
    expect(STARTING.samples.length).toBe(7);
    expect(STARTING.samples[0]).not.toBeNull();
    for (let i = 1; i < 7; i++) expect(STARTING.samples[i]).toBeNull();
    expect(STARTING.wellRects.length).toBe(7);
    expect(STARTING.selectedLane).toBe(0);
  });
  it('SET_VOLTAGE updates ctx.voltage', () => {
    expect(gelReducer(STARTING, { type: 'SET_VOLTAGE', value: 140 }).ctx.voltage).toBe(140);
  });
  it('SET_TIME clamps to [0,1]', () => {
    expect(gelReducer(STARTING, { type: 'SET_TIME', value: 2 }).ctx.time).toBe(1);
    expect(gelReducer(STARTING, { type: 'SET_TIME', value: -0.5 }).ctx.time).toBe(0);
  });
  it('SET_WELL_DAMAGE clamps', () => {
    expect(gelReducer(STARTING, { type: 'SET_WELL_DAMAGE', value: 0.5 }).ctx.wellDamage).toBe(0.5);
  });
  it('SET_GEL_BUFFER updates preset', () => {
    expect(gelReducer(STARTING, { type: 'SET_GEL_BUFFER', value: 'TAE' }).ctx.gelBuffer).toEqual(BUFFER_TAE);
    expect(gelReducer(STARTING, { type: 'SET_GEL_BUFFER', value: 'H2O' }).ctx.gelBuffer).toEqual(BUFFER_H2O);
    expect(gelReducer(STARTING, { type: 'SET_GEL_BUFFER', value: 'TBE' }).ctx.gelBuffer).toEqual(BUFFER_TBE);
  });
  it('SET_SELECTED_LANE clears fragment selection', () => {
    const s = { ...STARTING, selectedFragmentIndex: 2 };
    const next = gelReducer(s, { type: 'SET_SELECTED_LANE', laneIndex: 3 });
    expect(next.selectedLane).toBe(3);
    expect(next.selectedFragmentIndex).toBeNull();
  });
  it('SELECT_NEXT cycles within selected lane', () => {
    const sample = STARTING.samples[0]!;
    const n = sample.fragments.length;
    if (n === 0) return;
    const next1 = gelReducer({ ...STARTING, selectedFragmentIndex: 0 }, { type: 'SELECT_NEXT' });
    expect(next1.selectedFragmentIndex).toBe(1 % n);
    // From an empty lane, no-op
    const empty = gelReducer({ ...STARTING, selectedLane: 1 }, { type: 'SELECT_NEXT' });
    expect(empty.selectedFragmentIndex).toBeNull();
  });
  it('SELECT_PREV from null goes to last fragment', () => {
    const sample = STARTING.samples[0]!;
    const n = sample.fragments.length;
    if (n === 0) return;
    const prev = gelReducer({ ...STARTING, selectedFragmentIndex: null }, { type: 'SELECT_PREV' });
    expect(prev.selectedFragmentIndex).toBe(n - 1);
  });
  it('BEGIN_DRAG (band) stores lane + fragment + startBases', () => {
    const sample = STARTING.samples[0]!;
    if (sample.fragments.length === 0) return;
    const next = gelReducer(STARTING, { type: 'BEGIN_DRAG', laneIndex: 0, fragmentIndex: 0, startY: 100 });
    expect(next.drag).not.toBeNull();
    expect(next.drag!.type).toBe('band');
    if (next.drag!.type === 'band') {
      expect(next.drag!.laneIndex).toBe(0);
      expect(next.drag!.fragmentIndex).toBe(0);
      expect(next.drag!.startBases).toBe(sample.fragments[0].bases);
    }
  });
  it('BEGIN_DRAG on empty lane is a no-op', () => {
    const next = gelReducer(STARTING, { type: 'BEGIN_DRAG', laneIndex: 1, fragmentIndex: 0, startY: 100 });
    expect(next.drag).toBeNull();
  });
  it('END_DRAG clears drag', () => {
    const dragging = gelReducer(STARTING, { type: 'BEGIN_DRAG', laneIndex: 0, fragmentIndex: 0, startY: 100 });
    expect(gelReducer(dragging, { type: 'END_DRAG' }).drag).toBeNull();
  });
  it('SET_FRAGMENT_BASES targets the right lane', () => {
    const next = gelReducer(STARTING, { type: 'SET_FRAGMENT_BASES', laneIndex: 0, index: 0, bases: 5000 });
    expect(next.samples[0]!.fragments[0].bases).toBe(5000);
    // Other lanes untouched
    for (let i = 1; i < 7; i++) expect(next.samples[i]).toBeNull();
  });
  it('CLONE_FRAGMENT inserts in the right lane', () => {
    const sample = STARTING.samples[0]!;
    const before = sample.fragments.length;
    const next = gelReducer(STARTING, { type: 'CLONE_FRAGMENT', laneIndex: 0, sourceIndex: 0 });
    expect(next.samples[0]!.fragments.length).toBe(before + 1);
    expect(next.selectedFragmentIndex).toBe(1);
  });
  it('BEGIN_SAMPLE_DRAG / END_SAMPLE_DRAG', () => {
    const begun = gelReducer(STARTING, { type: 'BEGIN_SAMPLE_DRAG', laneIndex: 0 });
    expect(begun.drag).toEqual({ type: 'sample', laneIndex: 0 });
    expect(gelReducer(begun, { type: 'END_SAMPLE_DRAG' }).drag).toBeNull();
  });
  it('MOVE_SAMPLE swaps two lanes', () => {
    const next = gelReducer(STARTING, { type: 'MOVE_SAMPLE', from: 0, to: 3 });
    expect(next.samples[0]).toBeNull();
    expect(next.samples[3]).toEqual(STARTING.samples[0]);
    expect(next.selectedLane).toBe(3);
  });
  it('MOVE_SAMPLE with from === to is a no-op', () => {
    const next = gelReducer(STARTING, { type: 'MOVE_SAMPLE', from: 0, to: 0 });
    expect(next).toEqual(STARTING);
  });
  it('CLONE_SAMPLE_TO_LANE deep-copies', () => {
    const next = gelReducer(STARTING, { type: 'CLONE_SAMPLE_TO_LANE', from: 0, to: 4 });
    expect(next.samples[0]).not.toBeNull();
    expect(next.samples[4]).not.toBeNull();
    expect(next.samples[4]).not.toBe(next.samples[0]);  // different object
    expect(next.samples[4]!.fragments).not.toBe(next.samples[0]!.fragments);  // different array
    expect(next.selectedLane).toBe(4);
  });
  it('CLONE_SAMPLE_TO_LANE is a no-op if source is null', () => {
    const next = gelReducer(STARTING, { type: 'CLONE_SAMPLE_TO_LANE', from: 5, to: 4 });
    expect(next.samples[4]).toBeNull();
  });
  it('LOAD_FIXTURE loads into specified lane', () => {
    const sample = STARTING.samples[0]!;
    const next = gelReducer(STARTING, { type: 'LOAD_FIXTURE', key: 'test', sample, lane: 2 });
    expect(next.samples[2]).toEqual(sample);
    expect(next.selectedLane).toBe(2);
    expect(next.fixtureKey).toBe('test');
  });
  it('SET_MODIFIERS updates state', () => {
    const next = gelReducer(STARTING, { type: 'SET_MODIFIERS', modifiers: { shift: true, alt: false, meta: false } });
    expect(next.modifiers.shift).toBe(true);
  });
});
```

- [ ] **Step 3: Run unit tests**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/gelState.test.ts
```

Expected: 21 tests pass.

- [ ] **Step 4: Run full unit suite + typecheck**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: typecheck — likely fails because `GelOverlay.tsx`, `GelControls.tsx`, `GelPage.tsx` reference fields that no longer exist (`state.sample`, `state.wellRect`, etc.). That's expected — Tasks 2-5 fix those. For now, document the breakage if any.

If typecheck does produce errors, that's expected. Proceed to Task 2 to fix.

- [ ] **Step 5: Commit (with broken downstream typecheck — fix in next tasks)**

```bash
cd /Users/shawn/code/gel
git add ts/src/lib/gel/gelState.ts ts/tests/unit/gelState.test.ts
git commit -m "refactor(gel): GelState multi-lane shape + sample-drag actions"
```

NOTE: this commit may have a broken typecheck (downstream consumers like GelOverlay still reference single-sample state). Tasks 2-5 will fix them. Proceed sequentially, not in parallel.

---

### Task 2: Update GelOverlay for multi-lane bandToLaneFragment

**Files:**
- Modify: `ts/src/components/gel/GelOverlay.tsx`

The overlay receives a `bandToLaneFragment: Array<{ lane, fragment }>` mapping. Drag actions dispatch with the lane field. The selected band's outline is computed from the new selectedLane + selectedFragmentIndex.

- [ ] **Step 1: Replace `ts/src/components/gel/GelOverlay.tsx`**

```tsx
import { useCallback, useEffect, useRef } from 'react';
import type { Band } from '../../lib/sim/band';
import { useGelState, useGelDispatch } from './GelContext';
import { solveBasesForY } from '../../lib/sim/solver';

export interface BandLaneFragment {
  lane:     number;
  fragment: number;
}

interface GelOverlayProps {
  bands:               Band[];
  bandToLaneFragment:  BandLaneFragment[];
}

export function GelOverlay({ bands, bandToLaneFragment }: GelOverlayProps) {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const svgRef = useRef<SVGSVGElement>(null);

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

  const onKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      dispatch({ type: e.shiftKey ? 'SELECT_PREV' : 'SELECT_NEXT' });
    }
  };

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!state.drag || state.drag.type !== 'band' || !svgRef.current) return;
    if (state.modifiers.shift) {
      dispatch({
        type: 'SET_FRAGMENT_BASES',
        laneIndex: state.drag.laneIndex,
        index: state.drag.fragmentIndex,
        bases: state.drag.startBases,
      });
      return;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
    const sample = state.samples[state.drag.laneIndex];
    if (!sample) return;
    const frag = sample.fragments[state.drag.fragmentIndex];
    if (!frag) return;
    const newBases = solveBasesForY({
      targetY: y,
      frag,
      lane:    state.drag.laneIndex,
      ctx:     state.ctx,
      wellRect: state.wellRects[state.drag.laneIndex],
    });
    if (newBases !== frag.bases) {
      dispatch({
        type: 'SET_FRAGMENT_BASES',
        laneIndex: state.drag.laneIndex,
        index: state.drag.fragmentIndex,
        bases: newBases,
      });
    }
  }, [state.drag, state.modifiers.shift, state.samples, state.ctx, state.wellRects, state.gelSize.height, dispatch]);

  const onPointerUp = useCallback(() => {
    if (state.drag && state.drag.type === 'band') dispatch({ type: 'END_DRAG' });
  }, [state.drag, dispatch]);

  useEffect(() => {
    if (!state.drag || state.drag.type !== 'band') return;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [state.drag, onPointerMove, onPointerUp]);

  function onBandPointerDown(bandIdx: number, e: React.PointerEvent<SVGRectElement>) {
    e.preventDefault();
    const { lane, fragment } = bandToLaneFragment[bandIdx];
    if (e.altKey) {
      dispatch({ type: 'CLONE_FRAGMENT', laneIndex: lane, sourceIndex: fragment });
      const rect = svgRef.current!.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
      dispatch({ type: 'BEGIN_DRAG', laneIndex: lane, fragmentIndex: fragment + 1, startY: y });
    } else {
      const rect = svgRef.current!.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
      dispatch({ type: 'BEGIN_DRAG', laneIndex: lane, fragmentIndex: fragment, startY: y });
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
        pointerEvents: 'auto',
      }}
    >
      {bands.map((b, i) => {
        const upExt = Math.max(b.smearAbove, b.flameHeight);
        const x = b.rect.x1 - b.blur;
        const w = (b.rect.x2 - b.rect.x1) + 2 * b.blur;
        const y = b.rect.y1 - upExt - b.blur;
        const h = (b.rect.y2 - b.rect.y1) + upExt + b.smearBelow + 2 * b.blur;
        const lf = bandToLaneFragment[i];
        const selected = state.selectedLane === lf.lane && state.selectedFragmentIndex === lf.fragment;
        return (
          <rect
            key={i}
            data-testid={`band-${i}`}
            data-lane-index={lf.lane}
            data-fragment-index={lf.fragment}
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

- [ ] **Step 2: Verify typecheck**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck
```

Expected: GelControls + GelPage still broken (those are Tasks 3, 4). Overlay should be fine.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/components/gel/GelOverlay.tsx
git commit -m "refactor(gel): GelOverlay → bandToLaneFragment for multi-lane addressing"
```

---

### Task 3: Update GelControls to load fixture into a chosen lane

**Files:**
- Modify: `ts/src/components/chrome/GelControls.tsx`

The fixture loader now takes a target lane (defaults to selected lane). Modifier chip extends to show selected lane.

- [ ] **Step 1: Replace `ts/src/components/chrome/GelControls.tsx`**

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
        <label style={{ color: 'var(--color-ink)', fontSize: 13 }}>Sample → lane {state.selectedLane}</label>
        <select
          data-testid="fixture-select"
          value={state.fixtureKey}
          onChange={async (e) => {
            const fixture = FIXTURES.find((f) => f.key === e.target.value);
            if (!fixture) return;
            const mod = await fixture.loader();
            dispatch({ type: 'LOAD_FIXTURE', key: fixture.key, sample: mod.default, lane: state.selectedLane });
          }}
        >
          {FIXTURES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
      </div>
      <div data-testid="modifiers" style={{ fontSize: 12, color: 'var(--color-ink-muted)', fontFamily: 'monospace' }}>
        lane {state.selectedLane} · modifiers: {[
          state.modifiers.shift ? 'shift' : null,
          state.modifiers.alt   ? 'alt'   : null,
          state.modifiers.meta  ? 'meta'  : null,
        ].filter(Boolean).join(' + ') || '—'}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck
```

Expected: GelPage still broken (Task 4); other files fine.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/components/chrome/GelControls.tsx
git commit -m "refactor(gel): GelControls — fixture loader targets selected lane; chip shows lane"
```

---

### Task 4: MicrotubeRow component

**Files:**
- Create: `ts/src/components/gel/MicrotubeRow.tsx`

SVG row of one microtube circle per lane. Pointer-drag dispatches `BEGIN_SAMPLE_DRAG`, tracks pointer-move to find target lane, dispatches `MOVE_SAMPLE` (or `CLONE_SAMPLE_TO_LANE` if alt) on pointer-up.

- [ ] **Step 1: Write `ts/src/components/gel/MicrotubeRow.tsx`**

```tsx
import { useCallback, useEffect, useRef } from 'react';
import { useGelState, useGelDispatch } from './GelContext';

const MICROTUBE_Y = 12;            // SVG-y of microtube center (above the canvas via negative)
const MICROTUBE_R = 10;            // radius

interface MicrotubeRowProps {
  // Width / height of the gel canvas in CSS pixels (matches GelCanvas). The
  // SVG viewBox spans [-extra, ..., gelWidth, ..., gelHeight + extra] but for
  // M6b we render only the row above the canvas — height = 2*MICROTUBE_Y.
}

export function MicrotubeRow(_props: MicrotubeRowProps) {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const svgRef = useRef<SVGSVGElement>(null);
  const rowHeight = MICROTUBE_Y * 2 + MICROTUBE_R + 4;

  const laneAtClientX = useCallback((clientX: number): number => {
    if (!svgRef.current) return state.selectedLane;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * state.gelSize.width;
    const idx = Math.floor(x / (state.gelSize.width / state.numLanes));
    return Math.max(0, Math.min(state.numLanes - 1, idx));
  }, [state.gelSize.width, state.numLanes, state.selectedLane]);

  const onPointerMove = useCallback((_e: PointerEvent) => {
    // No live preview in M6b; just hold drag state until release
  }, []);

  const onPointerUp = useCallback((e: PointerEvent) => {
    if (!state.drag || state.drag.type !== 'sample') return;
    const targetLane = laneAtClientX(e.clientX);
    if (targetLane === state.drag.laneIndex) {
      dispatch({ type: 'END_SAMPLE_DRAG' });
      return;
    }
    if (e.altKey) {
      dispatch({ type: 'CLONE_SAMPLE_TO_LANE', from: state.drag.laneIndex, to: targetLane });
    } else {
      dispatch({ type: 'MOVE_SAMPLE', from: state.drag.laneIndex, to: targetLane });
    }
  }, [state.drag, laneAtClientX, dispatch]);

  useEffect(() => {
    if (!state.drag || state.drag.type !== 'sample') return;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [state.drag, onPointerMove, onPointerUp]);

  function onMicrotubePointerDown(laneIndex: number, e: React.PointerEvent<SVGCircleElement>) {
    if (state.samples[laneIndex] === null) {
      // Empty lane: just select it, don't start drag
      dispatch({ type: 'SET_SELECTED_LANE', laneIndex });
      return;
    }
    e.preventDefault();
    dispatch({ type: 'BEGIN_SAMPLE_DRAG', laneIndex });
  }

  function onMicrotubeClick(laneIndex: number) {
    // Without movement (mouseUp == mouseDown lane), the BEGIN_SAMPLE_DRAG → END_SAMPLE_DRAG path runs.
    // This handler is mostly for empty-lane selection.
    dispatch({ type: 'SET_SELECTED_LANE', laneIndex });
  }

  const laneWidth = state.gelSize.width / state.numLanes;

  return (
    <svg
      data-testid="microtube-row"
      ref={svgRef}
      viewBox={`0 0 ${state.gelSize.width} ${rowHeight}`}
      style={{
        width:  `${state.gelSize.width  * state.pixelsPerUnit}px`,
        height: `${rowHeight * state.pixelsPerUnit}px`,
        display: 'block',
      }}
    >
      {Array.from({ length: state.numLanes }, (_, i) => {
        const cx = laneWidth * (i + 0.5);
        const isSelected = state.selectedLane === i;
        const hasSample = state.samples[i] !== null;
        const dragging = state.drag?.type === 'sample' && state.drag.laneIndex === i;
        return (
          <g key={i}>
            {isSelected && (
              <rect
                x={i * laneWidth} y={0} width={laneWidth} height={rowHeight}
                fill="var(--color-surface-raised, rgba(80,80,150,0.2))"
              />
            )}
            <circle
              data-testid={`microtube-${i}`}
              data-lane-index={i}
              cx={cx} cy={MICROTUBE_Y}
              r={MICROTUBE_R}
              fill={hasSample ? 'var(--color-accent, #88aaff)' : 'transparent'}
              stroke={hasSample ? '#fff' : 'var(--color-ink-muted, #888)'}
              strokeWidth={1}
              opacity={dragging ? 0.5 : 1}
              style={{ cursor: hasSample ? 'grab' : 'pointer' }}
              onPointerDown={(e) => onMicrotubePointerDown(i, e)}
              onClick={() => onMicrotubeClick(i)}
            />
            <text
              x={cx} y={MICROTUBE_Y + 3}
              textAnchor="middle"
              fontSize={9}
              fill={hasSample ? '#fff' : 'var(--color-ink-muted, #888)'}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck
```

Expected: GelPage still broken (Task 5).

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/components/gel/MicrotubeRow.tsx
git commit -m "feat(gel): MicrotubeRow — SVG row of draggable microtubes per lane"
```

---

### Task 5: Update GelPage for multi-lane

**Files:**
- Modify: `ts/src/routes/GelPage.tsx`

Compute bands per (lane, sample, fragment) — nested loop. Build `bandToLaneFragment` parallel array. Mount MicrotubeRow above the canvas.

- [ ] **Step 1: Replace `ts/src/routes/GelPage.tsx`**

```tsx
import { useMemo } from 'react';
import { GelProvider, useGelState } from '../components/gel/GelContext';
import { GelCanvas } from '../components/gel/GelCanvas';
import { GelOverlay, type BandLaneFragment } from '../components/gel/GelOverlay';
import { GelControls } from '../components/chrome/GelControls';
import { MicrotubeRow } from '../components/gel/MicrotubeRow';
import { fragToBands } from '../lib/sim/gelSim';
import type { Band } from '../lib/sim/band';

function GelInner() {
  const state = useGelState();

  const { bands, bandToLaneFragment } = useMemo(() => {
    const bands: Band[] = [];
    const bandToLaneFragment: BandLaneFragment[] = [];
    for (let lane = 0; lane < state.numLanes; lane++) {
      const sample = state.samples[lane];
      if (!sample) continue;
      for (let fragi = 0; fragi < sample.fragments.length; fragi++) {
        const out = fragToBands(sample, fragi, state.wellRects[lane], lane, state.ctx);
        for (const b of out) {
          bands.push(b);
          bandToLaneFragment.push({ lane, fragment: fragi });
        }
      }
    }
    return { bands, bandToLaneFragment };
  }, [state.samples, state.ctx, state.wellRects, state.numLanes]);

  const selectedSample = state.samples[state.selectedLane];
  const selectedFrag = selectedSample && state.selectedFragmentIndex !== null
    ? selectedSample.fragments[state.selectedFragmentIndex]
    : null;

  return (
    <section style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Gel</h1>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
        <GelControls />
        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <MicrotubeRow />
          <div style={{ position: 'relative' }}>
            <GelCanvas bands={bands} gelSize={state.gelSize} pixelsPerUnit={state.pixelsPerUnit} />
            <GelOverlay bands={bands} bandToLaneFragment={bandToLaneFragment} />
          </div>
        </div>
      </div>
      <div data-testid="selection-info" style={{ marginTop: 16, fontSize: 13, color: 'var(--color-ink-muted)' }}>
        {selectedFrag
          ? `lane ${state.selectedLane} fragment ${state.selectedFragmentIndex}: ${selectedFrag.bases} bp, ${selectedFrag.mass} ng`
          : selectedSample
            ? `lane ${state.selectedLane}: ${selectedSample.fragments.length} fragments — click or tab through bands`
            : `lane ${state.selectedLane}: empty`}
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

- [ ] **Step 2: Verify dev + typecheck + existing tests**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run typecheck && npm run test:unit
```

Expected: typecheck clean, 21 (gelState, multi-lane) + 102 (M5) + 4 (solver) + 6 (slider) = 133/133 unit tests.

```bash
npx playwright test --project chromium-webgpu smoke.spec.ts single-band.spec.ts multi-band.spec.ts sim-ladder.spec.ts
```

Expected: 8/8 (no regressions in dev pages).

- [ ] **Step 3: Visual smoke**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run dev > /tmp/m6b-task5-dev.log 2>&1 &
SERVE_PID=$!
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
kill $SERVE_PID 2>/dev/null
wait $SERVE_PID 2>/dev/null
```

Expected: 200.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/src/routes/GelPage.tsx
git commit -m "refactor(gel): GelPage multi-lane — per-lane fragToBands + MicrotubeRow"
```

---

### Task 6: Extend Playwright spec with microtube drag tests

**Files:**
- Modify: `ts/tests/visual/gel-page.spec.ts`

The existing M6 tests still work (they target lane 0 by default). Append two new tests: microtube drag moves sample, alt-microtube-drag clones.

- [ ] **Step 1: Append two tests to `ts/tests/visual/gel-page.spec.ts`**

Find the file and APPEND (don't replace) these test blocks at the end:

```ts
test('microtube drag moves sample to a new lane', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  // Initial: lane 0 has the sample, lane 3 empty
  await expect(page.locator('[data-testid="microtube-0"]')).toBeVisible();
  // Read initial fill (sample present = filled)
  const tube0Before = await page.locator('[data-testid="microtube-0"]').getAttribute('fill');
  expect(tube0Before).not.toBe('transparent');
  const tube3Before = await page.locator('[data-testid="microtube-3"]').getAttribute('fill');
  expect(tube3Before).toBe('transparent');

  // Drag tube 0 → tube 3 by simulating pointer down on 0, up over 3
  const tube0 = await page.locator('[data-testid="microtube-0"]').boundingBox();
  const tube3 = await page.locator('[data-testid="microtube-3"]').boundingBox();
  if (!tube0 || !tube3) throw new Error('microtube bbox missing');
  await page.mouse.move(tube0.x + tube0.width / 2, tube0.y + tube0.height / 2);
  await page.mouse.down();
  await page.mouse.move(tube3.x + tube3.width / 2, tube3.y + tube3.height / 2, { steps: 5 });
  await page.mouse.up();

  // Now lane 3 has the sample; lane 0 is empty
  await expect.poll(async () =>
    (await page.locator('[data-testid="microtube-3"]').getAttribute('fill')) ?? ''
  ).not.toBe('transparent');
  await expect.poll(async () =>
    (await page.locator('[data-testid="microtube-0"]').getAttribute('fill')) ?? ''
  ).toBe('transparent');
});

test('alt+microtube-drag clones the sample (both lanes filled)', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  const tube0 = await page.locator('[data-testid="microtube-0"]').boundingBox();
  const tube4 = await page.locator('[data-testid="microtube-4"]').boundingBox();
  if (!tube0 || !tube4) throw new Error('microtube bbox missing');
  await page.keyboard.down('Alt');
  await page.mouse.move(tube0.x + tube0.width / 2, tube0.y + tube0.height / 2);
  await page.mouse.down();
  await page.mouse.move(tube4.x + tube4.width / 2, tube4.y + tube4.height / 2, { steps: 5 });
  await page.mouse.up();
  await page.keyboard.up('Alt');

  // Both 0 and 4 are filled
  await expect.poll(async () =>
    (await page.locator('[data-testid="microtube-0"]').getAttribute('fill')) ?? ''
  ).not.toBe('transparent');
  await expect.poll(async () =>
    (await page.locator('[data-testid="microtube-4"]').getAttribute('fill')) ?? ''
  ).not.toBe('transparent');
});
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npx playwright test gel-page.spec.ts --project chromium-webgpu
```

Expected: 7 passed (5 from M6 + 2 new).

```bash
npx playwright test gel-page.spec.ts --project chromium-webgl2
```

Expected: 7 passed.

If alt-drag test fails because Playwright's `keyboard.down('Alt')` doesn't propagate altKey to React's onPointerDown (browser-quirk territory), fall back to `dispatchEvent` with `altKey: true` set on the synthetic PointerEvent — see plan section "Risks specific to M6b" #1.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git add ts/tests/visual/gel-page.spec.ts
git commit -m "test(gel): microtube drag (move + alt-clone) Playwright tests"
```

---

### Task 7: Mark M6b done, tag, verify CI

**Files:**
- Modify: `docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md`

- [ ] **Step 1: Add an M6b entry to the overview**

Below the M6 row in the milestones table:

```markdown
| M6b | Multi-lane + sample drag | 7 lanes; microtube row; sample drag-between-lanes; alt-drag clones sample | [`m6b-multilane.md`](2026-04-30-gelbox-ts-m6b-multilane.md) | Week 4.75 |
```

In the Sub-plans section, after the M6 line:

```markdown
- [x] **M6b Multi-lane + sample drag** — [`2026-04-30-gelbox-ts-m6b-multilane.md`](2026-04-30-gelbox-ts-m6b-multilane.md)
```

- [ ] **Step 2: Run full local CI green check**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run typecheck && npm run test:unit && npm run build
npx playwright test --project chromium-webgpu
npx playwright test --project chromium-webgl2
```

Expected: typecheck clean, 133 unit, build OK, 16/16 per project (14 from M6 + 2 microtube).

- [ ] **Step 3: Commit, push, tag**

```bash
cd /Users/shawn/code/gel
git pull --rebase origin main || true
git add docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md \
        docs/superpowers/plans/2026-04-30-gelbox-ts-m6b-multilane.md
git commit -m "docs(plan): mark M6b multi-lane + sample drag complete"
git push origin main
git tag m6b-multilane
git push origin m6b-multilane
```

- [ ] **Step 4: Verify CI green**

```bash
cd /Users/shawn/code/gel
RUN_ID=$(gh run list --workflow=ci.yml --limit 1 --json databaseId --jq '.[0].databaseId')
until gh run view "$RUN_ID" --json status --jq '.status' | grep -q '^completed$'; do
  sleep 30
done
gh run view "$RUN_ID" --json status,conclusion --jq '{status, conclusion}'
```

Expected: success.

---

## Self-review

**Spec coverage** (against original M6 acceptance "sample drag-between-lanes"):
- ✅ Multi-lane state — Task 1.
- ✅ Microtube row — Task 4.
- ✅ Sample drag between lanes — Task 4 (logic) + Task 6 (test).
- ✅ Alt-drag clones — Task 4 + Task 6.
- ✅ All M6 features still work (band drag, shift-lock, opt-clone, tab nav, sliders) — Tasks 2, 3, 5, 6.

**Placeholder scan:** No TBDs. Each task has full code; commands are exact.

**Type consistency:**
- `BandLaneFragment` defined in Task 2 (overlay), consumed in Task 5 (page).
- `BandDrag` and `SampleDrag` discriminated union via `type` field.
- All actions take `laneIndex` where applicable; reducer guards against null samples.

**Risks specific to M6b:**

1. **Playwright `keyboard.down('Alt')` + mouse drag**. Some browser/Playwright versions don't propagate `altKey` correctly to PointerEvents during `mouse.move/down/up`. Fallback: dispatch the events directly via `page.dispatchEvent` with `{ altKey: true }`.
2. **Microtube SVG positioning**. The `MicrotubeRow` is a separate SVG element above the canvas; the layout uses flex column. If row height + canvas height > parent constraint, layout will scroll — acceptable for M6b.
3. **Sparse samples array vs JSON serialization** (M8 territory): `null`s in arrays serialize fine in JSON. Future save/load will round-trip cleanly.

Plan complete and saved to `docs/superpowers/plans/2026-04-30-gelbox-ts-m6b-multilane.md`.
