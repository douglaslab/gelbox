# Gelbox web port — current status

_Last reviewed: 2026-10-09 · implementation baseline `2f3021d` · native reference `5f51097`._

## Direction

Shawn confirmed: **strict native behavior and visual parity first; improvements afterward. Finish the web app first; reconsider Rust/native only for a concrete need.**

The replacement strategy is in [ROADMAP.md](ROADMAP.md). The source-backed gap inventory is in [PORT-AUDIT.md](PORT-AUDIT.md). The old M1–M27 plan is historical, not the current completion contract.

## What exists

A working TypeScript/React application under `ts/`, with pure gel simulation, WebGPU and WebGL2 gel renderers, three-panel editing UI, live molecular simulation, and synthetic-sample loupes. Historical implementation milestones reached M26a in June 2026. This is substantial reusable work, but native parity is not complete or independently certified.

- Renderer/simulation: mobility, diffusion, smears, aggregation, dyes, well damage, mesh particles, and global-warp implementations exist. The main gel canvas now wires running-buffer global warp into both renderers; native numerical and raster certification remains open.
- UI: sample/species/gel panels, many sliders, band resize/clone, tube move/clone, and cross-panel selection/hover exist. Missing native workflows and deliberate/accidental behavioral differences remain.
- Molecular view: live engine, multimer clusters, slice meshes, dye backgrounds, and selection outlines are implemented. Degradation wholeness ranges/filtering still diverge from native.
- Loupes: live synthetic content and multiple fixed popups exist. Native dragging, callout geometry, hover preview, source-selection ancestry, and full positioning behavior remain incomplete.
- Files: native Gelbox JSON import/export now exists, preserving sample metadata and scientific fields. Legacy web formats remain readable. A native → web codec → native ladder roundtrip preserved every JSON field. Open/Save commands are mounted in a bottom-left popup; native XML palette import and targeted sample drops are implemented. Native shell geometry is implemented; render/hover settings and broader interchange coverage remain open.

## Verification actually run

On macOS with Node 22 during the 2026-10-09 review, before these documentation changes:

| Check | Result |
|---|---|
| `npm run typecheck` | Passed |
| `npm run build` | Passed |
| `npm run test:unit` | 35 files; 285 passed |
| `npm run test:visual -- --project=chromium-webgl2 --workers=2` | 52 passed; 1 skipped |
| `npm run test:visual -- --project=chromium-webgpu --workers=2` | 52 passed; 1 skipped |

The skipped test is narrow-screen reflow. These are implementation/regression tests, **not native differential tests**. The official native Gelbox 1.0 release now runs through Rosetta on this Mac. Six exploratory native screenshots and one native-exported gel document are recorded in [the reference manifest](../reference/native/manifest.json). All 96 bundled assets match the pinned source checkout. The binary’s exact source revision remains unverified; these captures are not yet certified pixel goldens. Xcode is selected locally; the sibling `cinder_0.9.0_mac` dependency expected for rebuilding is absent.

## Forward roadmap

P0 reference work and P1 application/file compatibility are underway. Selected source-backed P2 layout and P3 rendering-integration fixes have landed; their full parity gates remain open.

| Increment | Deliverable | Current status |
|---|---|---|
| P0 | Runnable native reference, captures, effective configuration, parity ledger | In progress |
| P1 | Native application shell and compatible file/edit/save workflow | In progress: native files and shell |
| P2 | Native editing, identity/selection, panel and control behavior | In progress: control defaults and species editing; identity migration remains open |
| P3 | Independently verified numerical and rendering fidelity | 259 pinned C++ band cases verified within recorded tolerances; full numerical/raster gates remain open |
| P4 | Complete native loupes and reference images | Planned |
| P5 | Browser reliability, production-build verification, parity release | Planned |

Continue P0 provenance and scenario coverage alongside source-backed P1/P2 workflow work. See ROADMAP for dependencies and exit gates. The original strategy review changed documentation; subsequent implementation increments are recorded below.

## Historical records

The previous status narrative, including original milestone counts and now-stale assertions, is preserved in [archive/STATUS-pre-2026-10-09.md](archive/STATUS-pre-2026-10-09.md). Historical plans/specs remain under `superpowers/`; consult them for implementation rationale only. Their claims of complete phases, future Rust phases, placeholder molecular rendering, bloom, or image inference do not supersede the new roadmap.

## Current implementation checks

After the JSON codec changes: 36 unit files / 309 tests pass; typecheck and production build pass. Vite reports existing mixed static/dynamic import warnings. Native GUI Open and Save Gel verified semantic equality for the ladder roundtrip; this is one interchange scenario, not complete file-format certification.

File workflow increment: native JSON/Open/Save, XML palettes, malformed XML preservation, actual file chooser, empty-lane placement and startup selection availability are exercised in browser tests on both backends. Unsafe legacy XML multimer indices are rejected because native writes out of bounds; use JSON for these samples. This remains an explicit parity edge-case decision, not certified equivalence. When all visible lanes are occupied, the web app reports an error; native calls an unimplemented off-gel icon function.

