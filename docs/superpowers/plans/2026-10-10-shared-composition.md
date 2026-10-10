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
it restores the original pixels. The sample frame/focus and new-species child button now also contribute in native
order. Twenty-eight exact RGB comparisons cover the combined header, rectangular
empty sample body, focus/frame and button states, including a later translucent
view. Image covering/picking and create/edit/delete/save workflows are verified
in shared mode. The Gel, Buffer + Dyes and Species headings, Dyes subhead and parent divider lines
now use captured native text extents and ordered line paint. Twenty-four exact
comparisons cover DPR1/2 and later/earlier translucent views; real panel switches
and imported-image covering/removal verify integration. Native integer texture
size division is preserved, including the 2x heading width and subhead height.
The dynamic UIFont foundation now uses the native Avenir Medium12/24 atlas,
CoreText advances/kerning and Cinder local pixel snapping. All 2,048 independent
string measurements/placements match; eight exact RGB comparisons cover
fractional translation, alpha tint and earlier/later translucent geometry on
both backends at DPR1/2. This is single-line printable ASCII for native numeric
values, not a general Unicode shaper. Slider drawing now matches 128 exact RGB
comparisons covering standard, bar and graph styles, enabled/disabled states,
endpoints, notches, text and earlier/later translucent geometry. The actual
Timeline, Gel settings and Species standard/graph controls now contribute in
native child order. Their DOM hit regions remain, including graph editing and
handle drag ownership. Real image overlap/removal and held-icon cancellation
are verified. Dye rows now use native bar layout, captured static labels and natural molecule
icons; 24 exact native comparisons exercise the actual DyeRow component at both
scales/backends, with zero/mixed/full values and texture highlighting. The name
label restores the native low-endpoint action. Bar width is 135 excluding icons,
empty-color interpolation keeps native float precision, and displayed units are
native "mM" (the former web "ng" label was an unapproved difference). Real-app
endpoint edits, bar clicks, image covering/removal and save checks pass in both
rendering modes. Buffer headings, preset controls and concentration rows now also
contribute in native child order. Forty exact comparisons of the actual BufferView
cover all presets and custom compositions with retained/no prior notches. Static
labels retain native transparent textures and integer retina dimensions; disabled
controls remain disabled. Presets apply on native mouse-down (including secondary
buttons), while keyboard activation remains available. Custom input values are
preserved even when native float normalization/half-step rounding changes their
displayed value. Real-app overlap, endpoint/track disabling and notch lifecycle
checks cover both Gel and Sample buffers. Palette paint now contributes in native
child order; 96 exact RGB comparisons cover all twelve selections, both overlap
orders, both DPRs and both renderers. Real-app covering/removal, original-release
color exports and focus-preserving drag/Delete pass in both rendering modes.
Original Cinder right/middle dispatch plus native palette methods prove all-button
press/drag behavior; corresponding tests failed before removing the primary-only
guard and now pass. Slider tracks, handles, graph edits and endpoint icons now
accept native right/middle gestures; release-outside and cancellation preserve
ownership. Gel background presses pick occupied lanes, clear fragment selection
even on an expanded outline hit, and restore SampleView keyboard focus. Focused
checks pass in both modes/backends; full verification passes 849 browser cases
(one intentional duplicate skipped), 2,924 units, build and four production checks.
Application menu buttons, checkboxes, divider and static text now contribute in
native parent/child order. Forty-eight exact comparisons cover both menu layouts,
checked/unchecked/hover/held states, both overlap orders, both scales and both
backends. Native integer texture-size division corrects fractional Retina bounds.
Real-app press preview, release-outside cancellation, secondary-button and
keyboard activation, and covering/removal pass. Gel selection/hover outlines now
paint after wells and before dragged tubes, with native clipping, float colors
and one combined-alpha stroke per band. Eighty-eight exact comparisons cover
focus states, overlapping strokes and all gel edges; actual image covering and
restoration pass in effects/direct modes, both scales and both backends. SVG
picking/dragging remains intact; scientific image invalidation still passes.
Remaining input audit, combined acceptance, whole-branch review and production
enablement stay open.



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

Task 4 control migration is in progress alongside the remaining Task 3 integrated
acceptance. Later work may be decomposed further without shrinking those gates.


### Remaining input audit: source-backed findings

