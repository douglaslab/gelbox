# Gelbox TS — M26 Loupe Parity (design)

> Historical M26 design. Reconcile with [ROADMAP P3/P4](../../ROADMAP.md) before implementation: strict parity also requires source-species ancestry/selection, native placement and focus, effective settings, and independent native-reference verification.

_Phase 3 · Molecular-sim visual parity · 2026-06-14_

## Goal

Replace the Phase-1 M7 SVG dot-scatter loupe with a faithful port of the
C++ Gelbox loupe: a draggable detail window that renders a **live
`MolecularSim`** of the fragments found at the clicked gel pixel, plus an
optional transient **hover-preview** loupe. End state matches
`~/code/gelbox/src/GelView.cpp` + `SampleView.cpp` loupe behaviour.

This closes Phase-3 milestone **M26** (the prior M25 "bloom" was dropped
2026-06-14 — M24's outline-behind-fill pass already is the entire C++
selection/hover effect).

## Background — what the C++ loupe does

(Verified against `/Users/shawn/code/gelbox`; file:line in References.)

- **Trigger.** Meta/Cmd-mousedown anywhere on the gel → `addLoupe(gelPos)`.
  A persistent loupe is stored in `mLoupeViews`. Multiple loupes allowed.
- **Content.** Each loupe owns its own `MolecularSim`. On open (and on
  drag) `updateGelDetailViewContent()` seeds RNG from the gel position +
  time, builds a **synthetic `Sample`** from the pixel via
  `makeSampleFromGelPos()`, wires it through `setSample(sample,
  &degradeFilter)`, and prerolls the sim.
- **Synthetic sample.** `pickBands(gelPos)` returns every band whose UI
  rect contains the pixel (can span lanes/aggregates). For each band a
  fragment is emitted whose `mMass = band.mMass * massScale`, where
  `massScale` depends on where in the band the pixel landed: body
  (`band.mBrightness`), smear-above / smear-below (lerp of the band's
  smear brightness pair), or blur halo (`(1 - d/blur)^3`). Degraded /
  smear-below picks also populate a `DegradeFilter` (`map<fragIdx, bpEq>`)
  via the reverse solver, constraining particle size.