Final file-workflow verification: 309 unit tests pass; 116 browser tests pass across both backends, with the two pre-existing narrow-reflow cases skipped; typecheck and build pass. The old drop test now verifies preserving lane 0 and placing the imported sample in lane 1.

## Native shell increment

The root now opens the gel directly; generic header/navigation/theme/footer remain only on engineering routes. Stage uses native fixed-size panels and resize offsets, includes the brace inside the inspector bounds, and places gel settings beside the gel. Sample selection closes gel settings. Empty lane icons and false startup highlighting are removed; well outlines are drawn and the CSS border no longer shrinks the gel canvas. System Avenir is used on macOS.

Current verification: **309 unit tests and 132 browser tests pass**, with no browser skips on this Mac; typecheck and build pass. Eight web-only particle/loupe snapshots were updated after inspecting pixel-alignment changes caused by replacing fractional centered positions with native integer positions. These are not native goldens. The startup capture and limitations are in [reference/web/shell.json](../reference/web/shell.json).

Narrow browsers expose fixed panels by scrolling instead of native clipping; this remains a recorded adaptation pending final acceptance. Timeline geometry, help, settings completeness, detailed typography, control semantics, selection identity and rendering fidelity remain open.

## Running-buffer rendering increment

The real gel canvas now receives native global effects: exact H2O composition enables faintness/overcook distortion, with native seed 1. Both async renderer initialization and subsequent scene updates receive the complete scene; selecting TBE clears the effects.

A new real-browser differential test compares the gel-settings workflow against an independently configured renderer using identical bands. It failed before the wiring fix on both backends, then passed for H2O and the return to TBE. This proves integration, not native raster equivalence. Current verification: **309 unit tests, 134 browser tests, and production build including TypeScript checks pass** on this Mac. No goldens changed in this increment. Native numerical/pixel certification remains open.

## Lane retention and settings selection

Reducing visible lanes now retains samples in hidden lanes, matching native Gel::setLayout. Increasing the count restores the same sample objects; native JSON export continues to include visible lanes only. Imports target visible empty lanes. Opening gel settings clears sample/species selection; closing it no longer revives old panels. Keyboard cycling cannot select a hidden retained sample or resurrect cleared selection.

Verification: **310 unit tests, 136 browser tests, and production build/TypeScript checks pass**, with no snapshot changes. The real-browser scenario opens a 12-lane native-format document populated in lane 12, reduces to 7, checks the downloaded file, restores to 20, and verifies exact restored sample data. Both backends pass. Native source proves storage/export behavior; this scenario has not yet been replayed successfully through native GUI automation, so native visual certification remains open.

## Native control defaults

Gel settings now contains lanes, well damage, voltage and disabled rotation in native order. The duplicate time control is removed because native defaults place time below the gel. Gel and sample concentration sliders are disabled while buffer presets remain active; custom imported compositions stay intact until a preset is chosen. Buffer heading, preset labels, separator and disabled coloring are restored. Disabled value labels remain readable at normal opacity.

Verification: **310 unit tests, 138 browser tests, production build/TypeScript checks pass**. Browser tests attempt track/icon edits on disabled controls and verify native JSON downloads preserve gel/sample concentrations. No regression goldens changed. A reviewed panel capture and remaining icon-size, heading-baseline and notch differences are recorded in [reference/web/controls.json](../reference/web/controls.json); this is not native visual certification.

## Native species editing

Empty tubes now create empty TBE samples. Opening a tube shows the sample alone; background clicks toggle Buffer + Dyes. The New species button and gel right-click create native-default species. Alt-clone appends with a new palette color; deletion swaps in the last fragment and repairs molecular particle ownership. Tab includes the native deselected step, Delete/Backspace removes the selected species, Escape closes the sample, and selecting a dye opens sample settings. Native palette channels are stored and displayed directly, including the selected gel outline.

Verification: **319 unit tests, 144 browser tests across both GPU backends, and production build/TypeScript checks pass** on Node 22. Browser workflows create, edit, clone, delete and download samples, checking exact saved fields and colors. Fresh review caught and resolved obsolete outline gamma conversion and deletion targeting an unrelated moved/cloned sample. Both regressions failed before their fixes. No screenshot baselines changed.

Native source at `5f51097` establishes these rules; a fresh native GUI replay could not be captured because the running reference app exposed no window. This increment is not native visual certification. Runtime RNG sequences, cross-loupe ancestry, sample identity across moves, complete band drag semantics and particle timing remain open. The keyboard deletion guard uses the visible shared selection; it does not complete the broader identity migration.

## Native tube drag behavior

Tube movement now updates continuously under pointer capture. The gesture removes its previous placement, places the retained sample only in empty tube slots, and removes it from the document when released outside the tube area or over an occupied slot. Occupied destinations remain intact; moving back into an empty slot before release restores the retained sample. Alt is captured at pointer-down and clones nested sample data independently. Tube pointer-down selects the source, repeated short clicks close its panel, and shared species selection follows native movement/clone rules.