Original Cinder Cocoa rightMouseDown/otherMouseDown and drag methods forward
secondary buttons; Gelbox ViewCollection forwards them to the picked view.
At native pin `5f51097`, `SampleView::mouseDown` (line 380) selects molecules or
toggles ordinary sample settings, takes focus and chooses loupe anchor/wedge/frame
drag without a button filter. These primary-only guards in `SampleSimCanvas` and
`Loupe.begin` are now removed. Twenty-four failing real-pointer checks reproduced
the gap before the fix. Sixty focused cases now pass: source-species selection and
clearing, empty sample settings toggles, frame/anchor/wedge movement, retained
particle pixels, resize and keyboard focus across buttons and both modes/backends.
The full run additionally checks secondary-button drag cancellation. Transient
loupes remain non-draggable. Full verification passes 881 browser cases (one
intentional duplicate skipped), 2,924 units, build and four production checks.

`GelView::mouseDown` has distinct Meta and right-button branches before ordinary
tube selection. Middle-button tube selection/drag belongs to the ordinary branch;
right-clicking a tube remains outside lane creation bounds and does not start a
sample drag. Middle-button sample movement/cloning, gap exit/re-entry, repeated
clicks, capture loss and keyboard actions now pass. Meta precedes all button
branches: tube hit regions can create a loupe outside the gel frame, then retain
creation drag ownership through release or capture loss. Fifty-two focused cases
pass in both modes/backends; full verification passes 925 browser cases (one
intentional duplicate skipped), 2,924 units, build and four production checks.

`ButtonView::mouseUp` (line 105) activates its callback on an owned release inside
for all buttons. Application menu controls already implement this. Gel/application settings,
new-species and Help icons now share `useNativeButton`: owned release inside for
all buttons, release-outside/cancel/lost-capture cancellation, native held tint,
and detail-zero keyboard activation. Help retains its anchor destination and
opens it synchronously on activation. Twelve focused real-pointer workflows pass
in both modes/backends; full verification passes 893 browser cases (one intentional
duplicate skipped), 2,924 units, build and four production checks.
Whole-GUI button chords and rollover histories remain integrated acceptance gates.


### Independent whole-migration review (a47e1bc)

Fresh read-only review covered `d676ac5..a47e1bc`: ordered backend operations,
post-commit presentation, ownership/recovery, native paint/input integration and
evidence scope. No Critical issue was found. Three Important findings were
reproduced with failing browser regressions, fixed and independently rechecked.
Full verification passes 941 browser cases (one intentional duplicate skipped),
2,924 units, build and four legacy production checks:

- Species labels used ambient locale formatting. French narrow spaces and Arabic
  digits could make the ASCII native font shaper fail the entire shared scene.
  Labels now use the native ASCII comma grouping; French/Arabic cases cover both
  backends and presentation modes.
- Ordinary sample backgrounds tinted over molecules. Background picking now runs
  against current particle positions each draw, including a particle crossing a
  stationary pointer. Both legacy and shared paths use the same decision.
- Buffer preset pointer presses transferred keyboard focus to the HTML button.
  Preventing default pointer focus retains native sample Tab behavior while
  deliberate keyboard activation remains available.

The reviewer approved the architecture for continued integrated acceptance with
these fixes, not production migration. The built-app root/subpath checks still
exercise the legacy compositor. Review did not certify original-release full GUI,
Safari/Firefox, driver reset/resident memory, combined performance or exhaustive
button-chord/rollover histories; those remain required gates. Disabled native
rotation remains outside reachable parity scope.

Next integrated acceptance must cover full-window native startup and populated
sample hover/press histories, presets followed by keyboard input, overlapping
controls/images/representatives, both gel rendering modes and both backends.
Existing exact component captures and combined hidden-lane workflows provide
inputs to that audit, not a substitute for it. Production switching and removal
of duplicate paint follow acceptance, then built shared-renderer root/subpath,
exact edge/solid, browser, lifecycle and performance verification.


### Integrated startup window acceptance

The complete shared startup client area at 1365×768 logical pixels, DPR2 now
matches the existing 2730×1536 native framebuffer exactly on both backends:
zero differing RGB channels, with no crop or tolerance. The user-supplied PNG
independently agrees after removing the title bar and compositing its macOS
rounded window transparency on white. All application pixels participate.
See `reference/web/shared-gel-startup/full-window/provenance.json` and the
`shared-startup-window.spec.ts` regression, which pins the native PNG hash.

