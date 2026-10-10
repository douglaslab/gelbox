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

Implemented and verified: development-only registry and post-commit presentation,
sample body/shadow/clip and fragment well/representative. The geometric-underlay
edge fixture matches12 native comparisons; real sample/fragment body overlaps
match20 including reversed order and fractional clipping. Full SampleView first-
commit measurement is fixed with layout-phase measurement. Same-frame removal,
RNG/tick invariants, move/scroll/resize/DPR, device/context loss, bounded owned
resources, failure/retry and late device acquisition are covered. Regression:
2,916 units,559 browser cases(one intentional skip),production4/build pass.
Final independent review remains at the end of this inline plan. Mixed overlaps
with unmigrated gel/DOM chrome remain explicitly unaccepted.

Files: create `ts/src/lib/gel/scenePresentation.ts`; provider under `ts/src/components/gel/ScenePresentation.tsx`;
modify `GelContext.tsx`, `Stage.tsx`, `SampleSimCanvas.tsx`, `FragmentWell.tsx`.

Contract: registry entries have stable view key, ordered draw contribution and
current transform; collection follows GelStore snapshot.order. Presentation
runs after flushSync tick commit, never from simulation readiness. Renderer
resources use existing recovery behavior. Keep a development-only migration switch.

- [x] Add a real sample/fragment overlap test using one shared canvas and the
  independent native edge reference. Assert no extra simulation ticks/RNG draws.
- [x] Register existing sample and fragment meshes without remounting engines;
  include their backgrounds, clip and ordered fragment well. Preserve input DOM.
- [x] Test opening/removing a panel in the same tick, move/scroll/resize/DPR,
  late acquisition after unmount, device/context loss and bounded allocation.
- [x] Keep missing chrome contributions explicitly unaccepted and commit. Independent
  review covers the whole branch after Task4.

## Task 3: Gel, loupes, images and assets

In progress: effects gel and direct bands use the shared surface behind the
existing development flag. Scientific resource ownership, render invalidation,
startup native pixels, repeated mode switching and mixed gel/sample/fragment
overlaps are verified. Loupes now register anchor/callout/frame paint around their
shared particle body, with24 exact native comparisons and shared interaction/
recovery coverage. Reference images now contribute native image/resize/focus paint,
with20 exact scene comparisons and28 exact native texture/mip comparisons. Async
disposal, backend recovery and both-mode image interactions are covered. Remaining
transforms, combined workflows and broader codec evidence remain open; these
increments do not close Task3.

Transform scope audit: native `View.cpp::getRectMappingAsMatrix` maps axis-aligned
bounds to frames; `GelboxApp.cpp` window layout only translates the fixed-size
gel, and `GelSettingsView.cpp` explicitly disables rotation without a callback.
The web rotation control is likewise disabled. Arbitrary rotated gel presentation
is not a native parity requirement. Reachable resizing, DPR, scrolling and
frame/bounds mappings still require coverage; image scaling is covered above.

Shared loupe source-selection/rollover tests now run beside legacy mode (12 cases
across both backends). A combined hidden-lane/sample/loupe/image workflow verifies
retained sample identity and molecular engines, keyboard cycling while hidden,
image pixel stability and removal, lane restoration and loupe deletion (4 cases).
These are behavior checks, not certification of remaining DOM chrome overlap.


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

First asset/button increment in progress alongside the remaining Task3 acceptance:
settings icon paint now uses the gel's ordered contribution and a scene-local,
reference-counted image cache. Pinned ButtonView method captures match16 RGB
comparisons across DPR1/2 and both backends. Native hover/down tint and covering
by a later imported image are verified. The cache shares textures among consumers,
retains decode across backend loss, releases late decode, and retries a failed load
on a new graphics connection. This establishes a reusable asset path; other icons,
control geometry, text/font evidence and the production switch remain open.

Help/application button and inspector brace contributions follow next:40 exact
native asset comparisons verify actual components and native tint/overlap at
both scales/backends. Existing Help navigation/focus/resize and representative
covering the brace now run in shared mode as well. Inspector brace paint uses
its inspector key before body contents; application and Help keep separate keys.
The shared asset path now serves both settings icons with one cached texture.
Loaded tube icons now share their background's native order, with a floating
mouse-down tube image after the gel when dragging outside lane hit regions. Twenty
native comparisons cover seven/twenty lanes and free/occupied dragging at DPR1/2.
The legacy path gains the same previously missing floating image. Native 2x-to-1x
asset fallback now also handles successful responses containing invalid image data.
The sample header now contributes its native circle, tube and captured Avenir Heavy
text before the sample body. Eight exact RGB comparisons cover integer/fractional
positions at DPR1/2 on both backends. Text uses one linear-filtered texture level,
while ordinary UI images retain mipmaps. The accessible heading remains in the
DOM. A later reference image covers all header paint in the real app and deleting
it restores the original pixels. The new-species button, other headings, dynamic
labels, menus, sliders and remaining paint stay open.



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

Task 3 is the current implementation increment. Later work may be decomposed further
when native texture/font evidence arrives; their acceptance scope must not shrink.