Keyboard selection and edits made while holding a tube now survive later movement. Pointer cancellation or unexpected capture loss ends the gesture without allowing a later click to move the old sample. Fresh review exposed stale keyboard selection snapshots; failing-then-passing tests cover that fix, deletion during dragging, and lost pointer capture.

Verification: **328 unit tests, 154 browser tests across WebGPU/WebGL2, and production build/TypeScript checks pass**. Browser cases verify continuous movement, leave/re-enter, occupied drops, mouse-down Alt, short-click closing, actual saved documents, mid-drag edits and capture loss. No screenshot baselines changed. Native source `5f51097` is the behavioral reference; exact lane-dependent native tube geometry (the web still uses a 50px row), full stable identity/loupe ancestry, and native GUI replay remain open parity requirements.

## Native tube geometry

Tube wells, backgrounds, icons and hit rectangles now use the native lane-dependent formulas. Icon fitting preserves the 47×89 asset ratio and rounds only its upper-left corner. The former fixed 50px row and 36px icon height are removed; 20-lane hit areas shrink with the displayed tubes, including the native gaps and extension down to the gel top.

Verification: **330 unit tests, 156 browser tests across both GPU backends, and production build/TypeScript checks pass**. Fresh review found no actionable regressions. The geometry test checks explicit 7/20-lane coordinates and pointer hits. Reviewed WebGL2 captures at native client dimensions are recorded in [reference/web/tubes.json](../reference/web/tubes.json). No regression goldens changed. These are source-backed geometry checks and web captures, not a native pixel-parity certificate. Off-row drag imagery, cross-loupe identity, independent numerical outputs and broader visual certification remain open.

## Native startup document

The startup ladder now preserves the recorded native sample's raw RGB floats, `[1]` monomer weights, name, icon, icon scale and native ID. Its generator reads the recorded native startup export rather than recreating an obsolete synthetic ladder. A provenance sidecar records the source and generated-file hash; regeneration is byte-stable.

Verification: **331 unit tests, 158 browser tests, and production build/TypeScript checks pass**. New unit and real-browser startup Save Gel comparisons failed before the correction and now match every field of the independent native document. Fresh review corroborated the fields against pinned XML/native constructors. Six inspected web particle snapshots were updated: correcting raw colors changes fills, and changing `[]` to native `[1]` consumes an RNG draw and changes particle placement. Gel-band calculations are unchanged. These are web regression baselines, not native raster certification; exact executable/source correspondence and broader numerical/visual gates remain open.

## Independent native band reference

A reproducible C++ executable now compiles unmodified `GelSim.cpp` and headers from native `5f51097`, with the pinned effective tuning. The build extracts Git objects into scratch storage and leaves sibling checkout edits untouched. Recorded provenance covers source, tuning, Cinder revision/library, compiler, harness, case inputs, executable and outputs. Two executions must produce identical output. See [the numerical reference](../reference/native/numerical/README.md) for reproduction and coverage.

The differential suite contains **259 native cases**, including all startup species, buffers, voltage/time/degradation combinations, parameter extremes, aggregate distributions, dyes, well damage and fractional integer-boundary regressions. It exposed and corrected web rounding instead of native truncation for blur/degraded BP, plus an extra clamp on negative native smear. Native float32 evaluation is preserved at degradation/diffusion integer boundaries. Seed bits, band count, blur and aggregate tiers compare exactly; documented small float tolerances apply to other fields.

Verification: **595 unit tests, 158 browser tests, and production build/TypeScript checks pass**. Fresh review found fractional discontinuities and seed-comparator/provenance gaps, all addressed with failed-then-passing regressions and recorded hashes. No regression snapshots changed. This is independent pinned-model evidence, not the full P0/P3 gate: the harness uses modern Cinder rather than original 0.9.0; prebuilt library/source correspondence is not independently certified. Native binary/raster equivalence, reverse solver, particle numerics, additional UI metadata comparison and broader boundary coverage remain open.

## Native inverse solver and band drag anchor

The web now uses the native integer-pixel inverse search, including its step reversal, quarter-step reduction, iteration budget and missing-aggregate fallback. Band dragging retains the mouse-down pointer offset and chosen multimer tier. Alt cloning starts from the first slowest band, including equal-position ties; Shift restores the starting base count. Both creation and dragging supply the actual sample buffer.

The C++ reference now extracts `GelView::solveBasePairForY` verbatim behind a minimal well-bounds adapter and pinned Config defaults. Its **504 cases contain 2,849 exact solver comparisons**, including 244 inputs constructed near pixel boundaries. Review exposed 80 boundary mismatches caused by double-precision intermediate mobility/geometry, and a wrong-tier Alt clone when band tops tie. Both reproduced before correction and pass now. Shared simulation arithmetic now preserves native float32 operations through band positioning, keeping drag and render calculations consistent.

