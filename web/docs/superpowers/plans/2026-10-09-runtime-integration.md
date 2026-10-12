# Application Runtime Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Wire the native molecular runtime through actual application commands, hover events, view lifetimes and rendering.

**Architecture:** Keep gelReducer pure; GelStore executes synchronous commands and ordered native effects, publishes stable snapshots, and owns a single simulation frame. React observes state and renders existing engines. Native intermediate notifications are explicit operations, not inferred solely from final state differences.

**Tech Stack:** TypeScript/React 18, Vitest, Playwright WebGPU/WebGL2, Node 22.

**Spec:** `docs/superpowers/specs/2026-10-09-runtime-integration-design.md`.

## Global Constraints

- Strict native behavior and visual parity first; improvements afterward.
- Finish the web app first; reconsider Rust/native only for a concrete need.
- Preserve numerical formulas, serialization and independent native captures.
- Simulation ownership is independent of renderer readiness and React effect replay.
- Keep the full parity/release gates open until their own evidence exists.

## Review Focus

- Intermediate tube removal/insertion notifications must consume loupe RNG in native order.
- Same-event hover refreshes and mouse-down/up ordering must not be coalesced by React.
- Inspector draws occur immediately for explicit selection but after molecular ticks for rollover.
- Closing/recreated loupes must keep separate instance lifetimes, including the native last tick.
- Delayed renderer acquisition, StrictMode and disposal must not alter simulation/RNG sequencing.

### Task 1: Synchronous application store and native effect ordering

**Files:** create `ts/src/lib/gel/gelStore.ts`, `gelScene.ts`, `ts/tests/unit/gelStore.test.ts`; extend `molecularRuntime.ts` and `gelState.ts` only for frame hooks/relative ordering and native right-drag metadata.

**Interfaces:** `GelStore` owns `molecular: MolecularRuntime`; `getSnapshot()` returns stable `{gel, hover, order}`; `subscribe(listener)` returns cleanup; bound `dispatch(Action)` retains current component dispatch API. `createSpecies(lane, targetY?)` returns the new fragment index. `hoverEvent(HoverLoupeEvent)`, `beginPointerDown(point,persistent)`, `endPointerDown()`, `releasePointer(point)` preserve hover windows. `tick(freezeAfter?)` advances the complete frame. `subscribeFrame(callback)` supports drawing after updates. `getMolecularView(key)` and `getLoupeContent(key)` resolve ordinary key `sample`, persistent `loupe-N`, and `hover`. Layer add/remove/raise methods support controlled ViewOrderProvider. Pointer-input methods supply per-frame picking/bullet time. `deriveGelScene(GelState)` returns bands and bandToLaneFragment for both renderer and loupe extraction.

- [x] Write store tests for the spec's command/frame sequences with explicit RNG/order assertions; run to confirm absent-store failure.
- [x] Implement store transactions, unique view instances, native intermediate refresh ordering, delayed ordinary synchronization, inspector lifecycle, hover event commands, closing views and frame callbacks.
- [x] Verify focused store/native runtime suites plus full unit suite and typecheck/build; record any source-grounded rulings before Task 2.
- [x] Commit the tested store increment; application integration remains required.

### Task 2: Connect commands, hover, layers and canvases

**Files:** `GelContext.tsx`, `useHoverLoupe.ts`, `useViewLayer.tsx`, `LoupePortalLayer.tsx`, `Loupe.tsx`, `GelOverlay.tsx`, `SampleView.tsx`, `MolecularSimCanvas.tsx`, `SampleSimCanvas.tsx`, `routes/GelPage.tsx`; browser `runtime-integration.spec.ts` and affected reviewed visual baselines.

**Interfaces:** consume Task 1's bound store commands and stable snapshots. `useGelStore()` exposes the provider's single store. SampleSimCanvas receives a MolecularView and registers drawing/pointer input; it performs no simulation lifecycle work. Managed layer registration is idempotent under effect replay.

- [x] Write browser regressions for renderer-delay-independent ticks, StrictMode single logical creation, native species generation/save, right-click creation/drag, and live loupe updates; run targeted tests to observe current failures.
- [x] Replace reducer/effect simulation ownership with store subscription and one app frame driver. Route species/clone/right-pointer commands to the store, migrate hover events and shared layers, and render stored loupe content.
- [x] Run focused tests on both backends, then full unit/browser/build/native contracts. Inspect changed screenshots and update only explained RNG/layout consequences. Record exact counts and remaining native GUI/raster limits.
- [x] Commit, obtain one fresh read-only final review, fix Important findings with failing-then-passing regressions, and update STATUS/ROADMAP. Retain the worktree for remaining parity gates.

## Decisions

- Execute inline under the continuing goal authorization; the existing isolated worktree is retained.
- Task 2 consumes Task 1's stable store API; no task changes the numerical reference contract.


## Final evidence and rulings

Implemented in `d8a8886` and `b3bd414`, followed by the pointer-ownership review fix.
Final verification: Node 22, 2,844 units / 62 files, 271 browser tests / both GPU
backends plus one intentional duplicate skip, production build/TypeScript and
eight native runtime contracts passed. The three initial browser cases failed
on both backends before integration. Eight ordinary molecular goldens were
visually inspected and updated for native RNG; no loupe/layout goldens changed.

Fresh read-only Astra review `/root/review_runtime_integration`: no Critical,
one Important held-gesture rollover finding, one Minor preceding-frame highlight
finding. The Important defect reproduced in a store spy and real rendered-particle
hold/move/release tests on both backends; all pass after the fix and full regression
run. There was one fix pass, no re-review.

Rulings:
- Continue inline in the existing isolated worktree under the ongoing goal; no
  merge/push or new approval gate. Wrong scope would require revising local work.
- Native setting notifications survive identical resulting values. Skipping them
  changes RNG consumption; repeated-time/lanes regressions cover this boundary.
- End the preclear hover window at an event-task boundary, not a microtask:
  browser microtask checkpoints precede React target handlers. Wrong ordering
  drops Alt-clone/right-create refreshes; those browser regressions now pass.
- Full native GUI/raster and P5 release certification remain required work, not
  claims of this increment. Treating these checks as certification would leave
  platform/visual mismatches undetected.
- The existing background-only 2D fallback remains uncertified; the P5 failure/
  fallback gate must address it before release. Otherwise unsupported devices
  could present incomplete molecular output.
- Aspect/multimer generation probabilities remain pinned to native defaults zero;
  alternate exposed tuning would require additional native captures.
- Existing worktree retention authorization carries forward. Repeating passing
  checks solely for a task-done wrapper adds no evidence; the actual commands,
  counts and red/green results above are the completion record.

Deferred Minor: the molecular draw callback uses the preceding React highlight
snapshot when rollover changes during the tick. Fix and test same-frame visual
updates in the remaining parity work; this is not a final accepted deviation.
