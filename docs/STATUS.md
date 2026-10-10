# Gelbox web port — current status

_Consolidated: 2026-10-09 · implementation through application runtime integration · native reference `5f51097`._

## Direction

Shawn confirmed: **strict native behavior and visual parity first; improvements afterward. Finish the web app first; reconsider Rust/native only for a concrete need.**

The completion contract is [ROADMAP.md](ROADMAP.md). [PORT-AUDIT.md](PORT-AUDIT.md) records the initial audit; some findings have since been resolved by the increments below. The old M1–M27 plan is historical.

## Big picture

The TypeScript/React app is substantially implemented, with working WebGPU and WebGL2 renderers. Targeted restoration remains the strategy: the current evidence does not justify another rewrite or a Rust migration. Completion still requires meaningful feature and shared-state work, followed by native visual certification and production reliability checks. It is not merely a polish pass.

Implemented and checked areas include native JSON/XML file workflows and metadata, startup defaults, hidden-lane retention, sample/species controls, tube and band movement/cloning, reverse solving, picking, buffer effects, molecular lifecycle/meshes, persistent loupe gestures and source selection, temporary hover loupes, and reference-image views. Independent compiled native captures now cover 509 band/setup cases, 2,909 solver requests, particle/loupe behavior and meshes, and 137 exact-byte CPU warp cases. These are finite source-backed comparisons, not certification of the original executable's complete output.

## Latest recorded verification

On macOS with Node 22: these checks include the application runtime integration. Fresh independent review is complete; its Important pointer-ownership finding is fixed.

| Check | Result |
|---|---|
| Unit suite | 2,844 passed |
| Browser suite across WebGPU/WebGL2 | 271 passed; one intentional duplicate invocation skipped |
| Production build and TypeScript checks | Passed |

These results combine regression coverage and independent native differential checks. Web screenshot baselines and cross-backend agreement do not establish native pixel parity. Native release captures, a modern isolated rebuild dossier, and reproducible C++ harnesses exist; reliable fresh native GUI replay and original-executable/toolchain equivalence remain limitations. Detailed evidence and qualifications appear in the incremental records below.

## Remaining completion work

The [composed native runtime reference](../reference/native/runtime/README.md) covers sixteen sequences and eight contracts for constructors, local/global random draws, species generation, loupe preroll, ordered ticks and collection lifetimes. The matching TypeScript runtime is now connected to the live app through a synchronous command store and one application frame driver. Canvases draw existing engines; GPU readiness and React effect replay do not own simulation. Native species generation, intermediate tube/loupe notifications, inspector timing and right-pointer creation/drag are implemented. Twelve store tests and eight new browser checks supplement the reference tests. The review fix is verified; these scripted references and browser checks do not certify full native GUI history or raster parity.

1. **Cross-view certification and shared runtime.** Sample identity, off-document references, raw fragment indices and frame selection-following are now implemented and regression-tested. Complete composed native GUI replay of selection/focus/panel transitions, and extend verification of application-wide RNG initialization and view scheduling beyond the captured command sequences.
2. **Remaining native features and controls.** Reference-image views are now implemented with source-backed gestures and shared ordering; native image decoding/raster and composed GUI certification remain. The Render-off alternate band scene is now implemented; native raster certification remains. Complete settings/help/menu geometry, shortcuts, focus and remaining interaction details, with composed native replay of the restored right-click creation/drag sequence.
3. **Native visual certification.** Capture controlled matching native/web scenes for gel effects, blur/compositing, particles, loupes, selection and complete application layout. Resolve typography, asset proportions, resize/DPR behavior and justified raster tolerances. Decide cross-platform font handling and any browser layout adaptations explicitly.
4. **Composed workflow verification.** Expand native → web edit/save → native roundtrips and replay move/clone/delete with loupes open, hidden-lane restoration, degraded multimer dragging, and buffer changes with resizing/failures. Resolve recorded XML safety and unsupported native import edge cases explicitly.
5. **Browser lifecycle reliability.** Verify adapter failure and fallback, device/context loss, async unmount/disposal, route remount, resize/DPR, hidden-tab resume and repeated multi-view creation/removal. Provide a clear failure when no supported renderer works. Certify shortcuts that browser chrome may intercept.
6. **Production and release validation.** Serve built artifacts at root and subpath; check assets, fonts, routing, files and errors. Establish actual Safari/Firefox compatibility after macOS Chromium certification on both renderers. Measure combined-app responsiveness and resource growth on named hardware. Resolve every parity-ledger row and complete Shawn's side-by-side/workflow review.

