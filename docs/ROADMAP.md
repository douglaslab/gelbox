# Gelbox web parity roadmap

_2026-10-09 · Replacement roadmap · Product direction confirmed; native reference collection underway._

Current execution evidence and the finite remaining acceptance packages are in
[PARITY-LEDGER.md](PARITY-LEDGER.md). The problem statements below preserve the
original audit context; later integration records are historical checkpoints.
They do not supersede the current ledger or relax this completion contract.

## Execution order as of 2026-10-11

The implementation strategy is unchanged: finish the existing TypeScript web app.
The local website preview has been refreshed from source `f017f10` and committed
in the website repository as `5440489`. This includes native-compatible image loading
through Open, the right-edge sample-drop correction and native pointer-modifier
handling. Publishing remains deferred by
Shawn's explicit instruction to prepare both releases locally for review.

A [pointer-modifier correction](../reference/web/loupe-modifiers/README.md) is
verified in development and an isolated production build, including all58
compatibility cases, and staged on the local website. The two-hour memory run
continues against its separately retained26b4eb0 build; do not replace ts/dist
during that run.

The next completion work is ordered below. These are the remaining portions of
P0–P5 and W01–W09, not new milestones or a reduced definition of done.

1. **Complete original-native editing traces (W02–W05).** Persistent-loupe
   move/return, left-button frame/probe/wedge gestures, molecule/background
   selection, water→TBE, hidden-lane reduction/restoration and populated off-gel
   removal now have paired traces. Tied and unequal-overlap deletion, one zero-
   voltage drag and one negative-voltage drag are also verified in their stated
   scopes. Continue modifier clone/Shift-lock, occupied destinations with loupes,
   remaining picked aggregate offsets and slider/focus/secondary-button branches.
   Keep exact saved-document comparisons and observable view/selection checks.
   Native Option-drag tube cloning is prepared on the current one-species fixture;
   a manual lane1→lane2 Option-drag was requested because the UI tool cannot hold
   a modifier during a drag. Do not mutate that native fixture while awaiting it.
   Independent reference/platform work can continue. Automated web tests do not
   replace the required native traces.
2. **Finish remaining native file/image and platform observations (W01, W06,
   W07).** Replay native occupied/full/mixed drops and visible image decoding;
   compare the corresponding compiled workflow. Exercise actual shipping-browser
   background/resume, physical display-scale changes and OS sleep/resume on
   named hardware. Physical actions require a coordinated manual session;
   engine emulation alone cannot close them.
3. **Resolve reference and distribution decisions (D02, D03).** Keep the original
   executable authoritative where modern-Cinder JSON/color behavior differs;
   record scenario-specific provenance and unresolved limits. The modern Cinder
   library now has a clean-source rebuild with exact object-member correspondence;
   original-release binary provenance remains separate. Decide the captured
   Avenir asset distribution strategy and supported text/platform scope before
   public distribution. The Inter license notice is already shipped. Do not
   substitute a fallback font silently or assert legal rights from visual tests.
4. **Finish reliability disposition (W08).** Define and justify a finite release
   memory criterion, then run it against a fixed revision. Existing 1,000-cycle
   RSS/physical-footprint reports do not establish a long-term bound.
   Retained JS/DOM and explicit GPU resources are stable in their measured scopes;
   native allocator/driver retention remains incompletely attributed. Resolve
   the historical native missing-view observation with reproduction/attribution
   or an explicit accepted disposition; additional green unrelated runs do not
   close it. Avoid repeating the same soak unless it answers a new hypothesis.
5. **Perform final acceptance and release handoff (W09).** Once the above items
   and accepted exceptions are recorded, run the required numeric, unit, browser,
   native-RGB, compatibility, lifecycle and performance checks from one recorded
   revision. Present complete paired workflow captures for Shawn's review.
   Refresh the website bundle only if runtime/assets changed; verify its actual
   deployment path and download hashes. Publication requires Shawn's approval.
   The native Apple Silicon download is prepared but remains ad-hoc signed and
   unnotarized; normal trusted macOS distribution needs signing/notarization.

Local preview availability is a separate deliverable from full parity acceptance.
The app and native download are already reviewable at the local `/gelbox/` page;
the outstanding certification work must not be described as missing website
integration. Exact current evidence and open subcases remain in the parity ledger.

## Goal and authority

Deliver a browser version of Gelbox with **strict native behavior and visual parity first; improvements afterward**. Finish the web application before reconsidering Rust, a shared native engine, or desktop packaging. These priorities were explicitly confirmed by Shawn during this review.

The reference is `../gelbox` at `5f51097`, including its effective runtime configuration, tuning assets, startup scene, UI, file formats, and interactions. The implementation reviewed is `gel` at `2f3021d`. Record different reference revisions explicitly; do not let the target drift as code changes.

This document replaces the old phase overviews as the forward roadmap. They remain historical implementation records, not instructions to resume at M26b. [STATUS](STATUS.md) records current evidence; [PORT-AUDIT](PORT-AUDIT.md) records the initial parity inventory. Detailed implementation plans should be written one increment at a time after its reference behavior is established.

**Done means:** the same starting document and supported user actions produce equivalent document state, scientific output, visible scene, selection, and focus behavior in native Gelbox and the web application, subject only to explicitly accepted browser-platform differences. Passing tests of the existing TS implementation alone is insufficient.

## Why replace the old plan

The earlier effort produced valuable working code, but its acceptance model was weak:

- Components and milestone tags substituted for complete workflows. Save/Open disappeared during the UI rebuild while save/load remained marked complete.
- Tests often proved the TS implementation agreed with itself. Existing image baselines are TS regression references, not evidence that C++ and TS match.
- Requirements were inferred from descriptions rather than verified against the native application. The proposed toon shader and bloom did not exist in the native renderer; image-to-sample inference was mistaken for native image loading.
- Disabled experiments and active behavior were mixed together. Native buffer sliders and gel rotation are disabled by default; the sample-buffer mobility experiment is compiled out.
- Product direction drifted between a TS oracle for Rust, a pixel-precise port, and a browser redesign. Inter typography, generic app chrome, sticky panels, enabled rotation, and hidden panels on narrow screens accumulated without a single parity contract.
- Integration is under-tested. H₂O global distortion exists in both renderers and their dev harness, but `GelCanvas` does not pass the running-buffer-dependent global warp to either renderer.

The correction is to organize delivery around native-observable behavior with independent reference evidence, and to change internals only where necessary to achieve it.

## Strategy: retain the core, replace weak boundaries

Three options were considered:

| Approach | Benefit | Cost / risk | Decision |
|---|---|---|---|
| Continue the existing milestone queue | Fastest path to more loupe features | Leaves missed workflows, architecture ambiguity, and unproven parity underneath | Reject as the organizing strategy |
| Targeted reconstruction around a native reference | Preserves tested rendering/simulation while repairing state, interactions, and integration | Requires reference capture and deliberate migration of shared contracts | **Recommended** |
| Start over, or port C++ to WASM/Rust immediately | Could reuse some native algorithms or establish a new shared engine | Does not solve browser UI, file compatibility, or reference validation; discards working code and adds toolchain risk | Defer unless a concrete blocker justifies it |

Keep TypeScript, React, Vite, the pure simulation modules, existing assets, mesh generation, and both GPU backends initially. A new framework or engine language is not a parity requirement. Do not discard working subsystems merely because they were written by an earlier model.