Populated full-window acceptance remains open. The existing native application
probe can capture the real completed framebuffer; native SampleView's particle
engine must also export its capture-time state so web replay uses identical
particles. Keep any diagnostic accessor/capture instrumentation isolated and
recorded, without replacing native paint or changing references to fit web output.
Verify native repeatability and compare complete sample/species/settings/menu
scenes before broadening to overlapping loupes/images and workflow transitions.

Startup acceptance regression: 943 browser cases pass (one intentional duplicate
skipped). Final output pixels agree with both retained captures. The image file
queue tests now isolate File decoding from unrelated UI asset Blobs, preserve
bitmap decode options and deliberately exercise a concurrent Blob decode. No
application code, reference pixels or tolerances changed in this increment.


### Integrated sample and species window acceptance

Complete sample and species windows now match controlled native captures exactly
on both backends at 1365×768/DPR2. The test imports the captured gel document,
opens the actual tube and replays captured particles. Native references and
comparison tolerances are unchanged. Twelve native PNG/state/diagnostic files
repeat byte-for-byte across independent launches; hashes are retained.

Native MVP evidence required composing projection and view coefficients before
vertex transformation. Mesh and texture operations now share that path when a
logical window size is supplied; legacy callers retain their existing path.
Logical viewport changes invalidate the projection even when the physical surface
size is unchanged. Removing this invalidation makes both resize regressions fail.
Native displayed slider values now use the float32 normalize/map/quantize path,
including the custom buffer boundary, without changing stored model values.

Modern Cinder palette conversion differs from independently captured original
release values. Full captured-document replay makes inputs identical while
preserving original-release web defaults. This acceptance covers controlled
rendering, not RNG or interaction history. Settings/menu/loupes/images/overlap,
production shared enablement, original-release GUI, platform and performance
gates remain open. Independent review found no Critical or Important issue;
direct numerical unit cases were suggested as an optional localization aid,
while current independent native browser comparisons cover the behavior.

Verification: 949 browser cases pass (one intentional duplicate skipped), 2,924
units pass, production build and four legacy root/subpath checks pass. Retained
web output and source hashes: `reference/web/shared-full-window-scenes`.


### Integrated settings/menu workflow acceptance

The actual application follows the native settings/menu/Render sequence at
1365×768/DPR2: settings alone, settings with menu, both with Render off, menu after
closing settings, then menu with Render on again. Five complete RGB captures per
backend match exactly. No implementation or tolerance change was required.

Native `full-window-controls` probe uses real mouse events after completed frames,
without changing drawing methods. Twelve PNG/state files repeat byte-identically.
The portable instrument reproduces the compiled source from the original hashed
inputs. Retained web evidence is `reference/web/shared-controls-window`.

Validation: two new workflow tests pass, comprising ten exact comparisons. The
preceding 949/one-skip full suite, 2,924 units and build/four legacy deployment
checks remain the latest broader verification; runtime source is unchanged.
Remaining integrated acceptance includes overlapping images/loupes/representatives,
particle and input histories, then the production and platform gates above.


### Integrated image/species/loupe overlap

Six complete native frames cover image resizing before and after species inspector
creation, a persistent loupe, an image above that loupe, and raising the loupe.
The complete web window matches all twelve RGB comparisons across both backends
at 1365×768/DPR2. Native model/particle inputs are replayed; native draw methods,
references and comparison tolerance are unchanged. Twelve PNG/state files repeat
byte-identically, with portable instrumentation reproducing compiled source.

The final background click revealed missing native retained-reference semantics.
SampleView::selectFragment(-1) retains its derived sample; setToOrigin cannot
resolve an invalid fragment. GelView::tick therefore follows that off-gel sample
and closes the ordinary sample. The web had dispatched a null reference, leaving
the source panel open. Background picks on frame/anchor/wedge now retain the
synthetic sample with a null fragment index, using existing selection-following
logic. The new overlap regression fails before the fix on both backends; corrected
legacy/shared selection tests also fail before the fix on both backends. Existing
tests expecting the ordinary sample after a background drag/Delete were incorrect
and now assert closure after the drag and continued absence after deletion.

This accepts this effects-mode overlap history, not every input/RNG history or the
production compositor. Before production switching, add a direct-render overlap
counterpart and account for remaining combined hover/press/preset-keyboard
scenarios using native and existing workflow evidence. Then switch the built app,
verify exact shared solid/edge composition in an integrated fixture (the old
resolved CSS-underlay audit describes the retired architecture), and run the
built shared root/subpath, browser, lifecycle and performance gates. Do not call
the earlier legacy deployment checks shared-production evidence.