## Roadmap state

| Increment | Current status |
|---|---|
| P0 — Native reference | Strong numerical/source evidence; full GUI replay and visual reference coverage remain open |
| P1 — Application and files | Core files and shell implemented; complete controls and composed interchange gate remain open |
| P2 — Editing and UI | Interaction paths and sample identity restored; complete focus/panel replay remains open |
| P3 — Numerical and rendering fidelity | Extensive independent comparisons pass; integrated RNG scheduling is tested; full native raster gate remains open |
| P4 — Loupes and images | Persistent/hover loupes and reference images implemented; native composed GUI/raster certification remains open |
| P5 — Reliability and release | Production/platform/performance certification remains open |

All six full exit gates remain open; that does not mean their implemented parts are untested. Next sequence: remaining native features and the recorded highlight timing correction, controlled visual/workflow replay, then production/platform release checks. Continue reference work alongside implementation. No evidence-based percentage or calendar completion estimate is available yet; visual replay and platform checks may expose additional defects.

Rust/WASM/native packaging, redesign/mobile composition, undo/autosave, scientific-model improvements and cloud features remain outside this parity release.

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

A separate event controller preserves native refresh ordering: ordinary mouse-down clears rollover while retaining the last preview until a gel/key/move refresh; mouse-up restores rollover after drag edits. Browser regressions exposed premature refresh from selection-only ctx copies, then premature reopen when React flushed drag edits after pointer-up. Both cases failed on both backends before correction. A transient document revision remounts the preview against a replacement document and immediately reevaluates eligibility, while preserving the application toggle; sample edits refresh existing content. Blur and cancellation clear transient ownership.

Verification: **2,749 unit tests, 219 browser tests (one intentional duplicate skip), production build and TypeScript checks pass**. New hover regression images were inspected and are byte-identical across the two backends; prior baselines remain unchanged. Tests cover key-only activation/release, toggle/checkbox synchronization, blank gel, following/exit/frame hits, focus, paused particles, sample import/document replacement, persistent creation, drag timing and cancellation. These are source-backed behavior and web regression checks, not native screenshot certification.

Pinned SampleView::tick has interpolation commented out: it applies the target frame directly, then removes closing views on the next tick. No animated interpolation is required by this native reference. Application-wide RNG scheduling, stable/off-document identity, complete menu layout and native raster replay remain required. Browser-chrome interception of Meta-L requires manual platform certification; the native checkbox is available independently. Fresh review found two important lifecycle defects: source-mutating mouse-down had cleared rollover too early, and document replacement failed to recreate an eligible preview. One unit regression and six browser regressions failed before correction. The fix preserves pre-clear rollover for the discrete mouse-down update, including Alt-clone and right-create, and remounts/recreates previews on replacement. All checks above passed after the single fix pass. No deferred review minors remain. Native event/render-boundary timing, identity, RNG scheduling, native pixels, browser shortcut interception and full menu geometry were outside the review and remain required certification/work.

## Native identity reference

A standard-library C++ harness now compiles pinned native SampleFragRef methods
and sample clone/remove operations. Its 28 repeat-identical observations verify
pointer identity, invalid raw indices, swap-delete/reappend behavior, one-hop and
root ancestry, and real shared ownership after document removal. Source,
extraction, compiler and artifact provenance plus an independent Python contract
are recorded in the numerical reference. Both contract checks pass; a wrong
deleted-slot result is rejected even with a matching updated fixture hash.

This confirms that the next web migration must preserve sample identity without
inventing stable species identity. The existing reducer remaps external indices
on deletion and uses lane-based references; tube cloning can also reopen the
source panel when native selection remains on the source but the visible panel
follows the clone. These remain implementation gaps, not fixes delivered by the
reference capture. The harness does not certify native GUI event ordering,
dye compaction, RNG or pixels. No app code changed in this increment, so the
2,749-unit/219-browser result above remains the latest app run, not a new run.