Refactor the document/state and interaction boundaries incrementally. Preserve behavior with reference fixtures as each boundary changes. Do not introduce a general-purpose graphics engine, application framework, or sweeping renderer abstraction before a measured need.

### Measured need: shared composition for overlapping graphics

The fragment transparency work exposed a concrete limit of independent canvases:
shared native MSAA edge samples become independently averaged browser layers.
The [intersecting-edge audit](../reference/web/fragment-edge-scenes/README.md)
measures up to 24/255 RGB error, even with an exact native underlay image.
The 1–2/255 solid-background result cannot justify a general tolerance waiver.
The white-cutout workaround is removed; real transparency improves visible
behavior, while exact composition remains an open requirement.

The shared-surface probe now matches all 32 edge-reference comparisons exactly
(native/generated meshes, both backends, DPR1/2), without production changes.
The [design](superpowers/specs/2026-10-10-shared-composition.md) and
[plan](superpowers/plans/2026-10-10-shared-composition.md) specify the integration.
The probe establishes feasibility; the production view compositor is still open.

Rendering integration sequence:

1. Shared mesh-surface proof and ordered mesh/texture operations are implemented.
   Preserve their per-operation blend, transforms, clipping and sampling contracts
   while migrating real views into both existing presentation backends.
2. Inventory view order, window transforms, opaque scene backgrounds, images,
   braces, text and control interleaving before deciding how far the shared
   surface must extend. Preserve hit testing and simulation ownership.
3. Integrate the necessary composition boundary incrementally. Do not equate
   graphics composition with a need to replace React, TypeScript, simulation,
   file workflows, or introduce Rust.
4. Re-run solid and intersecting-edge audits, real overlapping view workflows,
   graphics recovery, DPR/resize and resource/performance checks. Exact failures
   remain open unless resolved or explicitly accepted by Shawn.

## Parity rules

1. **Observe before implementing.** Each capability has a native scenario, expected state/result, and matching web scenario. Source confirms the algorithm; a native run confirms the effective configuration and visible behavior.
2. **Distinguish active, disabled, and missing behavior.** Port enabled behavior. Reproduce disabled control states. Do not activate experimental chemistry or rendering modes to make the port appear more complete.
3. **No silent redesign.** Native panel lifecycle, geometry, typography, controls, picking, and modifiers remain the target. Any unavoidable platform adaptation is recorded with its precise effect and approved before counting that row complete.
4. **No silent scientific changes.** Preserve native tuning precedence, ranges, units, rounding, color conventions, and formulas. Native-model parity is not a claim of experimental accuracy; improving the scientific model is a later project.
5. **No self-certified visual parity.** Native captures and numeric exports are the reference. TS screenshots remain useful regression tests, but must not be relabeled native goldens.
6. **No completion by deferral.** Every parity requirement ends as verified, explicitly accepted deviation, or open. A milestone label never overrides an open required behavior.

Browser file dialogs, downloads, OS window borders, browser-reserved shortcuts, and GPU/font rasterization can differ from a native executable. Limit exceptions to those boundaries; do not use them to waive application behavior. Initial visual certification is on macOS, using the native app's client-area dimensions and actual display scale. Broader browser/platform support is a separate compatibility matrix.

## Architecture decisions

### Document data, interaction state, and derived output

Keep three explicit categories:

- **Document:** samples/species, order and lane placement, buffers, voltage, time, well damage, and native sample metadata. Keep the model small; nested arrays with stable internal IDs are sufficient. Do not normalize everything into an entity framework.
- **Interaction/view state:** one authoritative selected sample/species reference, rollover, keyboard focus, visible panels, active gesture, loupe frames/anchors, reference-image views, and app settings. Match native persistence boundaries: do not silently add loupes/images/UI state to native gel saves.
- **Derived state:** well geometry, per-sample simulation context, bands with source references and aggregate identity, synthetic loupe samples, particle meshes, and GPU resources. Compute these from current inputs rather than serializing stale layout or selected-lane context.

The present mixture of `selection`, `selectedFragmentIndex`, `selectedLane`, and `lastSampleLane` must be reconciled. Native object identity follows a sample when it moves; lane/index references alone do not. Stable internal sample identity must preserve native references through moves, clones, removal and loupe ancestry. Native SampleFragRef combines a sample pointer with a raw fragment index: swap-delete and dye compaction do not automatically remap external indices. Preserve those observable semantics; do not introduce stable species IDs that silently change them. Native-format files need not contain these internal IDs. Duplicate/clone operations create new identities; derived loupe species carry an explicit source reference.

Introduce IDs at the document boundary and adapt to existing pure simulation inputs; do not rewrite the numerical core to accommodate UI identity. Preserve source ordering. Avoid an all-at-once reducer rewrite: migrate selection and one editing path, prove it, then extend.

### Editing and picking

Move mutation rules out of individual pointer handlers into a small shared command layer used by controls, keyboard shortcuts, and drag gestures. This is an internal boundary, not a new undo feature. Support gesture begin/update/end/cancel and keep transient bookkeeping separate from the document.

Use explicit coordinate conversion between client coordinates, application workspace coordinates, gel coordinates, and particle-canvas coordinates. The same conversion must serve picking, dragging, drop placement, and loupe anchoring at every scale/DPR. Preserve native drag offsets, picked aggregate tier, overlap precedence, lane gutters, focus order, and modifier semantics. Test cancellation/lost capture without inventing a different native drag outcome.

Selection in a synthetic loupe must resolve to the original species, as native `SampleFragRef::setToOrigin()` does. A loupe is not just a decorative particle popup.

### Rendering and runtime

Keep WebGPU and WebGL2 until both are characterized against the native reference. Share CPU scene data, geometry, colors, and render configuration; do not independently reinterpret formulas in the two backends. Consolidate duplicate orchestration only where it reduces demonstrated divergence.

Provide one explicit render-scene input that includes bands **and** global effects. Route the real application through the same renderer path as the reference harness. A buffer change must reach geometry, brightness, and global warp together.

Centralize backend acquisition/failure handling: an exposed `navigator.gpu` is not proof of a usable adapter. Test failed acquisition, lost device/context, async unmount, resource disposal, resize, and DPR changes. Recover or use the working alternate backend; if neither works, display a clear failure rather than a blank gel. A degraded 2D sample view is not a substitute for full application parity.

Retain mutable particle engines outside React's per-frame state. Match native timestep, population, radius, degradation, and picking semantics before optimizing. Profile real interactions and multiple loupes before considering pooling, workers, WASM, or compute shaders.

### Files and application shell

Native Gelbox JSON is the primary interchange format for the parity release. Implement import/export adapters and verify native → web → native. Preserve sample names, icon metadata, IDs, dyes, aggregate weights, colors, buffers, and empty lanes. Do not interpret native serialized memory-pointer ancestry as persistent identity; the native reader ignores it too.

Import the native-supported sample XML dialect, backed by real fixtures. Native XML reading/writing is inconsistent in places; characterize the actual reader and bundled assets rather than invent a general XML schema. Native gel XML export is not required. Continue reading the current `gel-sample-v0` and `gel-state-v0` artifacts so existing rewrite work remains usable.

Validate external data before replacing the live document. Invalid/unsupported files produce an actionable error and leave the current document intact. Layout-derived fields from old web files require an explicit conversion policy; they must not override the native geometry model accidentally.