Overlap verification: 953 browser cases pass (one intentional duplicate skipped),
2,924 units pass, production build and four legacy deployment checks pass. All
twelve full-suite overlap outputs match the retained exact native comparisons.


### Direct-render overlap acceptance and production cutover sequence

The six full-window overlap states now pass with Render disabled as well. Cmd-R
runs through the initialized native/web keyboard handlers; all native state exports
confirm Render=false. Capture scheduling observes native update counts, because
OS draw callbacks can precede setup or vary relative to simulation updates. No
native timestep, simulation or draw method changes. Twelve files repeat exactly;
the portable instrument reproduces compiled inputs from original hashes.

The parameterized browser regression passes four tests / twenty-four exact RGB
comparisons across effects/direct and both backends. Application source remains
4dc7210; no extra full/unit/build run is needed for this test/evidence-only change.
The preceding full verification remains 953 browser cases, one skip, 2,924 units,
build and four legacy deployment checks. Native release composed-move, shared
hidden-lane, sample background/held-input, buffer-to-Tab and component-overlap
fixtures supply additional bounded interaction evidence; unrestricted RNG/input
history and release/platform certification remain separate roadmap gates.

Next execute the existing production switch requirement concretely:

1. Add failing built-app assertions for the shared scene, backend ownership and
   absence of per-view graphics contexts at root and subpath. Verify that storage
   preferences cannot select the retired compositor in a production build.
2. Add exact built-app startup/settings native comparisons and controlled native
   edge/solid fixtures using the actual compiled FragmentWell/SampleSimCanvas
   contribution, not the standalone presentation prototype. The old audit's
   resolved CSS underlay cannot represent a shared-MSAA architecture. Preserve its
   failure dossier, native inputs and exact thresholds; make release audit commands
   target the current production composition contract.
3. Enable the shared compositor for production. Keep legacy development fixtures
   available for diagnostic comparisons; live production views must not acquire
   their retired canvases or duplicate painting. Existing shared branches already
   suppress those paints when a registry exists; verify in the compiled app.
4. Run unit/full-browser/build/deployment/native composition gates, then built
   shared compatibility, lifecycle and combined workload/resource checks. Perform
   final migration review before declaring this switch accepted. Preserve every
   remaining original-release/platform/roadmap gate.

A test-only way to replay controlled production component inputs without adding
product hooks is to inspect the pinned React18 DOM fiber/provider chain for the
existing store and scene registry. Use public store/registry behavior where
possible, assert the discovered shape, and keep any fixture isolation explicit.
For the edge/solid fixture, the representative contributes key inspector-fragment,
order0; brace, palette and sliders have separate orders. A controlled fixture may
select this compiled contribution, supply the native underlay geometry, position
its DOM canvas at origin, and use a303×520 logical window matching the native
projection. This proves the compiled component/compositor boundary; complete-window
built-app tests remain a separate requirement. Do not silently instrument renderer
math or substitute native meshes for the generated representative.

### Production cutover validation, in progress

Steps1–3 above are implemented locally. Production always creates the shared
registry; an explicit stored legacy preference cannot override it. Development
legacy fixtures remain available. The deployment assertions first failed on the
missing shared canvas before enabling the production registry. The compiled
production suite now passes16 tests, including216 exact native RGB comparisons
(24full windows,192 controlled component scenes). Fresh units:2,924/71files.
The source review found no Critical or Important cutover issues. Retained
source/build/test/native/output hashes and RGB results are in
`reference/web/shared-production/provenance.json`. No native reference or
tolerance changed. Both release fragment-audit configs now select the compiled
component fixture; package scripts build before auditing. Historical resolved
CSS-underlay fixture failures remain preserved.

Step4 remains open. Shared-build WebKit deployment:2pass. Firefox:2launch failures
before application evaluation, same profile/framebuffer limitation as earlier.
The first broad browser run had948pass/7fail/1skip; Vite logged test-file-triggered
page reloads during that run. The clean run with no watched-file edits passes955 tests/1intentional skip;
all seven failures clear without product or assertion changes.
Combined workload instrumentation asserts shared context ownership; both built
backend cases pass with steady p95 frame intervals16.7–16.8ms and flat tracked
resource counts (236/WebGPU,49/WebGL2). Reports are retained with production
evidence. Built hidden-tab lifecycle acceptance and broader platform gates remain.
Do not represent this increment as completed P0–P5 or release certification.