Fresh read-only review found no actionable defects and independently reproduced
the 28 observations, exact fixture bytes, source/extraction hashes and both
Python checks. The reviewed boundary remains reference infrastructure: web
identity migration, GUI ordering/focus/deletion, dye compaction, cyclic ancestry,
RNG, raster parity and original-executable behavior are not certified by it.


## Sample identity and native frame selection

Shared selection and rollover now retain actual sample references with transient
identity across immutable edits. A WeakMap holds only identity tokens; references
own the needed snapshots, including samples removed from the document. Edits
refresh those snapshots without mutating historical state; imports, replacement
documents and sample copies create new identities even with equal serialized IDs.
No identity fields enter native files. Synthetic loupe content captures source
sample references, so lane reuse cannot retarget its selection or cleanup.

External fragment indices now follow native swap-delete and dye-compaction
rules: they are not remapped or cleared merely because invalid, and later append
can revalidate them. Keyboard deletion deselects first. Tab preserves native
raw-index stepping, including invalid indices and empty samples. The legacy
selectedFragmentIndex field is a projection of the authoritative reference into
the visible panel, and tube gestures no longer keep separate selection snapshots.

**Correction to the earlier identity-reference entry:** native mouseDragSample
briefly opens the clone's panel, but GelView::tick subsequently follows the
shared original sample selection back to its panel. The web now reproduces this
pointer-event/frame distinction. The same tick can reopen a closed panel while
its sample reference remains selected, even with native index -1. Full document
replacement clears references. Hidden-lane lookup follows native visible-lane
limits, while an already-open matching hidden sample remains open.

The first frame-loop implementation exposed a React scheduling race: idle
updates caused mouse-down edits to be replayed after their hover-refresh window.
Traces confirmed a second clone/edit commit without a new pointer event. The
frame handler now avoids idle dispatches and commits real panel changes before
paint. The failing Alt-clone scenario then passed 24 repeated runs across both
backends; temporary instrumentation was removed.

Verification: **2,763 unit tests, 227 browser tests (one intentional duplicate
skip), production build and TypeScript checks pass**. Fourteen identity unit cases
cover edits/history, moves, clones, off-document ownership, stale cleanup,
replacement, raw deletion/compaction indices, hidden lanes and Tab. New browser
workflows exercise removal followed by lane reuse, clone independence and frame
focus, close/reopen/replacement, and loupe selection opening its source panel.
Restoring the old off-document clearing deliberately fails both backend browser
tests. Existing screenshot baselines pass unchanged. Fresh independent review
found no introduced defects. It identified an older hidden-lane Tab restriction:
native permits cycling in an already-open sample after its lane becomes hidden.
The review fix removes that visibility restriction and uses panel sample ownership;
two regressions failed before the correction and pass afterward. The full suites
and build above were rerun after this fix.

Review scope decisions: retained loupe callbacks use sample references; ordinary
synchronous editing commands still target lanes because no delayed retargeting
path was found. Adding asynchronous commands will require revisiting that boundary.
General nested/cyclic ancestry is not demonstrated by the current gel-to-loupe
UI paths and remains outside this increment's evidence. Native GUI timing, shared
RNG, raster and release checks remain required work. No minor review findings
were deferred.

This increment restores the tested shared-reference paths; it does not certify
original-native GUI frame timing or complete focus ownership, general cyclic
ancestry, application-wide RNG/interleaving, original-native raster output or
production release gates. Those remain explicit follow-up requirements.

## Native reference-image interaction evidence

A new compiled reference extracts five unchanged native ImageView methods and
uses the pinned Cinder rectangle/vector implementation. **24 scenarios pass**
explicit expected-value contracts, with identical output from two executions.
Coverage includes drag/reentry, resize-handle boundaries, clamp-before-aspect
minimum sizes, both limiting resize axes, native-size snap boundaries, all four
window-edge contact/removal pairs, Delete/Backspace and Escape. Altering a resize
result while updating its digest is still rejected by the expectation test.
Provenance and reproduction are in `reference/native/numerical/README.md`.