Reproduce the native application client area, global settings menu, help, gel controls, sample controls, and panel lifecycle. Home/Dev tabs, theme toggle, build footer, and debugging readouts belong outside the parity surface. Preserve dev routes for engineering. Do not replace the native visual language with a new design system.

Avenir is part of the reference. First certify on a system where the native fonts are available; determine a distributable font strategy without assuming system fonts can be bundled. Any cross-platform substitute and its visual effect need an explicit acceptance decision. Do not silently claim Inter is equivalent.

## Delivery sequence and gates

These are product increments, not estimates of calendar duration. The work left is larger than M26b/c. Estimate each increment after its reference scenarios and unknowns are resolved.

### P0 — Establish a trustworthy native reference

**Deliverable:** a reproducible baseline and complete parity ledger.

- Launch a known native build at the pinned source revision, or make minimal build-compatibility changes in an isolated reference checkout. Record every patch; no behavior changes disguised as build fixes.
- The existing Xcode project expects `cinder_0.9.0_mac`; investigate the actual build environment before assuming the native app can be rebuilt on the current machine. If rebuilding is impractical, use a known matching native executable/environment and document provenance.
- Record effective tuning/configuration, default ladder, fonts, client-area size, display scale, and initial state. Capture the native app at 1365×768 client area and DPR 1/2 where supported, then record native resize behavior separately.
- Capture chrome resolution and gel render resolution separately: native `mEnableHDGelRender` is false by default even when the display is HiDPI. Increasing gel resolution is not automatically a fidelity improvement.
- Walk every enabled control and documented shortcut, including negative cases: empty lanes, occupied destinations, overlapping bands, dye selection, repeated drags, deleting the final species, lane-count changes, all loupe drag modes, settings toggles, and reference images.
- Export canonical numeric data from the actual C++ functions where feasible. Keep capture instrumentation isolated. If a numerical harness is needed, compile the native algorithms with minimal adapters; a second handwritten TS implementation is not an independent reference.
- Separate deterministic geometry/mesh fixtures from stochastic particle motion. Record native RNG/seed/timestep; use identical frozen particle inputs for renderer comparisons. For lifecycle/motion, verify native transitions and distributions across seeds, not one fortuitously matching screenshot.
- Define tolerances per output class using native repeatability and rasterization variance. IDs/order/discrete transitions are exact; floating output gets a justified numeric tolerance; text/antialiasing differences get localized treatment. Broad image-difference allowances must not hide missing features.

**Gate:** every active capability has a reference scenario and classification. A runnable native reference, native captures, and agreed comparison rules exist. If only source evidence is available, implementation may proceed on source-backed items, but strict visual parity remains unverified and cannot be declared complete.

### P1 — Restore the native application and file workflow

**Depends on:** P0's startup, settings, file, and layout contracts.

- Remove generic web chrome from the parity surface; reproduce native startup, app-settings/help placement, and Save Sample / Save Gel / Open access and shortcuts.
- Establish the document/view separation, internal identity adapter, and import validation needed by this workflow; preserve the existing numerical engine.
- Add native JSON import/export, native sample XML import, and current web-format import. Match dropped-sample lane selection and full-gel replacement behavior.
- Match native initialization, file metadata, defaults, sparse/empty lanes, and unsupported-file handling. Browser picker/download mechanics are boundary adaptations; document replacement semantics remain native.

**Gate:** a real native gel/sample opens in the web app, is edited, saved, and reopens in native Gelbox with equivalent supported data and visible result. Malformed input does not corrupt the current session. Files and app controls remain accessible after switching all panels.

### P2 — Complete native editing, selection, and UI behavior

**Depends on:** P1's document/selection boundary and P0's interaction recordings.

- Create species through the native add button and right-click path; match empty-tube sample creation, duplication, deletion, Tab/Shift-Tab, Escape, focus, and panel opening/closing.
- Complete sample moves/clones, off-gel removal, and occupied-lane behavior. The current swap/overwrite behavior must be reconciled against the native app, not retained by accident.
- Complete cross-lane band moves/clones, Shift size lock, picked-aggregate-aware reverse solving, click-to-band offset, and overlap picking. Do not resize dyes through the DNA reverse solver.
- Route dye selection to native dye/sample settings; keep a single selection/rollover identity across gel, sample, and inspector.
- Match native slider mapping, quantization, notches, presets, ranges, graph editing, labels, disabled states, and focus visuals. Keep buffer sliders and rotation disabled under the reference defaults.
- Match lane-count reduction/restoration semantics. Native `Gel::setLayout` retains sample storage when reducing visible lanes. The TS reducer now preserves it, with reduce/save/restore browser coverage; expand native replay coverage for subsequent editing and rendering.
- Reproduce native layout, asset proportions, typography, and resize behavior. Do not replace hidden narrow-screen panels with an unapproved redesign; first match the native reference, with browser limitations recorded explicitly.

**Gate:** replay the editing scenario suite in both applications with matching document values, selection, focus, panel visibility, and screenshots. The suite covers complete multi-step edits and actual pointer/keyboard input, not only synthetic events and isolated reducer calls.

### P3 — Certify numerical and rendering fidelity

**Depends on:** P0's independent outputs; uses P1/P2's real application path.

- Audit mobility, diffusion, brightness, smear, flames, smile, well damage, aggregation, dyes, rounding, and tuning precedence against native output.
- Cover time 0/end, voltage negative/zero/positive, degradation across 0..2 including the split at 1, base/mass/aspect extremes, empty/zero aggregate distributions, mixed dyes, and each running-buffer preset.
- Test the reverse solver at non-unique or unreachable positions, zero/negative voltage, and non-first aggregate bands. Match native behavior where defined; record genuine native defects separately for an explicit decision.
- Wire running-buffer global effects into `GelCanvas` and test H₂O faintness/distortion through the actual gel-settings UI on both backends.
- Match whole-scene composition: wells, clipping, band focus, drag visuals, and the simpler band drawing used when the native app's Render toggle is off. Reproducing the toggle without its alternate scene is incomplete.
- Restore native wholeness ranges and loupe degradation filtering. Verify particle density, sample size scaling, multimer distribution, jitter, fade, age/cull behavior, picking, outline/fill geometry, color space, and seed/time inputs.
- Compare gel, sample, and complete application frames against native captures. Keep renderer-only goldens as a lower layer of regression coverage.

**Gate:** all reference numerical cases meet recorded tolerances, visual differences are explained or corrected, and real-app UI changes produce the native scientific/rendering result on both backends. No pending approximation may be described as exact parity.

### P4 — Complete native loupes and reference images

**Depends on:** P2's coordinates/identity and P3's synthetic sample/particle fidelity.

- Open loupes at every native-valid gel position, including empty background. Match default placement, frame, callout wedge, anchor circle, focus, and multiple-loupe behavior.
- Implement the three native drag modes, persistent and transient hover loupes, the global hover toggle, close/delete/Escape behavior, and resizing/scroll coordinate consistency.
- Carry source ancestry through synthetic samples so selecting/hovering a loupe molecule selects/highlights the original species. Keep content current when the source sample or gel settings change.
- Import native-supported PNG/JPEG/GIF reference images as movable/resizable views, with native stacking, aspect, focus, and deletion behavior. Match native persistence: images are not implicitly saved in a gel file.

**Gate:** native/web replay agrees for loupe creation, all drag modes, hover preview, cross-view selection, source edits, and image manipulation. Multiple views do not leak resources or interfere with gel interaction.

