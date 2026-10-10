# Shared Composition Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. Keep independent review for completed implementation increments.

**Goal:** Preserve native overlapping-view sample composition in the web app.

**Architecture:** Extend existing presentation backends to consume ordered mesh
and texture operations on one window MSAA surface. Existing React/store code
continues to own semantics, input and simulation. Migrate drawing incrementally.

**Tech Stack:** TypeScript, React18, Vite, WebGPU, WebGL2, Playwright, native CGL references.

**Spec:** [Shared composition design](../specs/2026-10-10-shared-composition.md)

## Global constraints

- Strict native behavior and visual parity first; web app first.
- Native pin: `5f5109705279085fcf6bcac6c8be1c9806b6d3d6`.
- One RGBA8 MSAA4 window resolve; retain existing scientific offscreen gel rendering.
- Keep document, selection, gestures, engine lifetime and RNG ownership unchanged.
- No tolerance increases or reference updates to conceal unresolved parity.

## Review focus

- Mixed additive/source-over operations must restore blend state (Task 1).
- Clipped particles must not clip later frames/representatives (Task 1).
- New panels and scroll/DPR changes must use current committed transforms (Task 2).
- Late image/device completion must not redraw removed views or restart engines (Tasks2–3).
- Later views must cover earlier headings/control paint while preserving picking (Task 4).

## Task 1: Ordered presentation operations

Implemented and verified: mesh transforms/blend/scissors/line strips and typed
ordered texture operations. Twenty mesh comparisons and twenty texture
comparisons match exact native RGB; the shared32 proof still passes. Unit2,913,
browser537 (one intentional skip), production4 and build pass. See
reference/web/ordered-{mesh,texture}-scenes. App migration follows in Task 2;
whole-branch independent review remains at the end of this inline plan.

Files: extend `ts/src/lib/gel/presentationTypes.ts`, `present.ts`, `present-gl.ts`;
add focused geometry tests under `ts/tests/unit`, native reference/audit fixtures.

Contract: define backend-independent mesh operation metadata (topology, blend,
affine transform, physical scissor) and generic texture operation metadata
(texture handle, destination, UVs, tint, alpha convention, filtering/mips,
addressing and color-space interpretation). Add ordered draw entry
points to both presentation factories; keep legacy draw signatures as adapters.

- [x] Capture native sequences with translated/clipped mesh and mixed blend modes,
  textured underlay/overlay and intersecting edges. Verify repeated captures.
- [x] Write browser tests against those native pixels; prove missing per-operation
  state fails. Include empty/scissor-outside-window and clip reset cases.
- [x] Implement ordered execution, one clear and one resolve. Reuse allocation,
  shader, reflection and cleanup logic rather than adding parallel renderers.
- [x] Verify legacy gel/particle/well callers and the exact shared32-case proof.
  Run unit/browser/build checks and commit this independently testable API.
  Independent review covers the whole branch after Task 4.

## Task 2: Frame registry and two real view contributions

In progress: development-only shared registry, post-commit frame presentation,
sample body/shadow/clip and fragment well/representative are implemented. The
production FragmentWell passes12 native edge comparisons with a registered
geometric underlay. Same-frame mount/removal and RNG/tick invariants, movement,
scroll/DPR/resize, initialization fallback and late-import retirement are covered.
Still required: native real sample/fragment overlap fixture, full SampleView
first-commit measurement coverage, loss/recovery and bounded-allocation gates.
Mixed overlaps with unmigrated gel/DOM chrome remain explicitly unaccepted.

Files: create `ts/src/lib/gel/scenePresentation.ts`; provider under `ts/src/components/gel/ScenePresentation.tsx`;
modify `GelContext.tsx`, `Stage.tsx`, `SampleSimCanvas.tsx`, `FragmentWell.tsx`.

Contract: registry entries have stable view key, ordered draw contribution and
current transform; collection follows GelStore snapshot.order. Presentation
runs after flushSync tick commit, never from simulation readiness. Renderer
resources use existing recovery behavior. Keep a development-only migration switch.

- [ ] Add a real sample/fragment overlap test using one shared canvas and the
  independent native edge reference. Assert no extra simulation ticks/RNG draws.
- [ ] Register existing sample and fragment meshes without remounting engines;
  include their backgrounds, clip and ordered fragment well. Preserve input DOM.
- [ ] Test opening/removing a panel in the same tick, move/scroll/resize/DPR,
  late acquisition after unmount, device/context loss and bounded allocation.
- [ ] Keep missing chrome contributions explicitly unaccepted; review and commit.

## Task 3: Gel, loupes, images and assets

Files: `GelCanvas.tsx`, `DirectBandCanvas.tsx`, `Loupe.tsx`,
`ReferenceImageLayer.tsx`, scene registry and presentation asset owner.

- [ ] Capture native ordered overlaps with gel texture/direct bands, loupe
  callout/shadow/frame, image resize/focus frame, and fragment overflow.
- [ ] Migrate scientific texture producers to the shared backend context and
  register texture/mesh operations. Preserve scientific render invalidation.
- [ ] Register loupe background, clipped particles, native frame order, and
  reference images with their own alpha/decode contract. Handle async disposal.
- [ ] Replay move/raise/remove, hidden lanes and selection with loupes/images;
  verify native pixels/state plus graphics recovery and resource growth.
- [ ] Review and commit without enabling incomplete shared production rendering.

## Task 4: Ordered chrome, text and production switch

Files: `MicrotubeRow.tsx`, `GelOverlay.tsx`, `SampleView.tsx`, inspector views,
`Brace.tsx`, control primitives and the shared texture cache/registry.

- [ ] Inventory native child insertion and drawFrame order for every control;
  retain current DOM accessibility/keyboard/pointer semantics.
- [ ] Capture native icons, brace, glyph metrics/textures, selection/focus and
  control overlaps. Establish image sampling/font evidence before migration.
- [ ] Migrate visual paint into ordered commands; test that later images and
  overflowing particles cover earlier controls, while picking remains native.
- [ ] Enable shared production composition only after all migrated overlapping
  view scenarios pass. Remove duplicate/retired canvas painting and switch.
- [ ] Run exact production edge/solid audits, complete regression/build/deployment,
  browser compatibility, lifecycle and combined performance checks. Record each
  remaining original-GUI/roadmap gate rather than marking the full app complete.

Task 1 is the next implementation increment. Later tasks may be decomposed further
when native texture/font evidence arrives; their acceptance scope must not shrink.