- **Rendering.** A loupe `SampleView` (`mIsLoupeView = true`) draws the
  same dye-tinted background + particle sim as the middle panel, **minus**
  the header (no microtube glyph / "Sample" text), **plus** a callout
  wedge (convex hull from the popup's 4 corners to the gel anchor) and a
  small loupe circle widget at the anchor.
- **Drag.** Three modes: `Loupe` (drag the anchor circle → move pick
  point, re-extract content), `View` (drag the popup → callout follows,
  content unchanged), `LoupeAndView` (drag the callout wedge → move both,
  re-extract).
- **Hover preview.** When hovering the gel with Meta held (or a global
  enable-by-default flag), a transient `mHoverGelDetailView` loupe tracks
  the cursor and auto-dismisses on leave. It's a separate slot from the
  persistent Cmd-click loupes.
- **Geometry.** `mLoupeSize = (171,171)`; loupe circle radius `16 * 0.65
  = 10.4`; popup centered to the right of the click (`+ frameWidth`).

## What already exists in the TS port (feasibility)

- **Engine is reusable.** `MolecularSim` (`lib/sim/molecularSimEngine.ts`)
  and `buildMoleculesMesh()` (`lib/sim/molecularSimMesh.ts`) are pure and
  React-decoupled. The only lane-bound piece is the
  `MolecularSimCanvas.tsx` component.
- **Band data.** `Band` (`lib/sim/band.ts`) already carries `rect`,
  `smearAbove/Below`, `smearBrightnessAbove/Below`, `blur`, `brightness`.
- **Band → (lane, fragment).** `bandToLaneFragment[]` built in `GelPage`
  and consumed by `GelOverlay.tsx`.
- **Reverse solver.** `solveBasesForY()` (`lib/sim/solver.ts`) mirrors
  C++ `solveBasePairForY`. Forward solver `calcDeltaY()` exists too.
- **Determinism hook.** M24's `window.__molsimFreezeAfterTicks` freeze
  makes the animated sim golden-stable.

### Gaps to close

1. `Band` discards `mass`, `aggregate` (multimer index), and `degrade`.
   → **Extend the `Band` type** with these (decided 2026-06-14), populated
   at the two creation sites in `gelSim.ts` (`dyeToBand`,
   `fragAggregateToBand`). The renderer ignores the new fields.
2. No `pickSmearAbove/Below(pos)` helpers — port from band smear geometry.
3. `MolecularSim.setSample(sample)` takes no `DegradeFilter` — extend to
   `setSample(sample, degradeFilter?)` mirroring C++ wholeness constraint.
4. The loupe state model is fragment-anchored (`{lane, fragmentIndex, x,
   y}` screen coords). Full parity needs a **gel-space anchor**
   (calloutAnchor) plus a separately-draggable popup frame position.

## Architecture

**Recommended (chosen): generalize the canvas.** Refactor
`MolecularSimCanvas` into a lane-agnostic `SampleSimCanvas` taking
`{ sample, width, height, seed, selection, rollover, isLoupe, onPick? }`
instead of `laneIndex`. The middle panel passes the lane's sample; each
loupe passes its synthetic sample. One component, two callers — reuses all
M24 GPU + 2D-fallback code verbatim.

- **GPU device sharing.** Each surface keeps its own canvas/context, but
  share a single cached `GPUDevice` (cache the `requestDevice()` promise)
  rather than acquiring one device per loupe canvas.
- Rejected: a single multi-viewport renderer (over-engineered for a
  handful of loupes — YAGNI) and a full headless render controller
  (larger refactor than this milestone warrants).

**Extraction module (pure).** New `lib/sim/sampleFromGel.ts`:
`pickBands(gelPos, bands) → Band[]` and
`makeSampleFromGel(gelPos, bands, bandToLaneFragment, samples, ctx) →
{ sample: Sample, degradeFilter: DegradeFilter }`. No React, fully
unit-testable.

**Loupe chrome.** The popup box is an HTML-positioned `SampleSimCanvas`.
The callout wedge + anchor circle render in the gel's SVG overlay
coordinate space (anchored to the gel), as the current `LoupePortalLayer`
already does for positioning.

## Sub-milestones (one spec, three shippable stages)

Full parity is reached at the end of M26c. Each stage ships to `main`.

### M26a — Reusable surface + synthetic-sample loupe (static)

The biggest visible win: real C++-parity content replaces the SVG scatter.

- Generalize `MolecularSimCanvas` → `SampleSimCanvas` (lane-agnostic);
  middle panel updated to use it (pixel-neutral — verify panel goldens
  unchanged on both backends).
- Extend `Band` with `mass`, `aggregate`, `degrade`; populate in
  `gelSim.ts`.
- New `lib/sim/sampleFromGel.ts`: `pickBands` + `makeSampleFromGel` +
  `pickSmearAbove/Below` + `DegradeFilter` type. Port the C++ massScale
  branches (body / smear-above / smear-below / blur) and the reverse-solve
  degrade population via `solveBasesForY`.
- Extend `MolecularSim.setSample(sample, degradeFilter?)` with the C++
  wholeness constraint (`MolecularSim.cpp:143`).
- Loupe state model → gel-space anchor; new `Loupe` component renders a
  `SampleSimCanvas` of the synthetic sample at a fixed popup position to
  the right of the anchor, close button only (no drag yet).
- RNG seed parity: `floor(x)*19 + floor(y)*1723 + floor(gelTime*2393)`.
- **Acceptance.** Cmd-click on the gel opens a loupe showing live
  particles for the fragment(s) at that pixel; counts/sizes track mass &
  degrade; close button removes it; multiple loupes coexist. The SVG
  dot-scatter is gone. Unit tests for `makeSampleFromGel`; Playwright
  loupe goldens on both backends (frozen).

### M26b — Loupe interaction parity (drag)

- Callout wedge: convex-hull polygon from popup corners → anchor, drawn
  semi-transparent (port `updateCallout` / `calcConvexHull`).
- Loupe anchor circle widget (radius 10.4, focus-thickened) on the gel.
- Three drag modes: `Loupe` (move anchor + re-extract),
  `View` (move popup, callout follows), `LoupeAndView` (move both +
  re-extract). Hit-test order matches C++ (`pickLoupe` → `pickCalloutWedge`
  → view body).
- **Acceptance.** Dragging the anchor re-extracts and re-renders the
  synthetic sample live; dragging the popup repositions it with the
  callout tracking; goldens for a dragged state.

### M26c — Hover-preview loupe

- Transient hover loupe distinct from persistent Cmd-click loupes:
  appears on gel hover when Meta is held (or an enable-by-default flag),
  follows the cursor, auto-dismisses on leave.
- **Acceptance.** Meta-hover over the gel shows a preview loupe that
  tracks the cursor and disappears on leave; Cmd-click still creates a
  persistent loupe; the two don't conflict.

## Data-model changes

- **`Band`** gains: `mass: number`, `aggregate: number` (1-based multimer
  index; `1` for monomer/dye), `degrade: number` (0..1, source fragment's
  degrade). Populated in `dyeToBand` (mass = dye mass, aggregate 1, degrade
  0) and `fragAggregateToBand` (mass = `frag.mass * massScale`, aggregate =
  the `m+1` index, degrade = `frag.degrade`).
- **`LoupeRef`** (in `gelState.ts`) → `{ id, anchor: {x,y} /* gel space */,
  frame: {x,y} /* popup top-left, gel space */, isHover: boolean }`. The
  reducer actions `ADD_LOUPE` / `REMOVE_LOUPE` / `MOVE_LOUPE_ANCHOR` /
  `MOVE_LOUPE_FRAME` / `SET_HOVER_LOUPE` / `CLEAR_LOUPES`.
- **`DegradeFilter`** = `Map<number, number>` (fragmentIndex → base-pair
  equivalent), new in `sampleFromGel.ts`.
- **`MolecularSim.setSample`** signature → `(sample, degradeFilter?)`.

## Determinism & testing

- Reuse `__molsimFreezeAfterTicks` for stable loupe goldens.
- Unit tests (`sampleFromGel.test.ts`): massScale for body vs smear-above
  vs smear-below vs blur halo against hand-computed values; degradeFilter
  population for a degraded band; `pickBands` multi-band overlap.
- Unit test the extended `setSample` degrade-filter wholeness math.
- Playwright (`tests/visual/loupe.spec.ts`): open/close/multi-loupe (port
  existing gel-page loupe tests), loupe render golden (idle + dragged) on
  chromium-webgpu and chromium-webgl2.
- Keep the existing `gelState` loupe reducer tests green (updated for the
  new `LoupeRef` shape).

## Risks

| # | Risk | Mitigation |
|---|------|------------|
| 1 | Multiple GPU surfaces (panel + N loupes) exhaust device/context | Share one cached `GPUDevice`; cap nothing for now but log if loupe count is high; 2D fallback already exists |
| 2 | `makeSampleFromGel` massScale branches are subtle (smear/blur math) | Port branch-for-branch from C++ `GelView.cpp:984`; unit-test each branch against hand-computed values before wiring UI |
| 3 | Reverse-solve degrade (`solveBasesForY`) per band on every drag frame is costly | Re-extract only on anchor change (matches C++ `updateContent` gating), not every rAF |
| 4 | `Band` type change ripples into band goldens / serializers | Additive fields only; renderer ignores them; check no test serializes `Band` exactly |
| 5 | Callout convex-hull + drag hit-testing in SVG space vs canvas space coordinate drift | Do all anchor/wedge math in gel-space; reuse the gel overlay's existing gel↔screen transform |

## Out of scope

- C++ `kConfig.mHoverGelDetailViewOnBandDrag` (hover preview while
  dragging a band) — defer; M26c covers plain Meta-hover only.
- Selecting/settings-editing inside a loupe (`kLoupePartsSelectable`
  background toggle) — loupes pick particles for rollover/selection like
  the panel, but no settings-view open from a loupe.
- Loupe open/close animation (C++ animates frame from zero) — static for
  now; revisit as polish.

## References

- C++: `GelView.cpp` `addLoupe` (846), `updateGelDetailView` (897),
  `updateGelDetailViewContent` (950), `makeSampleFromGelPos` (984),
  `pickBands` (1273), `updateHoverGelDetailView` (1168); `SampleView.cpp`
  `draw` (85), `drawLoupe` (287), `updateCallout` (266), `mouseDown` (380),
  `mouseDrag` (413), `pickLoupe` (282), `pickCalloutWedge` (232);
  `MolecularSim.cpp` `setSample` (143); `include/Layout.h` `mLoupeSize`.
- TS: `lib/sim/band.ts`, `lib/sim/gelSim.ts`, `lib/sim/solver.ts`,
  `lib/sim/molecularSimEngine.ts`, `lib/sim/molecularSimMesh.ts`,
  `components/sample/MolecularSimCanvas.tsx`, `components/gel/Loupe.tsx`,
  `components/gel/LoupePortalLayer.tsx`, `components/gel/GelOverlay.tsx`,
  `lib/gel/gelState.ts`.
- Phase 3 overview: `2026-05-09-gelbox-ts-phase-3-overview.md`.
- M24 spec (renderer this reuses):
  `2026-06-13-gelbox-ts-m24-gpu-mesh-renderer-design.md`.
</content>
</invoke>