### P5 — Browser reliability and parity release

**Depends on:** P1–P4 passing.

- Verify capability fallback, device/context loss, route remount, resize/DPR changes, hidden-tab resume, and opening/closing multiple loupes. Measure actual app workloads, not just the isolated 50-band harness.
- Certify macOS Chromium/WebGPU and Chromium/WebGL2 against native first. Exercise Safari and Firefox for web compatibility and record actual supported paths; do not assume support merely because an API exists. Add other OS coverage before advertising it.
- Run unit/numeric, interaction, and native-reference visual checks in appropriate environments. Existing Linux CI does not certify WebGPU or real-GPU performance; keep a reproducible macOS/hardware release gate.
- Build and serve production artifacts at both root and a subpath. Check assets/fonts, hash routes, file workflows, and error states against the built output. Relative Vite base alone does not fix absolute `/assets/...` URLs.
- Compare a repeatable 50-band plus sample-view/multiple-loupe workload with the native reference on named hardware; record frame-time distribution, responsiveness, and resource growth. Choose a release budget from those measurements, not an unsupported FPS promise.
- Resolve every ledger row and accepted deviation. Have Shawn review the side-by-side native/web scenario captures and run the complete app workflow.

**Gate:** the full parity ledger is verified or has explicitly accepted deviations; production-build and compatibility checks pass; no required feature is merely hidden behind a dev route. Deployment target selection and publication are separate release actions, not implied by writing this roadmap.

## Verification design

Use four complementary test layers:

| Layer | Reference | Detects |
|---|---|---|
| Pure model and command tests | Document invariants and native transition records | Identity/order errors, mutation rules, stale selections, malformed imports |
| Numerical differential tests | Frozen outputs from native C++ plus effective tuning | Formula, rounding, context, aggregate-tier and inverse-solver discrepancies |
| Behavioral replay | Identical native/web starting files and action sequences | Missing wiring, focus/panel transitions, modifiers, file and gesture behavior |
| Visual comparisons | Native client-area captures and controlled scene data | Geometry, colors, fonts, density, effects, and selection/loupe appearance |

Retain existing tests, but label their provenance. Passing 285 units and both 52-test browser suites is a useful regression baseline, not a parity certificate. Add a regression at the user-facing integration boundary for each discovered omission; do not regenerate goldens to hide a mismatch.

Five high-risk sequences must be covered across increments: (1) import a native file, edit it, save and reopen in native; (2) move/clone/delete selected species while sample and loupe views are open; (3) reduce/restore lane count with populated lanes and then save; (4) drag a degraded multimer band at unusual voltage/time; (5) change buffer with live loupes, resize/change DPR, and recover from a renderer failure. Test the resulting document and visible view, not only the absence of exceptions.

## Explicitly after the parity release

- Undo/redo, autosave/recovery, redesigned creation flows, and new shortcuts.
- New responsive/mobile composition, touch alternatives, comprehensive keyboard/screen-reader redesign, dark mode, and new visual identity. Preserve browser semantics where they do not alter parity, but do not claim these larger features already exist.
- Image-to-sample inference, calibrated scientific-model improvements, new chemistry effects, and new rendering effects.
- Rust/wgpu/WASM, workers, native packaging, or a shared engine—only for a concrete requirement or measured limitation.
- Accounts, cloud storage, collaboration, and server infrastructure remain outside the current goal.

## How to execute without repeating the earlier drift

Start with P0, not another loupe implementation. For each increment, write a short implementation plan grounded in its now-known reference cases, list the exact modules affected, and preserve a working application throughout. Keep internal refactors and native-behavior restorations reviewable. No need to prescribe every function for all six increments before the reference exists.

Update the ledger and STATUS with actual commands, captures, and unresolved differences after each increment. Treat original M1–M27 tags as history. Avoid speculative multi-week estimates until P0 exposes the reference-build and fidelity costs. A behavior change or new platform exception changes the contract and must be surfaced rather than folded into a “polish” commit.

The initial roadmap review led into implementation under the same contract. See STATUS for completed increments and their limitations. The reference dossier, numerical captures and file/edit/save slice now exist; P0–P5 gates remain open until their complete scenario coverage is verified. The observed WebGPU/WebGL2 band-curvature coordinate mismatch is corrected. Native CPU warp fields now have independent exact-byte captures covering RNG, float arithmetic, truncation and output-resolution sampling; see STATUS for finite-matrix and toolchain limits. Hover previews, their source-backed event lifecycle and shared checkbox/shortcut toggle are now restored. Sample/view references now preserve runtime identity across immutable edits, moves and removal, with native raw species indices and frame selection-following. Reference-image views now support native drops, geometry, ordering and persistence boundaries, with independent native gesture captures and browser integration checks; original decoder/raster equivalence remains open. Next priorities are remaining native controls, then controlled native/web visual replay and production reliability gates. Native loupe interpolation is disabled in the pinned source; do not add an animation based on comments alone. Cross-backend agreement is regression evidence, not native raster certification.


Render-off update: the native checkbox/Cmd-R and alternate direct band scene are now implemented on both web renderers. Fourteen compiled-native mesh captures compare exactly, and browser probes cover additive pixels, DPR/resize, current edits and asynchronous mode-switch cleanup. This closes the missing alternate-scene implementation item; full native raster and P0–P5 release gates remain open. See STATUS for verification and limits.

Application runtime update: the synchronous store, application-owned random streams and ordered frames now drive the live UI. Native species creation, right-pointer creation/drag, loupe refresh/lifetimes and renderer-independent simulation have unit/native/browser coverage. Final review found a held-gesture rollover defect, now fixed with failing-then-passing store/browser regressions. The one-frame React highlight lag is also fixed: draw-time references and a failing-then-passing same-frame browser regression cover ordinary/loupe highlight resolution. The broader native GUI/raster and release gates above are unchanged; see STATUS for evidence and limits.

Help update: the original corner icon, asset scales, native URL and focus-preserving external navigation are restored and tested on both backends. Native original-release screenshot/input works again; next is the source-backed application-menu geometry correction, followed by broader native visual/workflow certification. The full P0–P5 gates remain open.


Application-menu update: native item placement, checkbox alignment, original
notched divider and measured 1×/2× button extents are restored. Retina Help asset
loading is corrected and checked by actual image decoding. Full-suite testing also
exposed and fixed a loupe rollover left behind when a frame acquired the highlight
without a mouse event; a failing-then-passing stationary-pointer regression covers
it. The current suite passes 281 browser cases, with one intentional duplicate
skip, and the production build passes. Complete native typography/raster and
composed workflow certification remain next, followed by P5 reliability/platform
checks. See STATUS and reference/native/menu for evidence and limits.


Slider-control update: regular slider icons now retain natural logical size and
native notional hit slots at 1×/2×; timeline bounds now follow GelboxApp's inset
and width formulas. Source-backed geometry and reviewed web diff evidence are in
reference/native/slider-controls. Full browser verification passes 285 cases,
with one intentional duplicate skip, and the production build passes. Next
control correction: native handle-relative drag semantics, followed by remaining
handle/notch/text, graph and buffer-bar comparisons. Full phase gates remain open.