Verification: **1,344 unit tests, 166 browser tests across WebGPU/WebGL2, and production build/TypeScript checks pass**. Reference regeneration is deterministic, repeated native runs agree, and provenance hashes are verified. No screenshot baselines changed. JavaScript power rounded to float32 is validated over this finite matrix, not proven equivalent to platform `powf` for every input. The modern-Cinder/shipped-binary limitations remain. Cross-lane band transfer, dye merge, native hit priority, identity/loupe behavior, particle numerics and native visual certification are still open; this increment does not complete the app or the parity gates.

## Native cross-lane band transfers

Band movement now uses one reducer command for vertical solving and lane transfer. It appends to occupied destinations, swap-deletes from the source, and follows native well-width lane interiors with gutters. New destinations use TBE; leaving a sample created by this gesture removes that temporary sample, while existing empty samples remain. Shift locks native starting Band bases and still permits horizontal movement. Dyes support movement and Alt cloning without inverse-solving; release merges duplicates in original order, preserves the first dye's metadata, accumulates mass as float32 and caps it at125.

Pointer capture, cancellation and unexpected capture loss end the gesture while retaining its current document placement. Same-lane motion preserves selection changed by Tab during dragging; crossing lanes selects the moved species. The latter rule was identified by fresh review and verified with a failed-then-passing regression. Expired pointer capture falls back to window event listeners, preserving existing synthetic-event tests as well as actual pointer workflows.

Verification: **1,355 unit tests, 176 browser tests across both GPU backends, and production build/TypeScript checks pass**. New browser workflows check continuous transfers, temporary cleanup, gutters, Shift, dye merging, Alt cloning, cancellation and saved native JSON. Pure tests also cover unshifted multimer offset/tier solving against a pinned C++ result, three-species swap deletion, fractional dye masses and native Shift dye bases. No screenshot baselines changed. These transitions are backed by `5f51097` source; fresh native GUI replay, overlap hit priority, stable identity/loupe ancestry and full visual certification remain open requirements.

## Native band hit geometry and overlap priority

Band hover and pointer-down now use gel coordinates and native hit priority, independent of SVG stacking order. The band with the smallest UI-rectangle height wins; the first band wins equal-height ties. The overlay and loupe extraction share one hit-rectangle function. It expands by nonnegative smear and blur, then adds the flame extent, correcting the former maximum-of-smear-and-flame approximation.

The independent C++ matrix now has **505 cases**, including an overloaded H2O band with simultaneous smear and flames. Every native UI rectangle is compared with the shared web geometry using the documented spatial tolerance; the matrix also supplies2,859 exact solver comparisons. Browser cases reproduced incorrect overlap hover/selection before the fix, then passed while verifying which species was moved and saved. Legacy originless synthetic clicks were replaced by real clicks; the tied-multimer drag expectation now uses native picking, and a multiple-loupe workflow clicks an exposed second band instead of a point covered by the first loupe.

Verification: **1,864 unit tests, 180 browser tests across both GPU backends, production build and TypeScript checks pass**. Fresh independent review found no blocking picking issues; an obsolete comment was corrected. No screenshot baselines changed. Native GUI replay and whole-scene visual certification remain open, as do loupe extraction/gestures/ancestry, broader identity migration and release gates.

## Native synthetic loupe samples

The C++ reference now extracts `GelView::makeSampleFromGelPos`, `pickBands` and the degradation-filter declaration verbatim. Its adapter supplies native source samples/context and probes body centers/edges, smears, lateral halos and misses. **26 scenarios / 206 probe points** compare synthetic fragments, TBE output buffers and exact filter entries. The overall matrix is now **508 cases / 2,894 exact inverse-solver requests**.

This exposed and corrected horizontal smear bounds, native smear normalization/body-edge behavior, selected aggregate tier and source-buffer context for inverse solving, retained aggregate-vector lengths (including monomer `[1]`), and native default TBE synthetic buffers. Degradation filters preserve native source-index keys and repeated-source overwrites rather than silently substituting synthetic output indices. A float32 threshold regression at degradation `0.50000001` failed before correcting the comparison to native precision.

Verification: **1,899 unit tests, 180 browser tests across both GPU backends, and production build/TypeScript checks pass**. Fresh review verified extracted-method/adapter semantics and found no further blocking issues. Two inspected loupe regression images changed after restoring native aggregate weights, which alter particle sampling and the resulting positions/species distribution; other images are unchanged. These remain web regression baselines, not native visual certification.

Limits are explicit in the numerical-reference README: the adapter probes one source fragment's bands at a time; cross-source overlap and origin object identity remain unverified. Halo arithmetic still has documented double-versus-float tolerances. Molecular particle wholeness/filter semantics, complete loupe gestures/ancestry and native raster comparison remain required work.


## Native molecular fragment setup

The independent C++ reference now extracts native molecular setup functions, fragment fields and effective tuning verbatim. The web uses the runtime population exponent of 1, float32 radius/aspect arithmetic with native extrapolation, separate degradation endpoints, first-maximum aggregate demodulation with integer division, native filter interpolation and the minimum-radius floor. The former approximate filter/wholeness behavior is removed.

