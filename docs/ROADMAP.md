# Gelbox web parity roadmap

_2026-10-09 · Replacement roadmap · Product direction confirmed; native reference collection underway._

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