Regular-slider gesture update: handle drags now use the pre-click value plus mouse
delta, preserving native's distinct initial track-hit behavior. Owned primary
pointer gestures terminate on release/cancel/capture loss, and notch capture uses
native's four logical pixels. Twelve new failing-then-passing browser cases bring
the full passing suite to 297 (one intentional duplicate skipped); build passes.
Continue with graph gestures and remaining control raster/typography, then complete
composed native workflow and P5 release certification. These are not closed gates.


Aggregate graph update: full-area editing, current-column dragging, accumulated
edits, endpoint icon presets and native 0.05/8px quantization/snapping are restored.
Six JSON-validating browser regressions pass, with 303 passing full-suite cases
(one intentional duplicate skipped) and a passing build. Next: preserve short
zero-leading and longer-than-seven imported distributions in the inspector, then
finish graph/control visual comparison. Native GUI and P5 gates remain open.


Aggregate import update: inspector padding now preserves zero/sub-0.001 weights
and distributions longer than seven entries; empty-array default display and
native empty-field export remain intact. Eight new import/edit/save checks bring
the passing browser suite to 311 (one intentional duplicate skipped); production
build passes. The recorded conversion defect is closed. Remaining control visual,
composed native workflow and P5 release gates remain open.


Graph layout update: native row alignment, natural icon sizes, zero-fill column
heights and baseline strokes are restored with 1×/2× geometry regressions. The
full browser suite passes 315 cases (one intentional duplicate skipped), and the
production build passes. This is source-backed geometry and reviewed web rendering;
native raster/DPR line treatment, typography, remaining controls, composed workflows
and P5 release certification remain open.


Buffer geometry update: gel and sample concentration bars now use native bar-anchored
bounds and natural molecule-image sizes/offsets. Four display-scale/backend checks
and existing saved-file tests verify geometry and disabled behavior. Full suite:
319 passed, one intentional duplicate skipped; production build passed. Remaining
buffer work includes preset notch marks and label typography/raster. Full native
workflow and P5 gates remain open.


Buffer-notch update: native preset marker placement and view-lifetime retention
are restored, including custom compositions and reopen behavior. Six regressions
bring the passing full browser suite to 325 (one intentional duplicate skipped);
production build passes. Next inspect inherited font-size adjustment and native
text measurements; full native raster/workflow and P5 gates remain open.


Font update: headings now select native Avenir-Heavy rather than Avenir-Black.
Actual rendered-face and CoreText advance checks pass at 1×/2× on both renderers;
full browser suite 329 passed, one intentional duplicate skipped; build passes.
Sampled controls already reset inherited font-size-adjust. Continue native text
baselines/raster and control stroke/handle comparison, then composed workflows
and P5 release checks. This does not close the full visual parity gate.


Handle update: restore snapped/inset native fill, solid shadow, translucent
outline and disabled colors; preserve gesture hit geometry. Full browser suite:
333 passed, one intentional duplicate skipped; production build passed. No golden
updates. Remaining control work includes native raster comparisons, line/notch
styling and text baselines; composed workflow and P5 gates remain open.


Regular track/notch update: restore source-defined line center/physical width,
opaque dot colors and snapped centers. Full suite: 337 passed, one intentional
duplicate skipped; production build passed. No golden updates. Next compare
native label baselines and composed control captures; graph/buffer stroke raster,
full workflow replay and P5 release certification remain open.


Control capture update: fresh native/web comparison records actual image encoding,
ICC profiles and equal-scale crops. Native capture is lossy Display-profile JPEG;
use profile-aware analysis, not raw byte comparison or extension assumptions.
Buffer text's half-pixel baseline error is corrected; regular slider baselines
already match. Full suite: 341 passed, one intentional duplicate skipped; build
passes. Native text raster weight and horizontal text snapping remain unresolved,
alongside full visual/workflow and P5 gates.


Font smoothing update: remove the dev shell's forced antialiased mode from the
parity workspace. CoreGraphics probes and browser captures explain the weight
difference without substituting faces; four existing font checks cover the fix.
Full browser suite remains 341 passed, one intentional duplicate skipped; build
passes. Native atlas coverage and per-glyph snapping still require comparison;
full visual/workflow and P5 release gates remain open.


P5 acquisition update: gel and molecular canvases now recover from WebGPU null
adapters, rejected adapter requests and rejected device requests through their full
WebGL2 renderers. Six failed-then-passing browser cases inspect actual contexts and
rendered pixels. Full suite: 347 passed, one intentional duplicate skipped; build
passes. Next: post-context initialization failure/replacement, reverse fallback,
clear exhausted-renderer failure, then device/context loss and lifecycle checks.
P5 and full native parity gates remain open.


P5 failure-state update: initialization failure now produces a visible error and
fresh-canvas retry in gel/molecular views. Removed the background-only molecular
2D fallback. Four tests cover unavailable graphics, unchanged native JSON saving,
and recovery of both canvases. Full suite: 351 passed, one intentional duplicate
skipped; build passes. Next: automatic post-context/reverse fallback, partial
resource cleanup, device/context loss and lifecycle certification. Full parity and
release gates remain open.


P5 setup recovery update: failed renderer setup now switches to the other backend
on a fresh canvas, with bounded attempts and explicit context retirement. Four
browser cases verify injected GPU configuration/GL shader failures, visible output
on recovery, and released failed contexts. Full suite: 355 passed, one intentional
duplicate skipped; build passes. Next: device/context loss after startup, async
validation and partial GPU factory allocation cleanup, then lifecycle/platform/
performance checks. Native parity and P5 release gates remain open.


P5 loss recovery update: active gel/sample/loupe views now recover from programmatic
WebGPU device and WebGL context loss, including a second loss after switching
backends. Browser checks verify replaced canvases, visible pixels, preserved view
identities and no page exceptions. Subscription unit checks cover retired views.
Full verification: 2,847 units, 357 browser cases, one intentional duplicate skipped;
build passes. Continue async validation/allocation rollback and lifecycle stress;
real driver resets, platform/performance and native parity gates remain open.


P5 allocation update: synchronous GPU constructor rollback now releases buffers and
textures after partial setup, including nested passes and standalone helpers. Twelve
real-GPU injected-failure cases and three ownership unit tests verify cleanup.
Full verification: 2,850 units, 369 browser cases, one intentional duplicate skipped;
build passes. Next address asynchronous validation and frame-time failure handling,
then broader lifecycle/resource-growth/platform checks. Native parity and P5 gates
remain open.


P5 validation update: asynchronous WebGPU device errors now trigger bounded full-
renderer recovery. Actual invalid startup pipelines and runtime buffers recover;
combined GPU/GL failure terminates after two attempts and supports manual retry.
Full checks: 2,851 units, 375 browser cases, one intentional duplicate skipped;
build passes after a type-only event-listener correction. Next: synchronous
frame-time exceptions/pool allocation, then lifecycle/resource-growth/platform
checks. Native parity and P5 release gates remain open.


P5 frame recovery update: synchronous gel/molecular draw exceptions now enter
bounded renderer recovery without stopping the shared application frame loop.
Mesh and whole-gel frame transactions release new buffers/textures on failure;
failed renderers are retired, not reused. Six new browser regressions cover both
view recovery and frame allocation cleanup. Full checks: 2,851 units, 381 browser
cases, one intentional duplicate skipped; production build/type checks pass.
Controlled native visual/workflow comparison and lifecycle/resource-growth/
platform/performance checks remain required; full parity and release gates stay open.