The initial differential run reproduced **494 failing cases**. All **509 native cases** now pass, including **155 explicit filtered requests** and **206 synthetic loupe probes**. The overall reference contains **2,909 exact solver requests**. Capture runs agree byte-for-byte and all recorded harness/input/output hashes verify. Fresh independent review found no blocking issues; its coverage suggestion added a degraded `[2,2,1]` aggregate case. Deliberately changing first-maximum tie selection to last-maximum makes that regression fail.

Verification: **2,411 unit tests, 180 browser tests across WebGPU/WebGL2, production build and TypeScript checks pass**. Eight inspected web regression images changed after restoring linear mass-to-population tuning: fewer particles alter positions and the species hit by the fixed-coordinate selection test. Both backends retain visible selection outlines and dye tint. These images are web regression baselines, not native visual certification.

This increment validates fragment setup, not the complete molecular simulator. Particle lifecycle/RNG/motion/mesh fidelity, complete loupe gestures and origin identity, native GUI replay and raster comparison remain required. The pinned-source/modern-Cinder reference limitations still apply.


## Native molecular timing and initialization

Particle ticks now take the native boolean bullet-time flag. Hovering or holding the sample view slows age and motion to `0.1 × timeScale`; fade-in/out stays at normal speed. Held-pointer slowdown survives leaving the canvas and ends on release/cancel, including release outside the view. Preroll preserves native conversion of `timeScale` to the boolean tick argument.

Ordinary sample panels now open with native particle fade-in. The former double preroll on open and preroll after each edit are removed; `GelView::updateSampleView` explicitly disables native sample preroll. Loupe content updates reset particle state and the current seeded engine, then preroll 100 ticks, matching the reset/initialization sequence in `updateGelDetailViewContent`. Exact native RNG and loupe seed derivation remain open; this change does not certify their sequences.

Two timing unit regressions and the real-browser initialization workflow failed before correction. Fresh review found held-pointer leave and loupe refresh gaps; each reproduced before its fix. Browser tests now cover initial empty sample state, hover/leave, press-drag outside/release, edit without preroll, and cleared particles before loupe refresh preroll. The capture-loss regression now processes a pointer move to activate pending browser capture before releasing it, so it tests loss of active capture reliably.

Verification: **2,413 unit tests, 182 browser tests across WebGPU/WebGL2, production build and TypeScript checks pass**. Eight inspected particle regression images changed because the engine no longer runs extra initialization ticks and native preroll uses slower motion; both backends retain selection outlines and dye tint. These are web regression baselines, not native visual certification. Full RNG/spawning/culling/motion arithmetic, frame cadence across displays, loupe gestures/identity, rendering and native GUI comparison remain required work.


## Native GUI reference recovery and sample styling

The official release is interactive again after restarting its retained app handle. New sample/species captures and provenance are in [reference/native/replay](../reference/native/replay/manifest.json). The native sample background and thick selected-particle outlines expose two web divergences: an extra sRGB-to-linear conversion darkened framebuffer clears, and a prior styling approximation reduced native 4px radius inflation to 1.5px. Both are corrected. The 2D clear fallback now consumes the same raw RGB values; full particle rendering without a GPU remains an open requirement.

An isolated modern Cinder build was also compiled and its 165 source/build/asset inputs hashed. [The reproduction script](../reference/native/modern/README.md) reconstructs those exact inputs from pinned Git objects plus recorded compatibility changes; a second fresh reconstruction/build passed. Neither sibling checkout was modified. Modern GLFW reads physical cursor position during click callbacks, so background CUA clicks reached the same coordinate regardless of requested location. That build is retained only as a startup reference, with its compatibility changes and prebuilt-library prerequisite documented. Temporary diagnostic instrumentation was removed, input hashes checked, and the clean executable rebuilt and recaptured.

Verification: **2,414 unit tests, 184 browser tests across WebGPU/WebGL2, production build and TypeScript checks pass**. New tests failed before restoring the outline constant and background output. Pixel checks cover idle/hover/pressed backgrounds and assert the requested GPU context; deliberately forcing fallback makes that guard fail. Fresh review found no production correctness issues and prompted the GPU guard and explicit Cinder-library limitation. Eight inspected web snapshots were refreshed for the brighter backgrounds and thicker outlines. The existing broad screenshot threshold had accepted the background discrepancy; the new pixel assertions now catch it directly.

Original-release captures remain exploratory: particle time/RNG is not frozen, cursor/focus overlays are present, and exact executable/source equivalence is unverified. The modern build includes altered clipping/hull/JSON compatibility code and cannot substitute for release certification. Native particle sequences, complete loupe behavior/identity, panel details and the broader visual/release gates remain open.


## Native seeded particle lifecycle