Source inspection also establishes image/loupe ordering, fixed root coordinates,
retention across gel replacement and exclusion from gel saves. Native accepts
lowercase .jpg/.png/.gif through drops; its Open picker filters JSON/XML. These
are implementation contracts, not new web features: the image UI remains missing.
The adapter capture does not run native GUI dispatch, image decoding or drawing;
modern-toolchain and prebuilt Cinder library qualifications remain. Fresh
independent review found two important test-sensitivity gaps, now corrected:
source/extraction metadata drift is rejected, and new snap cases reject both a
per-axis metric and an inclusive threshold. Temporary mutated builds fail the
observation tests; the unchanged extracted native methods pass. No deferred
minor findings. Native GUI dispatch/stacking, decoder behavior, rendering and web
resource lifecycle remain outside this capture and required for implementation
and final certification.


## Reference-image views

The app now accepts native `.jpg`, `.png`, `.gif` drops, including multiple files
in arrival order. Images retain natural size and center on the drop point. They
move and resize with the native 16px handle, clamp-before-aspect fitting, strict
Euclidean natural-size snap, root-window positioning, focus outline and
Delete/Backspace behavior. Escape preserves the image; mouse-up removes only
fully off-window frames. Lost capture ends the gesture.

Images, loupes and dynamic panels use one view-order context. Image focus does
not raise it; loupe pointer-down does. Sample/gel-settings panels insert above
the gel, sample settings above the sample, and new fragment/app-settings views
append. DOM nodes stay in creation order to preserve pointer capture. The app
settings button now sits exactly 16px from the window bottom: removing its old
stacking wrapper exposed an inline-baseline gap of seven pixels. Pinned native
Layout/GelboxApp and an explicit browser rectangle assertion support this fix;
two inspected persistent-loupe web baselines were updated for that button only.

A separate disposable image store owns ImageBitmaps, retaining images across gel
replacement and excluding them from gel/sample files. GIF decoding is static:
Cinder 0.9.0 selects image index zero, while the browser ImageBitmap contract uses
the default/first frame. Bitmap deletion/unmount and late asynchronous completion
are tested. Malformed image files preserve existing content and do not stop later
files in a batch. Mixed gel/sample batches recompute placement from each newly
loaded lane layout instead of retaining an obsolete drop target.

The 24 pure geometry replays match compiled native outputs. Resource and ordering
unit contracts, real-browser PNG/JPG/GIF inputs, hit testing across overlapping
views, keyboard ownership, replacement/save equality, decode ordering, capture
loss and bitmap cleanup cover application integration. **2,792 units, 245 browser
tests (one intentional duplicate skip), production build and TypeScript checks
pass.** Independent review is pending. This does not certify original native image decoding,
orientation/color management, GPU mipmap sampling, native GUI event history,
original executable raster equivalence or all release platforms.


## Reference-image final review fixes

Open and Drop now share a disposable FIFO, so a held image decode followed by an older dropped gel cannot overwrite a subsequently opened document. Each import uses current application state when its turn executes; disposal invalidates queued and late work. Application-settings mouse controls retain the current native view's keyboard ownership, including image focus outline and Backspace deletion; clicking a sample transfers focus normally.

Both review findings reproduced in failing browser tests before the fixes. Verification: **2,794 units, 249 browser tests across WebGPU/WebGL2 (one intentional duplicate skip), and production build/TypeScript checks pass**. No additional screenshot baselines changed. The full run initially exposed a species-editing test helper that sent Escape after Save had already closed its menu; it now asserts menu closure without sending an unrelated sample-close command. No Minor review findings deferred. Original native image decoding/raster and broader composed focus certification remain open. Decisions and review boundaries are preserved in [the implementation plan](superpowers/plans/2026-10-09-reference-images.md).


## Native Render-off scene

The application now restores the native Render checkbox and global Cmd-R. Turning Render off draws additive band rectangles, blur halos, smears and flame gradients directly at display resolution, preserving native order and quirks (including upper smear reading lower-smear brightness). Wells, selection, editing and loupes retain their existing input layer. The mode survives document replacement and is omitted from saved files.