P0/P3 reference update: isolated native framebuffer PNG export is repeatable for
startup. A user-provided lossless native window capture corroborates horizontal
well strokes. Corrected the web's CSS-pixel well width to native physical-pixel
width; two pixel regressions pass, full browser suite 383 passed/one intentional
skip, build/type checks pass. Vertical/corner raster differences, original-build
equivalence and broader native visual/workflow comparisons remain open.


P3 timeline raster update: native lossless captures show two half-covered Retina
rows where CSS produced two fully covered rows. SVG track lines now match these
native samples. Final-product full browser run passed 381 plus one skip; the four
obsolete div-based track checks passed after selector/assertion updates, with two
pixel regressions rerun (six targeted passes). Build passes. Native complete-scene
and composed-workflow gates remain open.


P5 static-host update: actual production artifacts now pass strict root/subpath
Chromium smoke tests on WebGPU/WebGL2. Fixed native image requests escaping the
app base, including DPR fallback. New `test:production` command verifies images,
contexts, native file roundtrip and malformed-file preservation. Full fresh checks:
2,853 units, 385 development browser cases (one intentional skip), four production
cases, build/type checks passed. Remaining platform/font/deep-route/lifecycle/
performance and full native parity gates are still open.


P5 engine probe: added separate `test:compatibility` for the built app on pinned
Playwright Firefox/WebKit. WebKit18.2/WebGL2 passes root/subpath workflows. Firefox132
fails at browser launch (profile sandbox/framebuffer errors), including with `/tmp`
profiles; failures remain visible and bounded to 15 seconds. macOS27.0.1 / M5Max.
Shipping Safari/current Firefox and full platform gates remain open. Product source
and established Chromium production gate are unchanged.


P5 DPR update: sample/loupe backing buffers now follow live display-scale changes
without replacing simulation views. Both renderers pass fixed-CSS-size 1×/2×/1×
transitions with visible particles and preserved objects/nodes. Full checks: 387
browser cases, one intentional skip; four production cases, build/type checks
pass. Physical multi-monitor and broader lifecycle certification remain open.
Pinned Firefox launch also fails headed; environment limitation remains explicit.


P5 multi-view lifecycle evidence: ten measured sample/two-loupe open-close cycles
per backend return tracked resource objects to their warmed gel baseline. Same-
document route unmount reaches zero owned objects and gel remount restores a live
sample. Two new real-browser checks pass; no product code changed. Long-run heap/
driver memory, pending asynchronous setup/unmount and hidden-tab resume remain
separate open requirements. Native parity and platform gates remain open.


P5 pending-setup evidence: held mesh-module responses complete safely after gel/
sample route exit on both renderers. Retired contexts are released and the late
continuations allocate no graphics resources or contexts for detached canvases.
Route return initializes new resources and a live sample. Two tests pass without
product changes. Adapter/device-phase cancellation, hidden resume and remaining
performance/platform/native parity gates still require evidence.


P5 suspension probe remains open: `test:suspension` requires real hidden/frozen
state, stopped frames, resume, retained views, visible particles and unchanged
native JSON. Current runner stays visible even after headed minimization; both
cases fail the visibility precondition. No product workaround or weakened
assertion was introduced. Resolve the runner/manual workflow before claiming
hidden-tab resume coverage; the passing regression suite is unchanged.


P5 application performance baseline: built app with 50 bands, sample and three
sparse loupes measured on M5Max/macOS27.0.1/Chromium131 at DPR2. Two ten-second
steady windows and verified 60-move timeline drag show p95 rAF intervals16.7–16.8ms
and unchanged tracked object counts in this run. Raw reports/fixture provenance
are under reference/web/performance; `test:performance` reproduces the workload.
Both cases/build pass. Dense/longer workloads, driver memory, GPU/presentation
timing and matching native measurements remain open; no release budget is claimed.

### Startup band raster gate narrowed

The lossless modern native startup now has exact web matches for its full
390×520 offscreen RGB gel texture and DPR-2 displayed band crop, on both
WebGPU and WebGL2. Native linear RGBA8 storage and linear enlargement replace
web sRGB intermediate storage and pixelated canvas enlargement. Independent
native regression fixtures failed before their respective fixes and pass after.
Full browser suite: 395 passed, one intentional duplicate skipped; built-app
root/subpath: 4 passed with fresh build/type checks. No web goldens changed.
See [capture and scope](../reference/native/modern/lossless-probe/offscreen/README.md).
This closes the measured startup-band discrepancy, not other gel states,
DPRs, wells, typography, loupes or full native workflow certification.

### Broader gel effects: concrete remaining raster failures

The [sixteen-scene matrix](../reference/native/modern/raster-scenes/README.md)
now exercises plain, blur, smile, damage, smear, flame, water and combined
rendering at ppu 1 and 2. Corrected output-sized blur uniforms, native flame
randomness/float arithmetic, and source-over primitive blending. Native
blur-2/flames-1/flames-2 RGB outputs match exactly on both backends. New
regressions cover those corrected cases; full regression/production checks pass.
The full diagnostic remains red for water/combined effects and WebGPU-only
half-pixel edge cases. Investigate those failures next; do not infer complete
gel-render parity from the startup or corrected effect cases.

### Water sampling corrected; half-pixel WebGPU edges remain

Native intermediate exports prove matching pre-warp RGB and displacement values.
Corrected the missing Cinder Surface upload flip in the web warp shader sampling.
The complete sixteen-scene comparison is now exact on WebGL2 and exact for
11 scenes on WebGPU. The five remaining WebGPU ppu-1 failures all involve the
half-pixel rectangle edge and its downstream effects. These remain an explicit
completion gate, alongside broader scene/seed/GUI coverage. See the
[water investigation](../reference/native/modern/raster-scenes/water-debug/README.md).

### WebGPU half-pixel edge cases resolved for the reference matrix

Mirrored primitive rasterization followed by an exact texel flip now reproduces
native horizontal edge inclusion. All sixteen effect references pass with zero
RGB differences on both backends, and the full matrix is included in normal
regressions. No tolerances or goldens changed. The additional WebGPU pass reuses
existing textures; performance is measured separately. This closes the five
recorded matrix failures, not broader geometry/seed/DPR/GUI certification.
Additional clipping/both-edge references remain pending native window access.

### Sample interchange expanded; native empty collections restored

Pinned native Sample/Buffer JSON code now runs independently of GUI capture.
Native-generated empty and mixed DNA/dye samples pass web import/edit/save;
both renderer exports are accepted by the native reader with unchanged fields
preserved. Fixed rejected native null collections and absent/null Samples.
Reader numeric quantization is recorded explicitly. This narrows the sample
interchange gap; full Gel constructor/GUI/XML and broader edit sequences remain
open. See [interop evidence](../reference/native/files/interop/README.md).

### Legacy XML constructor evidence

Four native XML constructor exports now cover supported fields, defaults,
ignored children, empty samples and hexadecimal colors. Restored native `0x`
color prefixes/case/whitespace. Browser tests retain explicit unsafe-index
rejection and show no external-DTD request for the tested declaration. Native
aggregate memory corruption is not emulated; partial-token numeric coercions,
XML writer round trips and broader parser/GUI behavior remain open. See the
[XML scope and boundaries](../reference/native/files/interop/xml/README.md).

### Complete startup gel and UI-only render invalidation