The independent native harness now also extracts particle fields, spawning, weighted aggregates, bounds, preroll and tick methods verbatim. Its 33 scenarios record every particle field and ordering across direct spawns, mass changes, normal/slow motion, density, bounds, degradation, multimers and dyes. Each capture agrees byte-for-byte across two native runs. Another 33 comparisons check 700 integer and float RNG draws per scenario exactly, including the MT19937 twist boundary. Recorded harness/input/output hashes verify.

The initial lifecycle comparison failed 28 of 31 scenarios. The web now reproduces Cinder's random stream and consumption order, global angular-velocity draws, integer ages, shared degradation key, multimer parent selection, unit-vector jitter, float32 interpolation/motion, truncated aggregate targets and short-circuit culling. All 66 new comparisons pass. An existing timing test now compares displacements near the origin to avoid cancellation after native float32 coordinate rounding; its precision assertion is unchanged.

Verification: **2,480 unit tests, 184 browser tests across WebGPU/WebGL2, production build and TypeScript checks pass**. Eight changed particle images were inspected and refreshed; both backends retain corresponding layouts, outlines and dye backgrounds. These remain web regression snapshots, not native visual certification.

The reference explicitly initializes dynamic/population/global seeds and bypasses native constructor/`setRand` application integration. Cross-view seed/identity lifecycle, null/deletion transitions, picking, mesh geometry, cadence and controlled native raster comparisons remain open. The finite modern-Cinder/macOS matrix does not certify the original executable or every standard-library float mapping. Undefined native aggregate inputs are excluded and documented rather than used to manufacture an oracle.

Fresh review found fractional translated bounds rounded too late, producing 20 particles where native produces 19. New constructor/setBounds reference cases both failed before normalizing endpoints to native float32 storage, then passed. No other blocking findings or deferred minors remain for this increment. The exclusions above stay open roadmap requirements.


## Native particle picking

The independent harness now extracts native particle picking and transform functions. Five controlled scenes, each alone and overlapped by a dead zero-fade particle, provide **40,410 exact native hit results**. Three multimer scenes failed before correction. The web now rotates multimer offsets, applies minimum pick radii before spacing, and preserves native picking's larger spacing without the drawing overlap factor. Picking retains native reverse order, faded/dead eligibility and full-ellipse targets for degraded particles.

Verification: **2,490 unit tests, 184 browser tests across WebGPU/WebGL2, production build and TypeScript checks pass**. Existing browser screenshots pass unchanged. Native capture repeats byte-for-byte. The finite matrix does not certify every floating-point boundary. Particle mesh geometry and native raster comparison remain required separate work.

Fresh picking review exposed boundary differences from replacing the native matrix inverse with an inverse-rotation/division shortcut. Added 14,400 boundary probes reproduced failures in four scenes. The web now preserves float32 matrix cofactors, determinant, translation and matrix-vector multiplication, including rounding of the Z diagonal in GLM rotation. All 40,410 discrete probes pass. No deferred minors were reported. Mesh/native raster certification remains open.


## Native particle mesh geometry

A third independent executable now captures native particle mesh methods with original Cinder 0.9.0 polygon clipping and its pinned Boost dependency. Reproduction records source hashes, two isolated enum compatibility declarations, compile flags and the modern-Cinder/ARM64 limitation. No sibling checkout was modified.

The initial comparison failed 40/48 cases. The web now constructs the native polygon, clips using legacy integer-rescaled ratios, calculates its centroid and applies sequential float32 transforms. The unsupported minimum slice floor and projected-edge approximation are removed. Native zero-width clipping returning a full fill ellipse is deliberately preserved.

Fresh review found NaN vertices for tiny positive wholeness. Sixteen added threshold cases exposed twelve failures; correcting clipping touches, closed rings and captured fused centroid arithmetic makes all **64 native mesh cases** pass. The tests constrain area, centroid, bounds, colors/pass ordering and sampled triangle coverage, while allowing equivalent triangulation. These finite modern-toolchain comparisons do not certify all thresholds or the original binary's raster output.

New real-app degraded-particle screenshots exercise both GPU backends and assert that the requested context exists and colored particles are actually drawn. Both inspected PNGs contain 2,346 colored pixels; an apparently blank tool preview was a display artifact, not a WebGL rendering failure. Existing screenshots remain unchanged. No deferred review minors remain.

Verification: **2,554 unit tests, 186 browser tests across WebGPU/WebGL2, production build and TypeScript checks pass**. Final native double capture and all recorded harness/input/output hashes verify.


## Loupe source selection and inspector focus

Synthetic fragments now expose a parallel, nonserialized source-reference array. Each emitted origin is checked against the existing native loupe captures. Picking and hovering a loupe particle resolves to its original species; gel, ordinary sample and all synthetic fragments with the same origin share highlights. Native rollover-before-selection precedence drives the inspector for the already-open sample. Selecting another source does not open or switch sample panels. Closing a loupe conditionally clears its last rollover without clearing a different newer source.