An unchanged compiled `GelView::drawBands` capture supplies14 independent mesh cases; all flattened TS vertex floats compare exactly. Source/extraction/Cinder geometry provenance is pinned, and two native executions are byte-identical. This is pre-raster evidence using the modern pinned toolchain, not original executable or native pixel certification.

Switching modes exposed and corrected effects-renderer async teardown and final-blit resource leaks. Deterministic browser tests hold module loading past unmount and count actual GPU/GL resource allocation/deletion. Direct canvas pixel probes check opaque additive color, overlap, gradients, blur and clearing at DPR1/2 on both backends; resize tests change display scale with viewport dimensions. CDP scale-only emulation emits no media/resize events; actual monitor-change certification remains open.

Verification: **2,809 units, 263 browser tests (one intentional duplicate skip), production build/TypeScript and native Python reference checks pass**. No goldens changed. `/tmp/gel-render-off-chromium-webgl2.png` inspected as a web scene capture. Independent final review completed; its Important context-lifetime finding was fixed and regression-tested. Implementation plan and boundaries: [Render-off](superpowers/plans/2026-10-09-render-off.md).


Render-off final review: repeated WebGL mode changes could retain retired canvas contexts and evict an open loupe under browser context pressure. Both canvas paths now explicitly release detached contexts after destroying resources; resize and StrictMode reuse retain connected contexts. A deterministic pre-fix regression held the retired context alive and failed; after correction, 50 mode changes retain loupe context/focus and byte-identical paused images on both backends. Final full results are 2,809 units, 263 browser tests plus one intentional skip, build/TypeScript and 2 native reference contracts passed. No goldens changed or Minor findings deferred. Physical monitor-only transitions, original native raster and general external context/device-loss recovery remain open release gates.


## Application runtime integration

`GelStore` now owns synchronous command effects, persistent local/global random
streams, cached loupe samples, view lifetimes and frame scheduling. React observes
stable snapshots; molecular canvases draw after the app tick. Native intermediate
tube notifications, creation-order loupe refresh, immediate selection versus
post-tick rollover inspectors, closing-loupe final ticks, native species generation
and right-pointer creation/drag are covered by store and browser regressions.
Repeated setting callbacks retain native refresh effects even when values match.

New browser regressions failed before wiring on both backends for generated species
values, GPU-gated ticks and missing right drag; all six now pass. Existing hover
regressions caught microtask cleanup preceding React target handlers; event-task
cleanup restores the native mouse-down refresh window. Full verification is
**2,844 unit tests, 271 browser tests plus one intentional duplicate skip, production
build/TypeScript checks and eight native runtime contracts passing**. Eight ordinary
molecular screenshots were inspected and updated for native seeds; the selected
snapshot now requires a successful particle hit. Loupe/layout baselines did not change.
Fresh read-only review identified held-gesture rollover ownership as Important; the fix passed the full suite. Native full GUI/raster and P5 reliability gates
remain open; delayed acquisition coverage is not general device-loss certification.


Runtime final review: molecular rollover previously remained active during a held
pointer gesture. Native ViewCollection clears that ownership and GelView clears
the shared rollover before sample ticks. A store probe and rendered-particle
browser test reproduced the defect; the store now suppresses held repicking and
mouse-up restores ownership by hit-testing the actual top canvas, including when
no subsequent move occurs. Final results above include the fix; no additional
goldens changed. The fresh review found no Critical issues.

**Open Minor finding, retained for the visual-parity pass:** frame drawing captures
React highlight props before the current tick's rollover update has committed.
This can delay a newly picked stationary-pointer highlight by one frame. Resolve
current store/source references at draw time or draw after the associated commit;
add a same-frame crossing regression. This is not accepted as final strict parity.

Review boundaries: full native GUI/raster equivalence, P5 reliability and the
unchanged nonparity 2D fallback remain required later gates. Zero random aspect/
multimer probabilities match the pinned native defaults; exposing other tuning
requires new reference coverage. Work stays in the isolated worktree; no merge,
push or publication was performed.