The complete default gel rectangle at 1365×768/DPR2 now matches the user's
native PNG exactly on both effects-mode backends, including wells and bands
in one comparison. [Retained captures and scope](../reference/web/startup-gel/README.md).
Fixed redundant scientific rendering during hover/selection/panel/loupe-only
changes; actual timeline and lane edits retain verified redraws. Fresh gates:
2,872 units, 481 browser cases plus one intentional skip, four production cases.
This closes the bounded startup-composition discrepancy and redraw regression,
not full P0–P5 gates, direct-band raster, controls/text/particle/loupe scenes,
composed native GUI acceptance or the outstanding platform/release requirements.

### Render-off multisample composition corrected

A 56-case native CGL matrix based on unchanged native drawBands meshes exposed
and corrected fractional-edge raster differences in both web backends. Direct
bands now share the wells' four-sample surface rather than passing through a
single-sample texture. All 56 RGB cases match per backend at DPR1/2, including
crossing wells, clipping, gradients and overlap. Full checks: 2,872 units, 489
browser cases plus one intentional skip, four production cases. See
[reference scope](../reference/native/modern/direct-band-scenes/README.md).
Full original-release GUI, other hardware/scales, remaining app scenes and
P0–P5 completion gates remain open.

### Native imported-dye background corrected

Independent unchanged C++ getDyes/drawBackground captures exposed imported-mass
clamping and last-entry-wins duplicate handling in the molecular canvas. Both
are corrected with exact native float32 arithmetic. Thirty-six numeric cases
and six real-browser import/highlight/save scenarios pass, with native CGL RGB
checks. Full gates: 2,908 units, 495 browser cases plus one intentional skip,
four production cases. [Reference and limits](../reference/native/numerical/background/README.md).
Remaining dye control color/default-entry discrepancies are recorded in STATUS;
particle-edge raster and full P0–P5 acceptance remain open.


### Native dye control colors and creation defaults corrected

Dye sliders now use native display-domain colors. Newly created dye entries
retain native Fragment/Aggregate defaults, including first writes at zero mass.
Source-derived regression checks cover slider colors and saved file fields;
complete control raster certification remains open. Next investigate molecular
renderer terminal-failure cleanup and native particle raster differences.
Validation: 2,909 unit tests, 499 browser tests with one intentional skip,
and four production checks passed. No existing image baseline or tolerance changed.


### Molecular failure cleanup corrected

SampleSimCanvas now releases owned resources and retires canvas configurations
immediately when recovery reaches a failure, including terminal errors on the
second backend. Initialization and frame-failure browser tests check cleanup
before retry, saved sample preservation, and complete release after route exit.
Next prioritize native particle raster comparison; full composed-view failure
and release-platform certification remain open.
Validation: 2,909 unit tests, 503 browser cases with one intentional skip,
and four production checks passed. Native particle raster and complete-app
acceptance remain unproven.


### Particle raster reference established; implementation gap measured

A reproducible 128-image native CGL reference and dedicated exact-pixel audit
now identify a single-sample particle raster mismatch on both web backends.
57/64 scenes fail at each DPR, while captured native and web-generated meshes
produce identical browser pixels. The four acceptance tests remain failing.
[Evidence and implementation sequence](../reference/web/particle-scenes/README.md):
add native MSAA4/source-over/resolve, verify generated meshes, integrate opaque
sample/loupe and transparent representative paths, then verify lifecycle and
composed native GUI behavior. Full P0–P5 gates remain open.


### Opaque particle MSAA correction implemented

The previous particle audit is green: 512 native/generated-mesh comparisons now
match exact native RGB. The shared sample/loupe canvas uses native MSAA4 and
source-over; gel defaults remain unchanged. Four component checks exercise this
integration at DPR1/2 on both backends, and all eight tests now join the normal
suite. Transparent representative compositing, full original GUI comparison and
release performance remain open. See the particle reference README for evidence
and the two justified degraded-snapshot updates.
Final gates for this increment: 2,909 units, 511 browser cases (one intentional
skip), and four production checks passed. Full P0–P5 exit gates remain open.


### Representative compositor strategy refined by measurement

The actual transparent representative component fails 16/18 native well/panel
color comparisons per backend/DPR (maximum channel error 102). A temporary MSAA
prototype reduces error to 1 but does not pass exact parity; it was reverted.
The [reference and audit](../reference/web/representative-scenes/README.md)
now direct implementation toward one native-style well/representative surface
with a coverage cutout, rather than another transparent RGBA8 composition step.
Capture rounded well geometry and boundary-crossing particles before integrating;
preserve heading/child ordering and verify overflow explicitly. This audit changes
no production behavior and does not close the representative or full UI gate.


### Shared fragment composition implemented

Legacy Cinder rounded geometry and native boundary-crossing particle captures
now support a shared well/representative surface. All 60 component RGB comparisons
pass on both backends at DPR1/2. A separate coverage pass preserves untouched
transparency and tiny-fade coverage, verified by a failed-then-passing contrasting
background test. The four component tests are part of the normal suite.

Validation: 2,909 unit tests, 515 browser cases (one intentional duplicate skip),
and four production checks passed. Native references and regression goldens were
not changed. Full panel draw order/overflow, original GUI replay, platform and
performance gates remain next; this increment does not close P0–P5. See the
[fragment composition review](superpowers/reports/2026-10-10-fragment-composition.md)
for the deferred unused cutout/separate-well-lines API limitation.


### Fragment window overflow and heading order restored

The preview no longer clips representatives to 303×520. It expands to a bounded
window surface and translates its logical origin; later particle motion reuses
that extent. The heading follows the representative. Four browser checks verify
visible overflow, heading glyphs, bounded/stable backing sizes, live DPR changes,
workspace scroll size and an exact native well crop after origin changes.
An Important review finding about scroll overflow was reproduced and fixed.

Final checks: 2,909 units, 519 browser cases (one intentional skip), and four
production cases passed. Next resolve translucent representative composition over
earlier non-white braces/views; white-underlay captures alone cannot certify
that interaction. Original GUI replay and the other P0–P5 gates remain open.


### Inspector transparency and brace order restored

Source-backed panel backgrounds and brace ordering are corrected: earlier images
show through empty inspector space, and an opaque representative covers the brace
as native drawing requires. Six new failed-then-passing browser cases cover these
behaviors; the full suite passes 525 browser cases (one intentional skip), 2,909
units and four production checks. No native or screenshot baseline changed.

Translucent overlap still requires further compositor work; correcting DOM order
and panel transparency does not establish native RGB over arbitrary earlier
content. Full native GUI, platform/performance and P0–P5 acceptance remain open.


### Shared presentation mesh operations verified

Task 1's mesh portion now supports ordered affine transforms, independent blend
state and physical scissoring, including reset before legacy wells. All 20
constructed native mesh comparisons and the earlier 32-comparison shared-surface proof match exact
RGB. Fresh gates: 2,913 units, 529 browser cases (one intentional skip), four
production checks and build passed. Continue Task 1 with texture operations and
sampling references before app view migration; no full milestone closes here.


### Shared presentation texture operations implemented

Ordered mesh/texture scenes now preserve draw order, sampling, alpha convention,
transforms, tint and clipping on both backends. Twenty constructed native texture
comparisons match exact RGB, supplementing the mesh and shared-edge references.
Native UI icons opt into mipmaps; native heading textures use straight alpha.
Actual asset decode/mip generation and glyph raster still require their own
reference evidence. The next integration boundary is the post-React-commit frame
phase and real sample/fragment contributions. Production separate-canvas edge
failures and all full milestone acceptance gates remain open.