Fresh review found two integration gaps: deleting a selected species lost the sample reference needed to restart Tab cycling, and empty loupe clicks failed to deselect the source. Two unit and two browser regressions failed before correction. Deletion now retains the native same-sample/no-species selection, and loupe background clicks clear source selection while preserving panel context. Gel-background clearing also leaves a closed sample panel closed.

Verification: **2,562 unit tests, 188 browser tests across WebGPU/WebGL2, production build and TypeScript checks pass**. The two inspected loupe regression images now include the shared yellow source highlight. These are web regression images, not native visual certification. No deferred review minors remain.

Stable document IDs, off-document sample retention, complete loupe frames/gestures/keyboard focus and constructor/seed integration remain required. Blank synthetic-loupe selection is currently represented by no shared source selection; its distinct synthetic view identity belongs to that remaining lifecycle work. Native per-tick versus web per-pointer rollover updates and controlled native raster comparisons were outside this increment's review and remain open. The original app and isolated native rebuild described above are available for the remaining visual replay work.


## Native loupe seed derivation and refresh

Loupe particle refresh now uses native float gel coordinates and gel time rather than floored coordinates alone. `MolecularSim::setRand` semantics are restored: the dynamic stream starts unconsumed, while the population stream uses the first integer draw as its seed. Refresh clears and reseeds the existing engine before applying content and preroll.

The independent harness extracts the pinned seed expression and inline native `setRand`. Sixteen new scenarios cover repeated refresh, changed position/time and low-mass population dithering, bringing the particle matrix to 54 scenarios. Another 1,280 seed probes exercise integer truncation boundaries. All eight initial refresh scenarios failed before the change. Fresh review exposed missing fractional-population coverage; reverting the population seed deliberately made seven of the eight added low-mass cases fail. Restoring native semantics passes all cases. Native double capture is byte-identical and all recorded harness/fixture hashes verify.

Verification: **2,594 unit tests, 188 browser tests across WebGPU/WebGL2, production build and TypeScript checks pass**. Two loupe snapshots were inspected and refreshed for the new particle positions; their backend PNGs are byte-identical. No other browser baselines changed. Review found no production correctness defects or deferred minors after closing the coverage gap.

Application-wide constructor/global RNG initialization, interleaved view scheduling, ordinary sample identity, full loupe gestures and native raster equivalence remain required. The finite modern-Cinder capture excludes undefined/out-of-range seed conversions and does not certify every platform's arithmetic. These web snapshots remain regression checks, not native visual certification.


## Persistent loupe frames, gestures and focus

Persistent loupes now store frame and anchor in gel-local coordinates, start one frame width to the right of the sampled point, and follow gel movement during resize/scroll. The native convex-hull callout and anchor replace the rounded fixed popup. Body dragging moves only the frame, anchor dragging changes the sampled point, and wedge dragging moves both. Cmd/Ctrl creation also works on empty gel and starts combined dragging. The non-native close button is removed; focused loupes close with Delete, Backspace or Escape and retain native Tab ownership.

Frame movement preserves anchor and synthetic-content identity. Raising an older loupe changes its stacking order without moving its DOM node, preserving pointer capture. Release, cancellation and lost/pending capture end gestures. Fresh review found that an anchor inside its own frame lost native picking priority; both backend regressions failed before coordinate-based anchor priority was restored, preserving preceding particle selection. Stale test descriptions were also corrected; no deferred review minors remain.

Native `openGelDetailView` pauses the particle simulation before preroll. The web now does the same. Four new native capture scenarios bring the particle matrix to 58. Real browser tests without the freeze hook compare frames across 45 animation callbacks; restoring timeScale one deliberately fails both backends. All harness/fixture provenance hashes verify.

Verification: **2,606 unit tests, 200 browser tests across WebGPU/WebGL2, production build and TypeScript checks pass**. Coverage includes all three gestures, creation drag, empty-gel creation, frame/anchor overlap, keyboard ownership, resize, cancellation, raising an older view and paused rendering. Loupe-only backend images are byte-identical; two full-page captures were inspected as web regression evidence. Fresh native GUI capture was unavailable because CUA reported `cgWindowNotFound`; existing source and compiled reference evidence remain available, but no fresh native screenshot parity is claimed.

**Rendering defect discovered in this increment:** the full-page captures showed opposite band curvature between WebGPU and WebGL2. Existing per-backend goldens accepted this divergence. The subsequent warp-orientation increment below resolves the coordinate mismatch; complete native rendering parity remains open.

Hover-preview lifetime/shortcut, stable and off-document source identity, application-wide RNG initialization and interleaving, broader rendering parity and release gates remain required. Rotation remains native-disabled; general transformed-layout support was outside this increment's review.


## Native warp coordinate orientation

The shared smile control now preserves native negative Y displacement. WebGPU converts both native control-texture row lookup and vertical displacement at its shader boundary. WebGL blur/composite passes and all five current final-output consumers now consistently sample framebuffer textures with native top-at-UV-one coordinates. Previously, compensating flips hid plain-image inversion while global water distortion operated on an inverted intermediate.