Verification of the ordered API increment: 2,913 units, 537 normal browser cases
(one intentional duplicate skipped), four built-app checks and build pass.
The shared32 proof remains exact. Task 1 is ready for app integration; final
whole-branch review remains after the view/control migration.

### Shared app migration started, production unchanged

The development registry now receives real sample and fragment contributions
after each React commit. FragmentWell passes12 exact native edge comparisons;
frame tests preserve molecular state/RNG and catch pre-commit drawing. Position,
DPR/resize, fresh-canvas fallback and late-import retirement have focused coverage.
Task2 still needs a real sample/fragment native overlap reference, full SampleView
first-commit measurement, device/context-loss and bounded-allocation checks.
Mixed overlaps with the old gel/DOM paint remain visibly incorrect; Tasks3–4
must migrate those layers before production can use the shared surface.


### Shared sample/fragment integration gates verified

The full SampleView first-open gap is fixed with layout-phase measurement.
Twenty native overlap comparisons now cover both body contributions, reverse
order and fractional clipping. Repeated graphics loss, resize, allocation failure,
retry and late device acquisition preserve engine identity and retire tracked
resources. Next migrate gel/loupe/image graphics, then ordered chrome/text/frame
paint. Production shared composition, original GUI and P0–P5 acceptance remain open.

Shared-composition Task2 regression gates pass: 2,916 units, 559 browser cases
(one intentional duplicate skipped), four production checks and build. Final
whole-branch review remains after Task4. Continue Task3; the production switch
must remain off until complete overlapping view and control paint is migrated.


### Shared production validation

The complete paint migration and native full-window overlap fixtures now permit
the local production build to use shared composition by default. Production
storage cannot re-enable separate canvases; diagnostic development fixtures retain
the old mode. Fresh verification passes2,924 units,955 browser tests with one
intentional skip, and16 built-production tests with216 exact native RGB comparisons.
An independent cutover source review found no Critical or Important issues.
Retained compiled-component and full-window evidence, including source/build
hashes, is in [shared production](../reference/web/shared-production/README.md).

The clean broad run followed an invalidated run where Vite reloaded pages after
test-file edits. All seven failures clear without product or assertion changes.
WebKit passes both shared root/subpath deployment cases; Firefox remains blocked
at browser launch. Combined workload now passes both backends with16.7–16.8ms steady p95 frame
intervals and flat tracked resource counts. Built hidden-tab resume, shipping Safari,
original-release/toolchain equivalence and the full P0–P5 contracts remain open.
Enabling the renderer locally is not release or deployment approval.


### Built hidden/frozen recovery verified

The compiled shared app passes two hidden/frozen/resumed cycles per Chromium
backend. Real visibility and lifecycle events, stopped/resumed callbacks, retained
view identities, visible interior particles, changing resumed sample paint and
unchanged saved JSON are asserted. Playwright's originating CDP session enabled
focus emulation; disabling it on that session fixes the test precondition without
product changes. Build and both lifecycle cases pass; source review found no
Critical or Important issue. See [evidence](../reference/web/shared-resume/README.md).
OS sleep/long suspension, physical-monitor transitions, resident-memory stress,
shipping Safari/Firefox and the complete parity contracts remain open.


### Firefox deployment and shipping Safari workflow evidence

The repository compatibility command now passes all four Firefox132/WebKit
root/subpath cases; an isolated Playwright1.64 runner also passes both on
Firefox157. Firefox launch failure was resolved by providing a test-specific
macOS app-data root, consistent with the upstream profile-location issue. No
user-profile or security setting changed. Source review found no Critical or
Important issue. [Logs and scope](../reference/web/compatibility/shared-isolated/README.md).

Shipping Safari27.0.1 was exercised through native UI: startup/sample/species,
color edits, H2O, Render toggling and native JSON import/save all worked. Shawn
approved local downloads; downloaded JSON exactly equals the imported native
fixture. Remote automation remains disabled. [Evidence](../reference/web/safari-shipping-ui/README.md).
Broader browser interactions, lifecycle, backend/console instrumentation in
shipping Safari, native cross-engine pixel equivalence and full P0–P5 gates remain.


### Compiled browser workflows expanded

Species/color editing, H2O/TBE concentration changes, persistent loupe frame/anchor/
wedge dragging with all three mouse buttons, Render pixel change/restoration,
resize and Delete now pass in the actual compiled subpath app. Both pinned and
newer Firefox/WebKit runners pass all 10 compatibility cases. Chromium production
passes22 cases with216 exact native RGB comparisons unchanged. No product change.
[Evidence and limits](../reference/web/compatibility/compiled-workflows/README.md).
Broader histories, shipping-browser lifecycle, monitor/resource checks, native
performance comparison/release budget and full parity acceptance remain open.


### Compiled repeated view disposal and resize verified

The compiled app passes100 measured sample/two-loupe open/close and resize cycles
per backend. Tracked resources return exactly to baseline after every cycle
(WebGPU66, WebGL2 37 including samplers), and to zero on route exit. Remount
starts the sample successfully with no page errors. Forced-GC heap growth slows
after warm-up; this is observational evidence, not a resident-memory budget.
Both cases pass; independent review found no Critical or Important issue.
No product code changed. [Reports and scope](../reference/web/performance/shared-view-churn/README.md).
Native performance comparison/release budgets, long-duration and driver-memory
stress, physical-monitor transitions and final parity acceptance remain open.


### Native combined-workload baseline captured

Two pinned compatibility-native runs now measure the same50-band, ordinary sample
and three-loupe workload as the compiled web suite on M5 Max/macOS27.0.1. Both
native runs and both web backend cases complete with matching particle populations.
Web steady interval p95 is16.7–16.8ms; native draw-completion p95 is18.6–24.6ms.
Timing boundaries differ, so this is not a CPU/GPU speed ratio. Web resources
remain stable at236 GPU/51 GL objects (GL samplers now included).
[Comparison, raw data and limitations](../reference/web/performance/native-comparison/README.md).
The native probe's initial vector-index setup bug was corrected using lane/species
identity; distinct-view and anchor guards pass. Product runtime is unchanged.
Native interaction/resource-growth comparison and a measured release threshold
remain open, along with the other full parity acceptance requirements.


### Measured performance regression gate added

`npm --prefix ts run test:performance:budget` now checks the compiled50-band/sample/
three-loupe workload on the recorded M5 Max/macOS27.0.1 profile. Both backends pass:
p95 interval≤26ms, p99≤34ms, steady callback p95≤4ms, zero tracked resource growth,
and all four populated molecular views at every checkpoint.18 validator tests
pass, including four missing/empty-view cases that reproduced a review finding
before its fix. No product runtime changed.

Two final native runs complete the60-event timeline gesture, verify time0.1→1,
retain the views and keep Cinder texture/buffer/program/VAO/FBO counts stable.
Native gesture p95 intervals are17.1–17.8ms; timing boundaries differ from web rAF.
[Budget, rationale and evidence](../reference/web/performance/release-budget/README.md).
One preliminary native run lost a view; diagnostics and three subsequent runs
passed without an app behavior change, so its cause remains unresolved rather
than declared fixed. The bounded performance gate is implemented; unattended
native capture reliability, driver-memory/physical-monitor validation and full
parity acceptance remain open.