New direct GPU readback tests compare ten scenes: plain, smile, well damage, water distortion and combined effects at two asymmetric vertical positions. They require real WebGPU and WebGL2 contexts, matching occupied columns, comparable brightness centroids in matching sRGB targets, absolute plain-band placement and independently specified upward smile edges. The initial readback failed with a six-pixel plain-band mismatch; the native smile-sign unit regression also failed before correction. The test runs once across both backends, with its duplicate project invocation intentionally skipped.

Verification: **2,606 unit tests, 201 browser tests (one intentional duplicate skip), production build and TypeScript checks pass**. Three changed regression images were inspected and refreshed: both multi-band images and the WebGL2 full-page loupe image. The existing native startup capture also shows upward-curving band edges, consistent with pinned source. This is orientation evidence, not fresh native pixel certification.

Fresh read-only review found no critical or important defects. Its minor inaccurate gamma-independence comment was corrected, the test formatting expanded, and the targeted GPU readback rerun passed. Review explicitly declined native CPU arithmetic/byte quantization, well-damage RNG, control-texture resolution, native raster identity and broader renderer lifecycle/platform behavior; those remain required follow-up.

**Remaining native warp differences:** web well damage uses mulberry32 instead of Cinder Rand; control bytes use rounding rather than native uint8 truncation; one-dimensional controls use logical gel width instead of native output pixel width; JavaScript double arithmetic differs from native float32 storage/evaluation. Capture these native CPU fields independently and restore their semantics before certifying native distortion rendering. Backend agreement alone does not establish native parity.

## Native CPU warp fields

A separate C++ harness now extracts native control generation verbatim and captures actual Cinder Surface bytes without a GUI context. Its 137 cases cover disabled and underflow effects, fractional geometry/resolution, smile exponents, signed seeds, stab-count boundaries, high damage and 2D water fields. Both native capture runs are byte-identical; source, harness, tuning, input, output, executable and toolchain provenance is recorded and verified.

The web now uses Cinder Rand for well damage, native float evaluation/storage, uint8 truncation, and output-pixel resolution for all control fields. Both renderers truncate float output dimensions as native does and pass pixel density to the one-dimensional builders. Native's nominal zero displacement encodes to byte 127, including its small resulting bias; this is preserved. Overcook preserves native float arithmetic and promotion at M_PI before sinf.

The initial 92-case differential test failed 76 cases; all 137 now match exact dimensions, scales and every byte. Two float-underflow cases separately failed before the disabled-effect guards were corrected. New real-backend integration tests verify allocated output dimensions and the actual uploaded control bytes against native captures. Restoring the previous renderer wiring deliberately fails both backends (89×49 instead of native 88×48).

Verification: **2,743 unit tests, 203 browser tests (one intentional duplicate skip), production build and TypeScript checks pass**. Existing web regression snapshots pass unchanged. The finite modern-Cinder/ARM64 matrix does not certify every transcendental boundary, other platform random mappings, GPU sampling, blur/compositing or original-release pixels. Native raster replay and broader release gates remain open. Fresh read-only review found no critical, important or minor findings. The reviewer independently verified source, extraction, tuning, harness, fixture and executable hashes and reproduced the committed capture exactly. Original-release pixels, exhaustive arithmetic/platform boundaries, GPU sampling/blur/compositing and broader application/release gates were explicitly outside this review and remain required work.

## Temporary hover loupes

Hover previews now activate with Meta or the shared “Loupe on hover” application setting/Meta-L toggle. They follow the gel pointer, use paused synthetic samples and shared source highlights, show the native callout without the persistent anchor ring, and leave keyboard focus unchanged. Entering the preview frame or another view closes the preview; its wedge does not intercept the pointer. Persistent creation closes the transient view and retains the existing persistent drag/focus behavior.

A separate event controller preserves native refresh ordering: ordinary mouse-down clears rollover while retaining the last preview until a gel/key/move refresh; mouse-up restores rollover after drag edits. Browser regressions exposed premature refresh from selection-only ctx copies, then premature reopen when React flushed drag edits after pointer-up. Both cases failed on both backends before correction. A transient document revision closes previews on document replacement, while preserving the application toggle; sample edits refresh existing content. Blur and cancellation clear transient ownership.

Verification: **2,748 unit tests, 215 browser tests (one intentional duplicate skip), production build and TypeScript checks pass**. New hover regression images were inspected and are byte-identical across the two backends; prior baselines remain unchanged. Tests cover key-only activation/release, toggle/checkbox synchronization, blank gel, following/exit/frame hits, focus, paused particles, sample import/document replacement, persistent creation, drag timing and cancellation. These are source-backed behavior and web regression checks, not native screenshot certification.

Native opening/closing interpolation, application-wide RNG scheduling, stable/off-document identity, complete menu layout and native raster replay remain required. Browser-chrome interception of Meta-L requires manual platform certification; the native checkbox is available independently. Fresh review pending.
