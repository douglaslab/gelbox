# Gelbox web port — current status

_Latest verification: 2026-10-10 · shared production validation in progress · native reference `5f51097`._

## Direction

Shawn confirmed: **strict native behavior and visual parity first; improvements afterward. Finish the web app first; reconsider Rust/native only for a concrete need.**

The current requirement-by-requirement evidence and remaining work are in [PARITY-LEDGER.md](PARITY-LEDGER.md). The completion contract is [ROADMAP.md](ROADMAP.md). [PORT-AUDIT.md](PORT-AUDIT.md) records the initial audit; some findings have since been resolved by the increments below. The old M1–M27 plan is historical.

## Big picture

The native feature areas are substantially implemented, and the shared compositor is enabled in production builds on both WebGPU and WebGL2. Targeted restoration remains the strategy; the evidence does not justify another rewrite or a Rust migration. Completion now requires the specific paired workflows, reference decisions and platform checks in the current parity ledger. Passing isolated rendering or model comparisons does not close those gaps.

Implemented and checked areas include native JSON/XML file workflows and metadata, startup defaults, hidden-lane retention, sample/species controls, tube and band movement/cloning, reverse solving, picking, buffer effects, molecular lifecycle/meshes, persistent loupe gestures and source selection, temporary hover loupes, and reference-image views. Independent compiled native captures now cover 509 band/setup cases, 2,909 solver requests, particle/loupe behavior and meshes, and 137 exact-byte CPU warp cases. These are finite source-backed comparisons, not certification of the original executable's complete output.

## Latest image decoding fix

Native codec comparison exposed JPEG orientation differences in Chromium and
PNG orientation differences in WebKit. The decoder now strips EXIF orientation
metadata without changing encoded pixels or color profiles. All orientation
cases pass across Chromium, Firefox and WebKit. [Evidence and remaining codec boundaries](../reference/web/image-decoding/README.md)
records one-level JPEG rounding and WebKit transparent RGB differences explicitly.
Fresh gates: 2,986 units,44 production and14 compatibility cases. Website review
artifacts are unchanged; W06 is not fully closed.

## Latest integrated recovery check

Four compiled cases now pass buffer/loupe/selection → emulated resize/DPR →
graphics loss or terminal allocation failure → recovery. Both starting backends
retain document, selection and molecular-view identity; recovered gel pixels
match exactly and molecular paint resumes. [Evidence and limits](../reference/web/integrated-recovery/README.md).
No product code or website review artifact changed. The matching original-native
action trace and physical lifecycle checks remain open.

## Current acceptance status

Shawn's requested curvature changes are implemented: flat at zero, a linear
ramp to full strength over ten simulated minutes, and a frown at negative voltage.
[Current evidence](../reference/web/curvature-ramp/README.md): 2,958 unit tests and
38 compiled tests passed, including deployment at `/gelbox/app/`. The website
release work does not close the remaining parity acceptance items.

The legacy web import gap is fixed: nested scientific fields are validated before
replacement, saved inputs and hidden sample slots are retained, and obsolete layout
context is converted to native geometry. [Evidence](../reference/web/legacy-import/README.md)
covers valid conversion and malformed-file preservation on both compiled backends.
The remaining W01 priority is the paired original-native edit/save/reopen workflow.

A further W01 replay diagnosed the original stale buffer panel as an old-model
binding: preset clicks after load do not edit the loaded gel until settings is
reopened. The web now preserves the open settings panel on import; its existing
current-document binding remains an explicit pending exception (D04).
[Evidence and fresh checks](../reference/native/files/interop/gel/stale-buffer/README.md):
2,943 units and26 compiled cases passed after this panel-lifetime correction.

The [original-native → compiled edit/save → native reopen workflow](../reference/native/replay/file-workflow/README.md)
now preserves the mixed document, with only exact native float32 conversion of
the edited mass. Both backend exports are identical and reopen in web without
further changes. Four focused compiled cases cover that chain and queued mixed,
occupied and full-lane drops. Native composed drop replay and D01/D04 decisions
remain open; this does not close W01.

The ledger reconciles all37 original audit rows and preserves all five roadmap
high-risk workflows. Remaining packages are paired file/edit/save, shared-state
editing, hidden lanes, difficult band dragging, integrated recovery, native image
decoding, physical-display/lifecycle checks, memory/capture reliability, and final
side-by-side acceptance. It distinguishes verified bounded evidence from missing
native replay and decisions awaiting explicit acceptance.

Fresh checks after the legacy decoder change:2,943 units, a successful production
build,24 compiled Chromium cases (including216 exact native RGB comparisons), and
66 relevant file/image browser cases. Earlier evidence remains955 broad browser
passes/1 intentional duplicate skip;10 compatibility cases per Firefox/WebKit
runner;2 compiled hidden/frozen cases;100 view-churn cycles per backend;2 measured
performance-budget cases and18 budget validator tests. Those broader gates were
not rerun for this bounded decoder change.

The original-release writer's lane-loss defect, reference-build equivalence,
and font/platform distribution remain explicit decision records. The preliminary
native benchmark missing-view failure is preserved and remains unexplained.
See [the ledger](PARITY-LEDGER.md) for evidence links and stopping conditions.

## Historical shared-compositor integration notes

On macOS with Node 22, recent increments add complete Buffer, palette and application menu controls to the
Dye, Timeline, Gel and Species controls in development shared composition. Dynamic UIFont
metrics/placement match 2,048 independent native strings; 128 slider RGB
comparisons match native methods exactly. Actual controls pass image covering,
restoration, icon states and existing gesture checks in both rendering modes.
See [slider evidence](../reference/web/shared-slider-scenes/README.md) and
[font evidence](../reference/web/native-ui-text/README.md). The actual DyeRow
component now matches 24 native comparisons; bar width, labels, natural molecule
icons, endpoint actions and native "mM" display are restored. See
[Dye evidence](../reference/web/shared-dye-scenes/README.md). Buffer headings,
preset controls and disabled concentration rows now match 40 native comparisons;
real-app mouse-down timing, custom notches and unchanged stored values are checked.
See [Buffer evidence](../reference/web/shared-buffer-scenes/README.md). Palette
paint now matches 96 native comparisons; all twelve saved colors, drag/Delete
focus, secondary-button dragging and real-app image overlap pass. See
[palette evidence](../reference/web/shared-palette-scenes/README.md). Application
menu buttons, checkboxes, text and divider now match 48 native comparisons;
integer Retina dimensions, press preview, release-outside cancellation,
secondary-button/keyboard activation and image overlap are checked. See
[menu evidence](../reference/web/shared-menu-scenes/README.md). Gel selection and
hover paint now matches 88 native comparisons, clips to the gel and follows
shared view order in effects/direct modes. See
[focus evidence](../reference/web/shared-band-focus-scenes/README.md). Slider
tracks, handles, graph edits and endpoint icons now accept native right/middle
gestures, with release-outside and cancellation ownership checked. Gel background
presses select occupied lanes, clear fragment selection even at expanded outline
edges, and restore SampleView focus. Both modes/backends pass. Sample backgrounds and
persistent loupes now accept native secondary-button presses: settings toggles,
source-species selection/clearing, all three drag modes, cancellation, unchanged
particle paint after frame movement, resize and keyboard ownership pass. Gel/application settings, new-species and Help icons now activate on owned
release inside with every mouse button; release-outside, canceled capture,
keyboard activation and sample focus pass. Actual Help popup navigation remains
covered. Tube middle-button movement/cloning and Meta-loupe creation now follow
native branch precedence, including capture loss and keyboard focus. Independent whole-migration review found three issues, now fixed and independently
rechecked: locale-dependent labels could stop shared drawing, sample backgrounds
tinted over molecules, and buffer presets stole keyboard focus. French/Arabic
labels, draw-time particle hit changes and preset-to-Tab workflows now pass.
The complete startup client window now matches the native framebuffer with zero
RGB differences on both backends at 1365×768 / DPR2. The user screenshot agrees
after accounting for title bar and rounded window transparency; no application
pixels are excluded. See [full-window evidence](../reference/web/shared-gel-startup/README.md).
Full-window overlap acceptance is recorded below. The shared compositor is now
enabled in the local production build; acceptance of this switch remains pending
the fresh regression, review and reliability checks below.

Complete sample and species windows now also match all RGB channels on both
backends at 1365×768/DPR2. Tests import the captured native document and replay
capture-time particles; this proves controlled-state rendering, not RNG/history
parity. Native float32 label conversion and composed window projection are
restored. Original-release palette defaults are preserved despite modern Cinder's
one-step float conversion difference. Logical viewport changes now rebuild
projection even when the physical surface dimensions remain unchanged, with a
regression that fails when invalidation is removed. See
[populated capture evidence](../reference/native/modern/full-window-scenes/README.md).
Independent review found no Critical or Important issues in this increment.
The complete regression run passes 953 browser tests with one intentional duplicate
skipped; units, production build and four legacy deployment checks also pass.
See [retained web comparisons](../reference/web/shared-full-window-scenes/README.md).

A subsequent test-only increment verifies the complete gel-settings/application-menu
workflow: opening both panels, switching Render off, closing settings and reopening
the menu, then switching Render on. All five states match native exactly on both
backends (ten full-window comparisons in two passing tests). Twelve native capture
files repeat byte-for-byte across independent launches; portable instrumentation
reproduces the compiled inputs. No application change was needed. See
[settings/menu evidence](../reference/web/shared-controls-window/README.md).

Six full-window image/species/loupe overlap states now match native on each
backend (twelve exact RGB comparisons). The sequence includes image resizing,
an inspector added above an earlier image, a later image covering the inspector,
a covered loupe, and clicking the loupe to raise it. That last click exposed a
real behavior gap: native retains the derived sample with fragment -1 on an empty
loupe selection, then closes the ordinary sample/inspector on the next tick. The
web now uses the same retained-reference semantics for frame, anchor and wedge
background presses. Older tests that expected the source panel to remain open
were corrected against the native capture and source. See
[overlap evidence](../reference/web/shared-overlap-window/README.md).
The full regression passes 953 browser tests with one intentional duplicate skipped.
All twelve overlap outputs from that run match the retained exact evidence.
Fresh unit/build/legacy deployment checks also pass.

The direct-render counterpart now also passes all six overlap scenes on both
backends. The parameterized overlap regression passes four tests and twenty-four
exact comparisons across both gel rendering modes. Native Cmd-R is exercised after
initialization, and capture steps follow update counts to avoid variable draw
cadence. All twelve new native files repeat byte-identically. This increment
changes tests/evidence only; the preceding 953-test full suite and unit/build
results remain the latest broader verification. See
[Render-off overlap evidence](../reference/web/shared-overlap-direct/README.md).




| Check | Result |
|---|---|
| Unit suite | 2,924 passed |
| Browser suite across WebGPU/WebGL2 | 955 passed; one intentional duplicate skipped |
| Built shared-production suite | 22 Chromium passed; 216 exact native RGB comparisons |
| Shared-production compatibility | Firefox 132/157 and WebKit: root/subpath deployment checks pass; shipping Safari UI and native JSON roundtrip verified |
| Production build and TypeScript checks | Passed |

These results combine regression coverage and independent native differential checks. Web screenshot baselines and cross-backend agreement do not establish native pixel parity. Native release captures, a modern isolated rebuild dossier, and reproducible C++ harnesses exist; fresh native menu interaction is working; comprehensive native GUI replay and original-executable/toolchain equivalence remain limitations. Detailed evidence and qualifications appear in the incremental records below.

## Shared production composition: validation in progress

The earlier split-canvas inspector resolved multisample edges before composition,
causing native RGB differences up to 24/255. Its failed audit dossier remains in
[the transparency report](superpowers/reports/2026-10-10-fragment-transparency.md).
The local production build now always uses the shared surface, even when a stored
preference requests the retired compositor. Development comparison fixtures retain
the explicit legacy option.

The initial compiled-build suite passes 16 tests: root/subpath file workflows and
single graphics-context ownership; 24 exact complete-window startup/settings/menu
comparisons; and 192 exact fragment edge/solid comparisons on both backends at
DPR1/2. The fragment fixture isolates the actual compiled component contribution
and supplies controlled particles/underlay geometry; it does not replace the
component mesh with native meshes or modify renderer math. This is component
composition evidence, distinct from the unmodified full-window tests.

Fresh units pass all 2,924 tests, and a clean full browser run passes955 tests
with one intentional duplicate skipped. Independent source review found no Critical
or Important cutover issues. Shared-build deployment checks now pass on Firefox
132/157 and WebKit. Isolating Firefox test app-data resolves the earlier macOS
launch failure; the user profile and browser security settings are unchanged.
See [compatibility evidence](../reference/web/compatibility/shared-isolated/README.md).
Shipping Safari 27.0.1 also passes a manual UI sequence and exact native JSON
import/save roundtrip; see [Safari evidence](../reference/web/safari-shipping-ui/README.md). Both combined workload cases pass (50bands, sample and three loupes): steady
frame-interval p95 is16.7–16.8ms, with tracked resource counts flat at236/WebGPU
and49/WebGL2 through two10-second windows and a60-move timeline drag. These
are instrumented object counts and rAF intervals, not resident memory or
input-to-photon latency. Built hidden/frozen recovery now passes both backends:
two real hidden/visible and freeze/resume cycles, stopped/resumed frames, retained
view identities, interior particles, changing resumed paint and unchanged saved
JSON. Playwright focus emulation had prevented earlier visibility checks; the
fixture now disables it on the originating CDP session. No app fix was needed.
See [recovery evidence](../reference/web/shared-resume/README.md). Broader shipping-browser
interaction/lifecycle, long-suspension and physical-monitor checks remain. The production switch is not yet fully accepted. See
[retained production evidence](../reference/web/shared-production/README.md). Historical verification
entries below retain their original scope; earlier deployment/performance results
were for separate canvases. Original-release/toolchain equivalence and the broader
roadmap gates remain open.

The compiled compatibility suite now also covers species/color edits, H2O/TBE
changes, all three loupe drag modes with left/right/middle buttons, Render pixel
change/restoration, resize and deletion. All 10 cases pass on both pinned and
newer Firefox/WebKit runners; Chromium production now passes 22 tests and retains
216 exact native comparisons. This test-only increment changes no product code.
See [compiled workflow evidence](../reference/web/compatibility/compiled-workflows/README.md).

## Remaining completion work

The [composed native runtime reference](../reference/native/runtime/README.md) covers sixteen sequences and eight contracts for constructors, local/global random draws, species generation, loupe preroll, ordered ticks and collection lifetimes. The matching TypeScript runtime is now connected to the live app through a synchronous command store and one application frame driver. Canvases draw existing engines; GPU readiness and React effect replay do not own simulation. Native species generation, intermediate tube/loupe notifications, inspector timing and right-pointer creation/drag are implemented. Twelve store tests and eight new browser checks supplement the reference tests. The review fix is verified; these scripted references and browser checks do not certify full native GUI history or raster parity.

1. **Cross-view certification and shared runtime.** Sample identity, off-document references, raw fragment indices and frame selection-following are now implemented and regression-tested. Complete composed native GUI replay of selection/focus/panel transitions, and extend verification of application-wide RNG initialization and view scheduling beyond the captured command sequences.
2. **Remaining native features and controls.** Reference-image views are now implemented with source-backed gestures and shared ordering; native image decoding/raster and composed GUI certification remain. The Render-off alternate band scene is now implemented; native raster certification remains. Menu placement and measured button geometry are now implemented at 1×/2×. Complete typography/raster comparison, shortcuts, focus and remaining interaction details, with composed native replay of the restored right-click creation/drag sequence.
3. **Native visual certification.** Capture controlled matching native/web scenes for gel effects, blur/compositing, particles, loupes, selection and complete application layout. Resolve typography, asset proportions, resize/DPR behavior and justified raster tolerances. Decide cross-platform font handling and any browser layout adaptations explicitly.
4. **Composed workflow verification.** Expand native → web edit/save → native roundtrips and replay move/clone/delete with loupes open, hidden-lane restoration, degraded multimer dragging, and buffer changes with resizing/failures. Resolve recorded XML safety and unsupported native import edge cases explicitly.
5. **Browser lifecycle reliability.** WebGPU adapter/device acquisition failure now falls back to full WebGL2 in gel and molecular views. Setup failures, device/context loss, asynchronous validation errors and synchronous draw exceptions now have bounded recovery coverage. A visible graphics error and fresh-canvas retry cover exhausted backends. Complete async unmount/disposal, route remount, resize/DPR, hidden-tab resume and repeated multi-view creation/removal certification. Certify shortcuts that browser chrome may intercept.
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

All six full exit gates remain open; that does not mean their implemented parts are untested. Next sequence: remaining native features, controlled visual/workflow replay, then production/platform release checks. Continue reference work alongside implementation. No evidence-based percentage or calendar completion estimate is available yet; visual replay and platform checks may expose additional defects.

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
**2,845 unit tests, 273 browser tests plus one intentional duplicate skip, production
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

**Resolved Minor finding:** frame drawing previously captured React highlight props
before the tick's rollover update committed. Molecular draws now resolve current
selection/rollover directly from the store, including source-identity sets for
loupes. A browser regression moves a real particle beneath a stationary pointer
and observes the first mesh draw: it failed with the previous highlight on both
backends and passes with the new species in that same frame. An additional unit
case covers ordinary and loupe source mapping. Full verification: 2,845 units,
273 browser tests plus one intentional skip, production build/typecheck pass.
No screenshot baselines changed in this correction.

Review boundaries: full native GUI/raster equivalence, P5 reliability and the
unchanged nonparity 2D fallback remain required later gates. Zero random aspect/
multimer probabilities match the pinned native defaults; exposing other tuning
requires new reference coverage. Work stays in the isolated worktree; no merge,
push or publication was performed.


## Native Help control

The native Help icon is restored at the lower-right window corner: 32×32 logical
pixels, 16px gutters, original 1×/2× assets, native hover/down tint and shared view
ordering. It opens the pinned `Config::mHelpURL` in a new browser tab while retaining
the gel document and prior sample focus. The original URL remains
`http://douglaslab.org/gelbox/`; its live HTTPS destination was verified on 2026-10-09.
Browser tab navigation is the counterpart of native opening the external browser.

The two backend tests failed for the missing control before implementation and now
verify size, resize placement, hover tint, actual new-window navigation and focus
preservation. Final browser suite: **275 passed, one intentional duplicate skip**;
production build/TypeScript passes. The model unit suite remains **2,845 passed**
from the immediately preceding highlight correction (Help changes no model code).
Two full-window loupe goldens changed only for Help; both diffs and a resized Help
capture were inspected before updating. No particle goldens changed.

Fresh CUA capture/input against the original Cocoa release is working again:
1365×768 client, 2× pixels, 56px title bar; clicking screenshot `(64,1528)` opened
the application menu. This is current interactive evidence, not binary/source
or full raster certification. The native menu visibly uses the notched divider
asset and 28px item offsets; the web menu still uses a CSS border/flex gap. That
remaining menu geometry correction is next. Source contracts: native
`GelboxApp::makeHelpBtn`, `Config.h`, `Layout.h`, `AppSettingsView::setup` at `5f51097`.


## Native application menu and frame-acquired loupe rollover

The application menu now uses the native bottom-up 28px item spacing, measured
button dimensions, checkbox alignment, fill/hover colors, and original notched
divider, without a filled background panel. The native Retina text-button size
quirk is preserved. Source and reproducible macOS CoreText measurements are in
[the menu reference](../reference/native/menu/README.md). Browser tests cover
both display scales, selected-sample insertion, and actual Help asset decoding.
The latter caught and fixed a double `@2x` suffix that broke the Help image on
Retina displays. The 1×/2× geometry regressions failed before correction.

Full-suite verification exposed an intermittent existing loupe failure. Instrumented
real-engine picks returned -1 for the empty-space click and selection cleared,
but rollover remained at fragment 0. The frame picker can write rollover without
updating the component's last mouse-event reference; a subsequent miss/leave was
therefore unable to clear it. Loupe hover callbacks now clear current rollover on
miss/leave, matching the ordinary sample's behavior. A deterministic browser
regression moves a real particle under a stationary pointer, uses the real frame
picker, then leaves the canvas; it failed on both backends before the fix.
All 18 repeated loupe scenarios pass afterward, including the original failure.

Fresh verification on Node 22: **281 browser tests passed, one intentional duplicate
skipped; production build and TypeScript checks passed**. The unchanged model's
last full unit baseline remains **2,845 passed**; it was not rerun for these UI
changes. No screenshot goldens were changed. The reviewed web menu screenshot
and source-backed geometry do not certify native text rasterization or complete
application visual parity. Broader native workflow, raster, and P5 gates remain open.


## Native slider icons and timeline bounds

Fresh native gel-settings inspection confirmed that regular slider icons keep
natural logical asset dimensions inside common 26×26 notional slots. Web icons
now decode at 1×/2×, retain their natural size, and pixel-snap around those slots;
small icons keep the full slot's clickable area and large icons extend it. Bar
and graph sizing remain unchanged pending their own comparison. The timeline
now follows native GelboxApp's 16px left inset and default 316px notional width
for the 390px gel (58px right inset). See
[slider geometry evidence](../reference/native/slider-controls/README.md).

New browser cases failed before the icon and timeline corrections, then passed
at both display scales on both renderers. They check the 8×8 size icon's full
26×26 click slot as well as oversized lane and clock/voltage icons. The two
persistent-loupe full-page goldens were updated after inspecting diffs confined
to timeline pixels. These are web regression baselines, not native goldens.

Fresh verification: **285 browser tests passed, one intentional duplicate skipped;
production build and TypeScript checks passed**. The unchanged model's previous
unit baseline remains 2,845 passed. Remaining control work includes native handle
styling, notches, label raster/baselines, buffer and graph geometry, and gesture
semantics. Source inspection specifically identifies handle-relative dragging:
native retains its mouse-down offset, while the web currently maps the pointer
absolutely. Full native visual/workflow and P5 certification remain open.


## Native regular-slider gestures

Regular sliders now retain the pre-mouse-down normalized value for handle-relative
dragging, while preserving native's immediate absolute mapping when mouse-down
falls inside the track pick rectangle. A handle hit beyond an endpoint starts a
drag without an initial value change. Track drags remain absolute. Only primary
pointer gestures started on the control may edit it; pointer-up, cancellation and
capture loss end ownership. Entering with a held button no longer changes values.

Native Slider's default notch capture is four logical pixels. The web now converts
that distance using the current track width; the degradation control's old explicit
4%-of-track override is removed. Explicit normalized overrides remain supported
by the existing SliderConfig API, but native controls use the pixel default.

Twelve new browser checks failed before correction and pass afterward across both
renderers. They cover both sides of the endpoint handle, pre-click value retention,
held entry, secondary clicks, cancellation, actual capture release, fresh gestures
after termination, and the 3px/5px boundary around the voltage notch. Fresh full
verification: **297 browser tests passed, one intentional duplicate skipped;
production build and TypeScript checks passed**. No goldens changed; the unchanged
model's last full unit baseline remains 2,845 passed. Evidence is pinned
SliderView.cpp/Slider.cpp/Slider.h plus real browser gestures, not a completed
native GUI replay. Graph gestures, detailed styling/text and broader parity and
release gates remain open.


## Native aggregate graph gestures

The graph now owns the entire pick area, including empty space above zero/short
bars. Horizontal dragging selects the current column instead of continuing to
write the starting column, and each update preserves earlier edits from the same
gesture. Endpoint icons now select a one-hot first/last aggregate distribution.
The species graph uses native 0.05 steps followed by 8px endpoint snapping.
Primary-pointer ownership ends on up/cancel/capture loss; the former per-column
native event listeners and captured initial-value array are removed.

Six new backend/scenario combinations failed before their respective corrections
and pass afterward. They validate downloaded native sample JSON for multi-column
painting, quantization/snapping, endpoint icons and cancellation. Fresh complete
verification: **303 browser tests passed, one intentional duplicate skipped;
production build and TypeScript checks passed**. No goldens changed. The unchanged
model's previous full unit baseline remains 2,845 passed.

Pinned FragmentView.cpp and Slider.cpp establish these rules; complete native GUI
replay and graph raster/layout remain open. Source review also confirms a separate
inspector import defect: aggregateToColumns clamps a zero first weight to 0.001
and truncates distributions longer than seven columns, unlike native's padding-only
getter. Correct and verify that preservation boundary next. All broader native
visual/workflow and P5 release gates remain open.


## Imported aggregate distribution preservation

The inspector now pads short aggregate arrays without raising zero or very small
first weights and retains arrays longer than seven columns. Empty arrays still
display native's monomer default. Opening the inspector alone leaves the document
unchanged; editing writes the padded/current vector. Native-format export continues
to omit an empty Aggregate field, matching Sample.cpp's writer.

Four new import/edit/save cases per backend check zero-leading, sub-0.001,
nine-entry and empty distributions. The six nonempty backend/case combinations
failed before the conversion correction; the empty cases verify existing default
and export behavior. All check actual downloaded sample JSON before and after an
edit. Fresh verification: **311 browser tests passed, one intentional duplicate
skipped; production build and TypeScript checks passed**. No goldens changed; the
previous unchanged-model unit baseline remains 2,845 passed. This closes the
inspector conversion defect recorded above, not full native GUI/file certification.
Next: remaining control layout/raster and typography, composed native workflows,
and P5 lifecycle/platform/release validation.


## Native graph row geometry

The aggregate graph now occupies a native 26px notional row with its 32px drawing
area centered at y=13 (top -3, bottom 29). This also removes the former 6px shift
of the following degradation control. Graph endpoint icons keep natural logical
sizes; zero-weight bars have zero fill height, and all columns retain native
baseline strokes. Cinder RectT's noncanonical bottom-up rectangle coordinates were
checked explicitly to locate that stroke correctly. The maximum guide line uses
the native pale color. See reference/native/slider-controls for the derivation.

Four 1×/2× backend geometry cases failed before correction and pass afterward,
including a separate failing-then-passing baseline-stroke assertion. Reviewed web
captures show the corrected layout. Fresh verification: **315 browser tests passed,
one intentional duplicate skipped; production build and TypeScript checks passed**.
No screenshot baselines changed. The unchanged model's recorded full unit baseline
remains 2,845 passed. Native line antialiasing/DPR raster, typography, handle and
buffer styling, full composed workflows and P5 reliability/release gates remain open.


## Native buffer bar and molecule geometry

Buffer bars now anchor their own 135×23 bounds rather than centering inside a
26px icon row. The four molecule images use their natural 28×26 logical asset
size, placed 13px beyond the bar and vertically snapped to -2px relative to its
top. Both gel and sample panels use the native layoutFromBar rule. Concentration
controls remain disabled, and image clicks preserve imported off-preset values.

Four 1×/2× backend cases failed before correction and now check every bar/image
rectangle in both panels. The 38-case focused suite includes actual disabled-control
clicks and saved-file preservation. Reviewed web captures show the correction.
Fresh complete verification: **319 browser tests passed, one intentional duplicate
skipped; production build and TypeScript checks passed**. No goldens changed;
2,845 remains the unchanged model's last full unit baseline. Preset notch marks,
label typography/baselines, exact raster comparison, composed native workflows
and P5 reliability/release validation remain open.


## Buffer preset notch lifetime

Buffer panels now draw vertical preset marks at native pixel-snapped positions,
including the zero mark just outside the bar's left edge. Marks use the disabled
native fill-color tint. A matched preset updates them; an unmatched composition
retains the last matched marks for that view. Reopening a view on a custom buffer
starts without marks. This follows BufferView::syncPresetToModel rather than
recalculating markers from arbitrary current concentrations.

Six new backend/scenario cases failed before implementation and pass afterward.
They cover every parameter/preset at 1×/2× plus an observed-store update on a live
sample buffer view and closing/reopening it. Fresh complete verification:
**325 browser tests passed, one intentional duplicate skipped; production build
and TypeScript checks passed**. Reviewed web captures show the markers; no goldens
changed. The unchanged model's last full unit baseline remains 2,845 passed.
Native raster/DPR stroke comparison, typography, composed workflows and P5 gates
remain open. Next typography check: index.css sets inherited font-size-adjust on
:root, while only the app menu currently clears it explicitly.


## Native heading faces

Shared heading and subheading weights now select Avenir-Heavy, matching native
Layout.h, instead of Avenir-Black. Four macOS browser checks inspect the actual
rendered font face and compare sampled heading/UI advance widths with independent
CoreText measurements at 1×/2× on both renderers. The suspected inherited
font-size-adjust discrepancy was ruled out for these nodes: computed adjustment
already equals none.

Fresh full verification: **329 browser tests passed, one intentional duplicate
skipped; production build and TypeScript checks passed**. No goldens changed.
The unchanged model's last full unit baseline remains 2,845 passed. See the
[font reference](../reference/native/fonts/README.md) for reproduction and limits.
Native glyph rasterization/baselines, remaining control strokes/handles, composed
native workflows and P5 reliability/release gates remain open.


## Native slider handle drawing

Handles now use native snapped/inset drawing bounds, a solid offset shadow,
and a translucent dark outline, including the disabled handle. SVG drawing is
separate from the existing unsnapped gesture hit area. Four 1×/2× backend cases
verify drawing structure/geometry; existing gesture regressions remain green.
Fresh full verification: **333 browser tests passed, one intentional duplicate
skipped; production build and TypeScript checks passed**. Reviewed web captures;
no goldens changed. Unit baseline remains 2,845 for the unchanged model.
See [slider reference](../reference/native/slider-controls/README.md). Native
GL/SVG raster differences, line/notch appearance, text baselines, composed native
workflows and P5 reliability/release certification remain open.


## Native regular slider tracks and notches

Track strokes now use the native half-pixel center offset and one-device-pixel
width. Notch centers snap to logical pixels and use native opaque enabled/disabled
colors. They share existing handle width/DPR measurement. Four new display-scale/
backend checks and existing handle/gesture cases pass. Fresh complete verification:
**337 browser tests passed, one intentional duplicate skipped; production build
and TypeScript checks passed**. Reviewed screenshot artifacts; no goldens changed.
The unchanged model unit baseline remains 2,845. Native raster replay, graph/buffer
stroke treatment, label baselines, composed workflows and P5 gates remain open.


## Native control capture and label baselines

Fresh native/web gel-settings captures now have recorded provenance and a
reproducible ICC-normalized crop comparison in
[control-comparison](../reference/native/control-comparison/README.md). CUA returned
JPEG bytes with a Display profile: prior filename extensions cannot establish
lossless PNG/sRGB. Native color samples need profile-aware comparison, and JPEG
noise prevents exact-byte acceptance. Native text still appears heavier than the
source-face-correct browser text; no speculative weight change was made.

Baseline probes verify the native source's voltage/timeline coordinates already
match. Buffer values were half a logical pixel too low and are now corrected.
Four new macOS backend/DPR cases failed before the fix and pass afterward.
Fresh full verification: **341 browser tests passed, one intentional duplicate
skipped; production build and TypeScript checks passed**. Reviewed after-capture;
no goldens changed. Unchanged model unit baseline remains 2,845. Native text raster,
horizontal text snapping, graph/buffer stroke raster, complete composed workflow
replay and P5 release gates remain open.


## Native font smoothing

The remaining text-weight investigation found that the dev shell's forced
antialiased mode disabled native-like font smoothing in the parity workspace.
The workspace now uses auto smoothing without changing faces, sizes or weights.
Controlled CoreGraphics probes demonstrate distinct coverage for the same
Avenir-Medium face with smoothing off/on and black/white atlas drawing. Browser
auto and subpixel-antialiased outputs were identical in the captured experiment;
the former override was visibly thinner. See the
[smoothing investigation](../reference/native/fonts/smoothing/README.md).

Four existing backend/DPR font checks now assert effective smoothing; they failed
before correction. Fresh full verification: **341 browser tests passed, one
intentional duplicate skipped; production build and TypeScript checks passed**.
Reviewed equal-scale after capture; no golden updates. Unit baseline remains 2,845.
This resolves the forced grayscale rendering difference, not every glyph's native
raster: color-dependent atlas coverage, per-glyph snapping, platform fonts, full
native workflow replay and P5 release checks remain open.


## WebGPU acquisition fallback

Gel and molecular canvases now share an asynchronous backend resolver. It checks
actual WebGPU adapter/device acquisition before claiming a canvas context; null
adapters, rejected adapter requests and rejected device requests select the full
WebGL2 renderer on the untouched canvas. Successful WebGPU acquisition still uses
the shared cached device. Async cancellation is checked after resolution so retired
views do not acquire their canvas contexts. Molecular simulation ownership remains
in the application runtime, independent of renderer readiness.

Six browser cases failed before the fix and pass afterward. They inject all three
acquisition failures in both browser projects, observe real WebGL2 contexts on the
gel and molecular canvases, and inspect screenshot pixels for rendered bands and
particles. Fresh full verification: **347 browser tests passed, one intentional
duplicate skipped; production build and TypeScript checks passed**. No goldens
changed; the unchanged model's last full unit baseline remains 2,845.

This closes acquisition fallback only. Post-context setup/shader failures, reverse
fallback from unavailable WebGL2, exhausted-renderer error UI, device/context loss,
resource disposal and full lifecycle/platform/performance certification remain
open. Existing last-resort molecular 2D drawing is not a parity release solution.


## Visible graphics failure and retry

Gel and molecular views now show an accessible graphics initialization error with
Retry graphics. Retry replaces the failed canvas while retaining the live document
and molecular runtime. The former molecular 2D fallback, which only filled a
background and omitted particles, has been removed. Successful initialization
clears the error, including reinitialization after dimension changes. Error-panel
pointer events do not initiate underlying view gestures.

Four browser cases failed before implementation and pass afterward. With WebGPU
missing or unable to acquire an adapter and WebGL2 unavailable, both views show the
error. A native-format file can still be imported and saved with identical supported
JSON data. Re-enabling WebGL2 and pressing each retry button disconnects the old
canvas nodes and initializes full WebGL2 contexts. The failure screenshot was
reviewed. Fresh full verification: **351 browser tests passed, one intentional
duplicate skipped; production build and TypeScript checks passed**. No goldens
changed; unchanged model unit baseline remains 2,845.

Post-context initialization failures and partial resource cleanup, automatic reverse
fallback, device/context loss, lifecycle stress, platform/performance certification,
and full native visual/workflow parity remain open. This error state is a browser
failure adaptation, not a replacement for automatic recovery where another renderer
can work.


## Recovery after renderer setup failure

Gel and molecular canvases now share a bounded recovery cycle: after an identified
backend fails, try the other full renderer once on a new canvas; if both fail,
show the existing error. Manual retry starts a fresh cycle. The document and
molecular engines remain outside this drawing-surface lifecycle.

GPU canvas configuration now unconfigures its context if format/configuration
setup throws. Molecular views register context cleanup before batch creation:
retired WebGL contexts are explicitly lost, and GPU contexts are unconfigured.
Four injected-failure browser cases failed before implementation and pass afterward.
They throw after real GPU context configuration or during GL shader setup, verify
both views recover to the other backend, inspect visible band/particle pixels,
and confirm old canvases are disconnected and their contexts released. Existing
acquisition and exhausted-renderer/manual-retry cases remain passing.

Fresh full verification: **355 browser tests passed, one intentional duplicate
skipped; production build and TypeScript checks passed**. No goldens changed;
unchanged model unit baseline remains 2,845. These cases do not certify every
constructor allocation failure: GPU resources allocated inside a throwing factory,
asynchronous validation errors, device/context loss after successful startup,
lifecycle stress and platform/performance release checks remain open, together
with full native visual/workflow certification.


## Graphics loss with live views

Gel, sample and loupe drawing surfaces now observe WebGPU device loss and WebGL
context loss after startup. Loss stops drawing on the failed surface and starts a
fresh bounded alternate-backend cycle. A subsequent loss can start another cycle;
failed setup within that cycle still terminates at the visible error. In-flight
initialization checks both cancellation and loss before continuing.

Device subscriptions share one pending observer per device. Unmount removes view
callbacks immediately, avoiding one retained device promise callback per retired
view. GL listeners are removed during cleanup. Two unit checks cover unsubscribe,
shared notification, already-lost devices and cancelling a queued notification.

Two browser scenarios (one per starting backend) failed before implementation and
pass afterward. They keep the gel, sample and persistent loupe open with simulation
running, destroy the active GPU device or explicitly lose GL contexts, and repeat
loss after recovery to the other backend. All three canvases are replaced; pixels
show bands/particles after each recovery, view object identities remain unchanged,
the species panel stays visible, and no uncaught page errors occur.

Fresh full verification: **2,847 unit tests and 357 browser tests passed, one
intentional browser duplicate skipped; production build and TypeScript checks
passed**. No goldens changed. This covers programmatic API loss, not physical driver
reset certification. Async GPU validation, constructor allocation rollback,
resize/DPR/hidden-tab and repeated-view stress, actual browser/hardware performance,
and native visual/composed-workflow gates remain open.


## GPU constructor allocation rollback

GPU buffer/texture allocations now participate in synchronous constructor scopes.
A throwing constructor destroys its allocations in reverse order. Successful nested
constructors transfer their allocation records to the enclosing scope, so later
failure in a gel pass also releases completed earlier passes. On successful outer
construction, the normal returned renderer retains ownership; no scope is retained.
Device-specific scopes do not intercept or replace GPUDevice objects.

Gel and molecular mesh constructors, plus standalone quad, uniform, render-target
and ping-pong helpers, use rollback. All direct buffer/texture creation in the GPU/
gel libraries now goes through the allocation helpers, including warp/mesh pool
creation; outside a constructor scope, normal runtime ownership remains unchanged.

Twelve real-GPU browser cases failed before their respective fixes and now pass.
They inject second-texture failure, nested blur-pipeline failure, molecular bind-group
failure, quad upload failure, texture-view failure and standalone ping-pong failure,
then inspect every allocated buffer/texture's destroy call. Three unit checks cover
nested ownership, caught inner failure and isolation between devices.

Fresh full verification: **2,850 unit tests and 369 browser tests passed, one
intentional browser duplicate skipped; production build and TypeScript checks
passed**. No goldens changed. This covers synchronous constructor exceptions, not
async GPU validation errors, frame-time pool allocation failures, arbitrary GL
constructor failures or broad memory/performance certification. Those checks and
full native visual/workflow gates remain open.


## Asynchronous WebGPU validation recovery

Active GPU views now subscribe to uncaptured device errors as well as device loss.
An error stops drawing and uses the existing bounded alternate-renderer cycle;
unlike a new physical/device loss, it does not reset the failed-backend history.
Shared-device views all recover, while the diagnostic is logged once per event.
Listeners are removed when their views retire.

Four browser cases failed before the fix: actual invalid pipeline descriptors at
startup and invalid buffer creation while gel/sample views run. They now verify
WebGL2 recovery, visible band/particle pixels and no uncaught page exceptions.
Two additional cases combine asynchronous GPU validation with GL shader failure;
they verify exactly two automatic canvas attempts and exactly two more after manual
retry, ending in the visible error instead of looping. A unit check covers shared
notification, default-event handling and retired-listener cleanup.

Verification: **2,851 unit tests and 375 browser tests passed, one intentional
browser duplicate skipped; production build and TypeScript checks passed**. The
initial build exposed an EventListener typing mismatch; an erased type-only
correction fixed it and the build was rerun successfully. No goldens changed.
Hardware OOM/driver failures, synchronous frame-time exceptions/pool allocation
rollback, lifecycle/resource-growth/platform checks and full native visual/workflow
certification remain open.


## Frame-time exception recovery and allocation rollback

Gel scene updates and molecular draws now catch synchronous renderer exceptions
at their view boundaries and enter the bounded alternate-backend recovery cycle.
A molecular draw failure no longer escapes the shared frame listener and prevents
the next application animation frame from being scheduled. Model errors remain
outside this renderer boundary.

GPU mesh draws and complete gel frames now participate in allocation rollback.
If a frame fails, buffers/textures allocated during that frame are released,
including successful earlier nested draws. The failed renderer is retired by
view recovery; rollback does not promise that its mutated pools can be reused.

Two browser regressions inject real GPU/GL upload exceptions and verify both
views switch backends, application frames continue, selection remains visible
and no page exception escapes. Four additional allocation cases verify explicit
resource destruction after mesh/gel frame failures. All six failed before the
fixes; the 18-case targeted suite passes afterward.

Full verification: **2,851 unit tests, 381 browser tests passed, one intentional
browser duplicate skipped; production build and TypeScript checks passed**.
No screenshot baselines changed. These checks do not certify arbitrary driver
failures, long-running resource growth, platform support or native raster parity.
Next priorities are controlled native/web workflow and visual comparisons, plus
the remaining lifecycle, production, platform and performance release checks.


## Native startup capture and well stroke correction

A disposable modern native build exports its completed framebuffer directly to
PNG; three regenerated startup outputs have identical hashes. The user supplied
a lossless window PNG with a Display ICC profile. Its first-well interior stroke
pixels agree with the framebuffer after the 64-pixel titlebar offset. Captures,
instrumentation and qualifications are recorded under
`reference/native/modern/lossless-probe`. Modern/original executable equivalence
and full color-space/raster certification remain open.

Native no-width `drawStrokedRect` uses GL_LINE_LOOP, whose default width is one
physical pixel. Web well outlines incorrectly used one CSS pixel. They now use
one physical pixel with crisp SVG edges and respond to display-scale changes.
Two real-browser pixel regressions failed before the fix and pass afterward.
The first-well horizontal interior matches native exactly; the complete seven-well
strip still differs at 240 vertical/corner pixels, so this is not full well-raster
certification. No broader screenshot tolerances or baselines were changed.

Fresh full verification: **383 browser tests passed, one intentional duplicate
skipped; production build and TypeScript checks passed**. The unchanged unit
suite's last verified count remains 2,851. Native workflow/visual certification
and remaining lifecycle, production/platform/performance gates remain open.


## Native timeline track raster

Lossless startup comparisons exposed a CSS raster mismatch: the native track
center falls between Retina rows, giving two half-covered RGB203 rows. The web
CSS rectangle snapped to two fully covered RGB151 rows despite a half-CSS-pixel
height. Slider tracks now use an SVG line with the existing native color, center
and physical-pixel width. Enabled/disabled colors and DPR1/2 geometry remain
checked. Two new real-browser pixel regressions failed before and pass after.
`reference/native/modern/lossless-probe/timeline-comparison.json` records samples
from both native captures and the prior web output.

Verification: the full browser run on final product code passed 381 cases with
one intentional skip; four old track tests assumed a div. After updating their
selector and SVG stroke-bounds assertions, all six track/pixel checks passed
(two overlap the full run), covering 385 unique cases. An accidental graph CSS
change was restored before that full run; graph tests pass. Production build
and TypeScript checks pass. No snapshot baselines changed. Unit code is unchanged.
Typography, handles, tubes, well vertical/corner coverage and band raster still
need comparison; this is not full startup or native parity certification.


## Production root/subpath deployment

A new production-only suite serves the built `dist` from strict local static
servers at `/` and `/gelbox/`, without a development server or root-asset fallback.
Both subpath cases failed before the fix: native UI images requested origin-root
`/assets/...`. The shared resolver now applies Vite BASE_URL before DPR selection;
image-loading fallback also keeps the deployment base. No asset copies or server
rewrites conceal incorrect requests.

`npm --prefix ts run test:production` builds then runs four Chromium cases
(root/subpath × WebGPU/WebGL2) at DPR2. They check the actual gel context, decoded
startup/settings/species images, native JSON import/save equality, and malformed
JSON errors preserving the current document. Two new unit checks cover explicit
base resolution and a missing Retina variant's fallback path.

Fresh verification: **2,853 unit tests, 385 development browser cases, four built-app
cases passed; one intentional development-browser duplicate skipped. Production
build and TypeScript checks pass.** This closes these Chromium static-host smoke
scenarios, not all production checks: browser/platform fonts, deep engineering
routes, full failure lifecycle, long-run performance and native parity remain open.


## Additional browser-engine production checks

`npm --prefix ts run test:compatibility` builds and applies the same strict
root/subpath production workflows to Playwright Firefox and WebKit. Install
these engines with `npx playwright install firefox webkit` from `ts/` first.
The established Chromium `test:production` gate is unchanged; compatibility
failures are neither skipped nor converted to successful results.

On macOS 27.0.1, Mac17,14 / Apple M5 Max, pinned Playwright 1.49.0 installed
Firefox 132.0 (build 1466) and WebKit 18.2 (build 2104). Both WebKit/WebGL2 cases
passed: actual gel context, decoded UI assets, native JSON roundtrip and malformed
file preservation at root/subpath. These are engine smoke checks, not certification
of the shipping Safari app, current browsers, molecular pixels or native raster.

Both Firefox cases failed during `browserType.launch`, before requesting app
content. Logs report `sandbox_extension_issue_file_to_process ... Operation not
permitted`, `Can't find profile directory`, and `RenderCompositorSWGL failed
mapping default framebuffer`. Moving the temporary profile from macOS's default
temporary directory to `/tmp` reproduced the launch failure. No browser security
settings were disabled. A 15-second launch limit now bounds this diagnostic.

Final compatibility command: **production build/type checks passed; two WebKit
cases passed, two Firefox launch failures; command exits 1**. Product source was
unchanged, so existing unit/Chromium verification remains the preceding record.
Next resolve the Firefox runner/environment or use a validated current browser
runner, then exercise actual Safari and broader workflows. No Firefox support or
full browser/release gate is claimed.


## Live molecular display-scale changes

Sample/loupe canvases previously read devicePixelRatio only when their renderer
mounted. Changing display scale without changing CSS dimensions left their backing
buffers at the old resolution. They now resize the existing surface on resolution/
resize notifications and check dimensions before drawing. The draw-time check also
covers DPR changes without a dispatched resize/media event. Resize failures enter
the existing bounded graphics recovery path. View engines and canvas nodes are
retained; no simulation reset is introduced.

Two browser regressions failed with old buffers before the fix. Both now pass live
1× → 2× → 1× CDP transitions with fixed CSS dimensions, correct physical buffers,
visible particle pixels, the same two live sample/loupe view objects and connected
original canvas nodes. Transient hover views are excluded after their normal
disposal, rather than incorrectly counted as persistent views.

Fresh verification: **387 browser tests passed, one intentional duplicate skipped;
four production root/subpath cases, build and TypeScript checks passed**. Unit
code is unchanged; the last unit verification remains 2,853 passed. These are
emulated display-scale transitions, not physical multi-monitor certification.
No goldens changed. Broader lifecycle stress, platform and native parity gates
remain open.

Firefox follow-up: the pinned Firefox132 runner also failed in headed mode before
app navigation, with the same profile/sandbox-extension errors. This rules out a
headless-only workaround in this environment; current Firefox/Safari verification
still requires a working browser runner. No security settings were changed.


## Repeated multi-view resource disposal and route remount

Two additional browser tests instrument actual GPU buffer/texture creation and
destruction, plus GL buffers, textures, framebuffers, programs, shaders and vertex
arrays. After a warmup cycle, each renderer undergoes ten cycles of opening a
sample and two persistent loupes, waiting for live particles, closing loupes and
clearing sample selection through gel settings. Open-view resource counts exceed
the gel-only baseline; each closed cycle returns to that same baseline.

Native Escape retains species selection and can reopen the sample on the next
frame, so it is not used as proof of sustained sample disposal. Loupes are created
at separated bands to avoid clicking the first loupe's anchor when opening the
second. These were test-scenario corrections, not product behavior changes.

Same-document hash navigation to the non-GPU slider route releases all tracked
resources (count zero). Returning to the gel route opens a live sample again
without page errors or graphics alerts. A resource-count attachment is available
to reporters that retain test attachments.

Verification: **both new lifecycle cases passed twice after scenario corrections**,
including the final attachment-bearing version. Product code is unchanged; the
prior full suite remains 387 passed/one intentional skip, with two additional
passing cases now present. No full-suite rerun or build was needed for this
test-only increment. This establishes explicit object cleanup over these finite
cycles, not JS heap/driver residency, long-run resource growth, pending async setup
cleanup or hidden-tab resume. Those and native/platform release gates remain open.


## Pending renderer import cancellation

Two new browser checks hold the actual backend mesh-module response while gel
and sample views mount. They wait for gel context acquisition, leave through
same-document hash navigation, then release and await the module. Previously
acquired GL contexts are lost and GPU contexts unconfigured; no context is
acquired for detached app canvases, and no GPU/GL buffer, texture or GL program
is allocated by the retired setup after release. Returning to the gel initializes
new resources and a live sample without page errors or graphics alerts.

**Both new cases pass on the existing implementation.** This is a test-only
increment; product/build/unit baselines remain unchanged. Together with the
previous resource-cycle cases, four new lifecycle checks supplement the last
387-case full browser run. This covers cancellation at a concrete module-await
boundary after context acquisition, not every asynchronous adapter/device phase
or arbitrary driver timing. Hidden-tab resume, long-running memory/performance,
current browser/platform and complete native parity checks remain open.


## Suspension probe: environment precondition not satisfied

A separate `npm --prefix ts run test:suspension` probe opens sample/loupe views,
records native JSON and runtime identities, and requires verified hidden state and
stopped application frames before testing resume. It is intentionally outside
the established visual regression suite and does not silently skip failed setup.

Observed on the current macOS Chromium runner:
- Sending Page.setWebLifecycleState(frozen) while visible did not stop the
  application frame counter (it advanced during a 200ms observation).
- Bringing a second page forward in headless and headed modes left the original
  page's document.visibilityState as visible.
- Headed, single-worker minimization via Browser.setWindowBounds, with the usual
  anti-background-throttling flags removed, still reported visible. Both renderer
  cases failed the hidden-state assertion before the suspension/resume assertions.

The final probe/config is discoverable as two tests (`test:suspension -- --list`
passes). The executed minimization probe failed both visibility preconditions;
**no hidden-tab or freeze/resume certification is claimed**. No product code was
changed in response to a browser control that did not establish the required
state. A supported lifecycle runner or observed manual background/foreground
workflow is needed. Existing graphics-loss, route and DPR evidence remains separate.


## Built-application performance baseline

`npm --prefix ts run test:performance` builds the app and measures it from a local
static server, sequentially on both Chromium backends. The recorded native-format
fixture repeats the first ten species of an existing native export into five lanes
(50 bands) with two empty lanes. The real application opens a sample and three
loupes at separated bands, warms up for three seconds, then records two ten-second
windows and a 60-pointer-move timeline drag. Assertions verify the timeline changes
to 0:18 and back to 3:00; the interaction is not just a missed pointer gesture.

Recorded on Mac17,14 / Apple M5 Max, macOS27.0.1, pinned Chromium131.0.6778.33,
1365×768 CSS pixels at DPR2. Raw measurements and fixture provenance are in
`reference/web/performance/`. In this run:

| Metric | WebGPU | WebGL2 |
|---|---:|---:|
| Steady rAF interval p95 (two windows) | 16.8 / 16.8 ms | 16.7 / 16.7 ms |
| rAF callback CPU p95 | 3.5 / 3.5 ms | 2.7 / 2.9 ms |
| Timeline-drag rAF interval p95 | 16.8 ms | 16.7 ms |
| Tracked owned objects, warmup → post-drag | 223 → 223 | 27 → 27 |

The sample holds about160 particles; loupes in this fixture are sparse (1/5/1).
Resource counts track different API object categories per backend and are not
comparative memory footprints. Steady windows leave gel effects static; the drag
forces gel updates. Timings measure callback CPU and rAF cadence, not GPU timestamps
or input-to-photon latency. Driver residency, longer runs, denser loupes, native
comparison and a justified release performance budget remain required.

**Final build/type checks and both measurement cases passed.** Product code is
unchanged; no full regression rerun was needed. These are baseline measurements,
not an invented FPS acceptance threshold or a closed performance/release gate.

## Startup band texture-format investigation

A controlled [texture-format experiment](../reference/native/modern/lossless-probe/texture-format/README.md)
compared the retained lossless modern native startup with current web rendering
and a linear-RGBA8 treatment. Source defaults show native linear RGBA8 versus
web sRGB targets. Four browser captures passed twice. Both backends produced
identical measurements: linear storage reduced absolute RGB difference in the
fixed band crop from 303,975 to 300,963 (about 0.99%); maximum channel error
fell from 19 to 18. Most of the mismatch remains. Product rendering and goldens
are unchanged. Next diagnostic: compare offscreen gel outputs before final
window scaling and verify native runtime texture formats. This is evidence
for narrowing the investigation, not native raster certification.

## Native startup gel storage and display filtering correction

The [offscreen capture](../reference/native/modern/lossless-probe/offscreen/README.md)
localized two remaining startup-band differences. Native reports linear RGBA8
band/composite textures at 390×520 and one pixel per gel unit. Changing the web
gel targets to linear RGBA8 produces an exact RGB match to that entire native
texture on both backends. The previous sRGB path introduced per-pass
quantization differences. The remaining displayed mismatch came from the
canvas's explicit `image-rendering: pixelated`: nearest-neighbor enlargement
reproduced the old band screenshot exactly. Using normal linear filtering
also matches the native DPR-2 band crop exactly.

New independent-native regressions check full offscreen RGB bytes and displayed
startup band bytes, with zero tolerance. Modern native build provenance and
full-scene limitations remain explicit. Other gel states, wells, glyphs, other
DPRs and composed workflows still require certification.

Verification for this correction: **395 browser tests passed**, one intentional
duplicate skipped; **4 built-app root/subpath checks passed**, including a fresh
production build and TypeScript checks. All four new native texture/display
cases failed at their respective pre-fix stages and passed after correction.
No existing screenshot goldens or tolerances changed.


## Native effect-scene comparison and corrections

A new [sixteen-scene native raster matrix](../reference/native/modern/raster-scenes/README.md)
exports original GelRender output for eight effects at normal and doubled
texture resolution. This exposed three concrete divergences: blur uniforms
used logical rather than output dimensions; flames used Mulberry32 rather
than Cinder's MT19937 float stream; and overlapping primitives accumulated
additively instead of source-over. Those are corrected. The doubled-resolution
blur and normal/doubled flame scenes now match every native RGB pixel on both
web backends. Their zero-tolerance regressions failed before correction.

The complete diagnostic matrix **still fails** for water/combined effects on
both backends and for some half-pixel rectangle edges on WebGPU at ppu 1.
Those failures and before/after metrics are retained explicitly outside the
passing regression gate. They remain completion work; the synthetic modern
native captures do not certify GUI workflows or original-release equivalence.

Verification: **2,853 unit tests, 397 browser tests and 4 production checks
passed**, with one intentional duplicate browser skip; the production command
included fresh build/TypeScript checks. Existing goldens and tolerances are
unchanged.

## Native water-control upload orientation

The [water intermediate capture](../reference/native/modern/raster-scenes/water-debug/README.md)
verified identical pre-warp RGB images and control values for all four
water/combined scenes. Native tuning and render state were checked, and added
instrumentation left all sixteen original scene exports byte-identical.
Cinder flips Surface rows on texture upload; the web shader had sampled the
control field in the opposite vertical direction. GLSL now mirrors control V
and WGSL samples its already top-down control field directly. Displacement Y
still follows each backend's framebuffer convention.

All **16 WebGL2 scenes now match native exactly**; **11 WebGPU scenes match**.
The five remaining WebGPU mismatches share the ppu-1 half-pixel primitive edge
case (plain/blur/smile/damage/water). They remain recorded, unresolved failures.
The normal zero-tolerance regressions now include water-2 and combined-1/2.
The two 50-band overcook web goldens were inspected and updated because they
encoded the reversed control sampling. Their existing tolerance was unchanged;
these web goldens do not certify the 50-band scene against native.

Verification for the water correction: **397 browser tests passed**, one
intentional duplicate skipped; **4 production checks passed**, including fresh
build and TypeScript checks. Two existing 50-band web goldens changed after
inspection; no tolerance was relaxed. Unit implementation was unchanged in
this shader-only correction; the preceding 2,853-unit result remains the unit
baseline.

## WebGPU primitive edge coverage

The remaining five failures in the sixteen-scene matrix started with native
excluding a top horizontal edge exactly on a pixel center while WebGPU included
it. The WebGPU gel primitive pass now reflects vertex Y before rasterization,
then flips texels back with integer loads into the normal output orientation.
This uses the existing band ping-pong textures and adds one pass per band;
it does not offset geometry or relax comparison tolerances. Molecular geometry
keeps its existing pipeline.

All **16 native effect scenes now match exactly on both backends**, as do the
startup texture and displayed-band checks. The full matrix is now a normal
regression, with no outstanding cases hidden outside that gate. The native
reference remains a modern compatibility build, and sixteen synthetic scenes
are not full native GUI/raster certification. Additional proposed boundary
captures remain unverified because the native capture tool currently cannot
access the probe window; existing reference PNGs are unchanged.

Verification for the edge correction: **2,853 unit tests and 397 browser tests
passed**, with one intentional duplicate skipped. The production performance
command rebuilt successfully and both measurements passed. In the retained
[application performance run](../reference/web/performance/native-edge/README.md),
both backends had 16.7 ms p95 frame intervals during steady windows and timeline
dragging; tracked object counts stayed 223 (WebGPU) and 27 (WebGL2). This shows
no observed cadence regression in that workload, not isolated GPU pass cost or
full performance certification. No goldens or tolerances changed.

Built-app root/subpath verification also passed all **4 production checks**,
including a fresh build and TypeScript checks.


## Native sample reader/writer interoperability

A new [independent native sample harness](../reference/native/files/interop/README.md)
compiles pinned Sample.cpp and native Buffer serialization with retained Cinder
JsonTree/jsoncpp, without launching a GUI or using the web decoder. Its empty
sample export contains `Fragments: null`, exposing a valid native file the web
rejected. Native null fragment/aggregate collections and absent/null gel Samples
are now accepted with the native empty/default distinction. Malformed field
validation otherwise remains unchanged. Four unit regressions failed first.

Browser checks import the native empty sample and perform a mass edit/save of
a mixed DNA/dye sample with Unicode metadata, non-preset buffer and aggregate
weights. Both exports were reread independently by the native harness, twice
identically. Metadata and all unchanged fields match exactly. The retained
native JsonTree reader itself rounds real numbers through six significant
digits before float conversion; actual loaded mass and writer output are
recorded separately, without disguising that conversion as a tolerance.
This does not certify full Gel/GUI/XML round trips or original-toolchain
precision behavior.

Verification: **2,857 unit tests, 401 browser tests and 4 production checks
passed**, with one intentional duplicate browser skip. Production verification
included a fresh build and TypeScript checks. No goldens or tolerances changed.


## Native XML constructor corpus

The independent native reader now also executes pinned Sample's XML
constructor. Four [safe XML fixtures](../reference/native/files/interop/xml/README.md)
cover metadata/entities, defaults, colors, filtered children, empty samples,
and native-ignored ID/buffer/dye/aspect fields. Captures repeat identically.
The corpus exposed rejection of native-supported `0x` colors; the web now
accepts optional prefixes, uppercase forms and surrounding whitespace for
24-bit hexadecimal colors. The comparison failed before correction.

Ten browser checks cover the four native fixture comparisons on both backends,
external-DTD no-request behavior, and unsafe aggregate index rejection. The
native XML resize-then-index memory error is explicitly excluded; JSON remains
the multimer path. Partial-token numeric coercions and broader XML writer/
entity/application behavior remain uncertified. The JSON fixtures and native
edit/save rereads were regenerated with the extended driver and still verify.

Verification: **2,857 unit tests, 411 browser tests and 4 production checks
passed**, with one intentional duplicate browser skip; production included a
fresh build and TypeScript checks. No goldens or tolerances changed.


## Whole Gel reader and edit/save corpus

The [whole Gel corpus](../reference/native/files/interop/gel/README.md) extends
independent native execution to four documents: twelve mixed lanes, two lanes
padded to seven, twenty-two retained slots with twenty visible lanes, and an
explicitly empty lane array. Ten browser checks compare loaded state/export
scope and perform a real mass edit/Save Gel on both backends. Native rereading
of both retained downloads verifies every field against the exact native
numeric conversion; all other lane/sample/settings data stays unchanged.

The harness initializes four otherwise-indeterminate native layout members
through a recorded header patch. It rejects absent Samples; earlier source-only
claims of safe native absent-Samples support were too broad. The retained
Cinder writer also collapses Samples into an object when the final visible lane
is populated. Raw output is retained separately from actual loaded native state;
the web continues preserving all visible lanes in an array. Original release
behavior must be established before treating that data loss as a parity target.
Native GUI dispatch and broader composed workflows remain open.

Verification: **2,857 unit tests, 421 browser tests and 4 production checks
passed**, with one intentional duplicate browser skip. Production included a
fresh build and TypeScript checks. This increment adds independent evidence
and regression coverage; no product behavior, goldens or tolerances changed.


## Original-release keyed Samples import

The [official release GUI replay](../reference/native/files/interop/gel/release/README.md)
resolves the preceding writer uncertainty. The unmodified original app opens
all twelve lanes of the web export, but its Save Gel produces an object that
retains only the last sample. Reopening shows that sample in lane two of seven.
Raw original outputs and screenshots are retained. The web previously rejected
this native-generated object form; it now imports the surviving children in
native member order. Two unit tests failed before the correction. Invalid
scalar/child data remains rejected. Both browser recovery exports match the
original release's recovered seven-lane export exactly.

Web saves continue preserving all visible lanes as arrays; reproducing native
file data loss is an explicit export parity exception. Lost samples cannot be
reconstructed from the corrupted native output. Original GUI dispatch is now
verified for this sequence, not all file workflows. An open native gel buffer
panel retained stale labels across document loading although saved buffer data
was correct; that separate composed-panel observation remains unresolved.

Verification: **2,863 unit tests, 423 browser tests and 4 production checks
passed**, with one intentional duplicate browser skip. Production included a
fresh build and TypeScript checks. No goldens or tolerances changed.


## Composed native move and Species preview restoration

The [original-release multimer move replay](../reference/native/replay/composed-move/README.md)
checks selection, hover preview, tube movement and saved data together. Moving
lane two to lane four retains the species inspector and sample focus; the
native Save Gel differs only in lane placement. Both web backends now replay
and verify that exact document and UI contract, including intermediate pointer
positions through tube gaps.

The comparison exposed three omissions, now corrected: rounded sample body
corners instead of native square framing; a solid Species color swatch instead
of the native live representative molecule; and tube-row keyboard focus instead
of sample focus during movement/remounting. The representative picks the first
most-visible matching part from the existing sample engine, draws without
selection outlines, updates with color/geometry, and adds no simulation or
random stream. Unit and browser regressions failed before these corrections.
DPR coverage now includes its separate rendering surface and proves it shares
the sample engine. Existing drag/keyboard behavior still passes.

Verification: **2,865 unit tests, 427 browser tests and 4 production checks
passed**, with one intentional duplicate browser skip. Production included a
fresh build and TypeScript checks. No screenshot goldens or tolerances changed.
Two [built-app performance checks](../reference/web/performance/species-preview/README.md)
also passed: p95 frame intervals 16.7 ms steady and during timeline dragging on
both backends, with tracked resource counts stable at 225 WebGPU / 29 WebGL2.
Those finite sparse-loupe measurements are not a release performance budget.

Native JPEGs and unfrozen web observations do not certify pixel parity.
Persistent Command-drag/clone loupe GUI sequences remain open. Concrete next
visual fixes identified by comparison/source are nearest-color palette
selection, sample-header tube geometry and degradation label visibility;
full inspector focus behavior and extreme representative overflow also remain
uncertified.


## Native palette, header tube and degradation label

The three concrete inspector details from the preceding replay are corrected;
[retained evidence](../reference/native/replay/inspector-details/README.md)
records pinned source and web observations. The palette now marks the nearest
native RGB color, retaining first-on-tie behavior and preserving imported custom
RGB data. Its selected backdrop follows native outward geometry. The sample
header tube is 19 logical pixels wide with its bottom 25 pixels above the
sample frame. The web-only degradation value label is removed without changing
its value or editing behavior.

Two unit cases and six browser cases failed before correction. The browser
checks include exact complete-document preservation after merely displaying a
custom color. Verification: **2,867 unit tests, 433 browser tests and 4 production
checks passed**, with one intentional duplicate browser skip. Production
included a fresh build and TypeScript checks. No goldens or tolerances changed.
Full native raster/typography and inspector focus certification remain open.


## Current browser-engine compatibility probe

An [isolated Playwright 1.64.0 probe](../reference/web/compatibility/playwright-1.64/README.md)
ran the byte-identical production workflows against freshly built `bfbc32b`.
WebKit 27.2 passed both root and subpath cases, including real WebGL2 rendering
initialization, controls, assets and exact native-file round trips.

Firefox 157.0 failed both cases before navigation with `Could not find profile
folder.` An existing persistent profile in the user's cache directory failed
the same way. Updating the runner alone therefore does not resolve the previous
Firefox 132 launch limitation; changing away from temporary profile storage is
also insufficient. Root cause remains unproven. Repository dependencies, browser
security settings, product code and test assertions were not changed.

Fresh build/type checks and two current WebKit production cases passed. No new
full unit/browser suite run was needed for this evidence-only change. Shipping
Safari and Firefox, broader cross-browser workflows and all remaining native
parity/release gates remain open.


## Sample keyboard ownership through band and palette clicks

Pinned native `GelView.cpp:542` gives the opened SampleView keyboard focus after
band selection. `ColorPaletteView::mouseDown` changes color without changing the
ViewCollection keyboard owner. The web app previously focused its SVG gel after
band selection and then moved DOM focus to a clicked palette button.

Band selection now focuses the mounted sample after dispatch, matching the
existing tube behavior. Pointer palette clicks preserve that owner; explicit
keyboard focus and Space activation of color buttons still work. Regression
checks on both backends prove sample focus before/after the color click, deletion
of the selected species, and exact complete-document preservation of all other
data. The expected deletion follows native MolecularSim's swap-with-last removal
(`MolecularSim.cpp:219–249`). The focus assertions failed before their respective
fixes. No native GUI replay is claimed for this increment.

Verification: **2,867 unit tests, 437 browser tests and 4 production checks
passed**, with one intentional duplicate browser skip. Production included fresh
build/TypeScript checks. No goldens or tolerances changed. Focus interactions
with other panels, native palette drag behavior and full visual parity remain open.


## Native palette press and drag

Pinned `ColorPaletteView.cpp:96–130` applies a color on mouse down, updates it
on drag, and retains the last valid color while outside the palette. The web
palette previously applied color only on click. It now handles primary pointer
press and captured movement across complete swatch cells, including inset areas,
retaining color outside and ending on release, cancellation or lost capture.
Keyboard click activation remains available and pointer editing preserves sample
keyboard focus. A trailing pointer click cannot overwrite the final drag color.

The added composed browser case failed at the initial pressed-color assertion
on both backends before implementation. It now checks press, cross-cell drag,
exit, re-entry, outside release and subsequent hover without editing. Existing
keyboard activation and exact post-edit deletion round trips also pass. This is
source-backed behavior evidence; a matching native GUI drag replay remains open.

Verification: **2,867 unit tests, 439 browser tests and 4 production checks
passed**, with one intentional duplicate browser skip. Production included fresh
build/TypeScript checks. No goldens or tolerances changed. Full native visual and
interaction certification and the remaining release gates are still open.


## WebKit core interaction expansion

[Retained WebKit 27.2 evidence](../reference/web/compatibility/webkit-interactions/README.md)
extends the isolated 1.64.0 runner probe to **21 passing interaction cases**
covering species editing, sample transfers, inspector/palette behavior and
persistent loupe movement, resize, stacking and keyboard ownership. The final
run used byte-identical copies of five repository test files, no retries and
explicitly disabled snapshot updates. The full-page loupe golden case is
excluded because no reviewed WebKit baseline exists; it is not counted as passed.

The exercise exposed two portability assumptions in the loupe test. WebKit
delivers integer mouse coordinates, so the shared test now supplies integer
input instead of expecting fractional coordinates to survive dispatch. Its
exact molecule-invariance comparison now uses an integer-aligned interior clip:
retained before/after images show 357 differing outer focus-border pixels while
the decoded interior is identical. This avoids conflating the translucent CSS
frame over a changed background with molecular content. Geometry tolerances and
full-page Chromium goldens are unchanged. No product code changed.

The affected Chromium loupe suite also passed **12 checks** across both renderers.
The preceding full suite remains 2,867 unit / 439 browser / 4 production checks;
only the affected suite was rerun for these test-only changes. Shipping Safari,
Firefox launch, native GUI/raster parity and remaining release gates stay open.


## Original-release palette and keyboard replay

Native window access recovered. The [retained original-release replay](../reference/native/replay/palette-focus/README.md)
confirms palette dragging selects cyan while retaining sample focus, followed by
Delete removing the selected species. Native Save Gel files independently verify
color-only editing and swap-with-last deletion. The corresponding browser replay
passed **two new cases**, one per renderer, including exact complete-document
equality after deletion. This test/evidence-only addition did not rerun the full
suite; its preceding result remains 439 browser checks.

Two remaining discrepancies are now explicit: palette-created channel precision
differs from the original release's cyan save, and visual inspection suggests
the selected-band outline is too thick. The post-deletion file check does not
certify intermediate palette precision. Native JPEGs/live particles are not
lossless pixel parity evidence. Neither discrepancy nor the broader goal is
marked complete.


## Native band focus geometry, color and opacity

The overly thick outline observed in the original release comparison was traced
to web reuse of the molecular-particle outline style. Native GelView instead
draws an outward-inflated UI rectangle with a two-pixel stroke, species color,
and .65 selection / .35 rollover opacity. Dye focus uses half the dye color.
Those contracts are now applied and covered by four new browser checks; see
[retained source and image evidence](../reference/native/replay/band-focus/README.md).
Coordinate-based band hit testing retains its original uninflated rectangle.

The new DNA regression failed before correction. Three older tests asserted the
incorrect yellow band highlight and were corrected. Two hover-loupe goldens
contain the underlying gel; their outline changes were visually inspected and
the two baselines regenerated, without increasing tolerance. The subsequent
full run used normal snapshot verification.

Verification: **2,867 unit tests, 445 browser tests and 4 production checks
passed**, with one intentional duplicate browser skip. Production included fresh
build/TypeScript checks. Palette precision, complete original-native raster
comparison and the remaining interaction/release gates stay open.


## Original-release palette channel precision

All twelve original-release palette swatches were captured through GUI edits and
a single Save Gel; [retained evidence](../reference/native/replay/palette-values/README.md)
includes the raw input, native output, observation and both web exports. Every
channel matches float32 multiplication by a float32 reciprocal of 255. The web
palette conversion now uses that computation, preserving imported colors and
existing RNG behavior. Both renderers replay all twelve edits and save a complete
document exactly equal to the native output. The new unit and browser checks
failed before correction.

Modern Cinder runtime references use rounded division and differ from the
original release in palette channels. Raw captures remain intact; an explicit
test helper substitutes only exact known harness palette entries with original
release entries at the same index. Other runtime/RNG assertions are unchanged.
The capture also revealed conflicting uppercase/lowercase sample-name handling;
that is documented as a separate unresolved interoperability case. The replay
fixture removes the accidental conflicting name alias, with raw capture input
retained for audit.

Verification: **2,868 unit tests, 447 browser tests and 4 production checks
passed**, with one intentional duplicate browser skip. Production included fresh
build/TypeScript checks. No goldens or tolerances changed. This resolves the
palette-created channel precision discrepancy, not full native raster/interaction
parity, arbitrary color conversion behavior or the remaining release gates.


## Native JSON case-insensitive field lookup

The conflicting sample-name discrepancy generalizes to native JsonTree field
lookup: ASCII case-insensitive matching, first match in sorted jsoncpp member
order. The native decoder now applies that lookup to header, gel, sample,
fragment and buffer fields while retaining existing value validation and
canonical exports. String values are not folded. Four unit regressions failed
before correction; [three independently captured native cases](../reference/native/files/interop/case-keys/README.md)
verify mixed-case fields and conflict precedence independent of insertion order.
Re-executing the native harness reproduced every output byte-for-byte.

Four browser cases verify actual mixed-case Sample/Gel Open and Save on both
renderers. The palette replay now uses the original capture input directly,
including conflicting names, and its whole saved document matches the original
release without name normalization. The original release GUI establishes that
name conflict; the broader mixed-case corpus is constructor/harness evidence,
not an additional GUI claim.

Verification: **2,872 unit tests, 451 browser tests and 4 production checks
passed**, with one intentional duplicate browser skip. Production included fresh
build/TypeScript checks. No goldens or tolerances changed. Native raster, broader
interaction and remaining release gates stay open.


## Extended resource lifecycle and retained-heap observations

The lifecycle test now accepts an explicit cycle count (default ten) and optional
Chromium post-GC heap observations. [Retained 100- and 500-cycle runs](../reference/web/performance/lifecycle-soak/README.md)
passed on both renderers, followed by a passing default ten-cycle run without
heap profiling. Each cycle opens a sample/Species preview and two persistent
loupes, then closes them and checks exact resource-count return to baseline.
Route unmount reaches zero tracked resources, followed by successful remount.

At 500 cycles, WebGPU's baseline was 59 resource objects and WebGL2's 19. The
last 200 cycles changed post-GC used heap by −9,256 bytes and +32,984 bytes,
respectively, after larger early warmup growth. These finite development-build
measurements support near-level retained JS heap for this workload, not driver
resident memory, long wall-clock use, hidden-tab recovery or a release budget.
No product code changed; the affected test passed twice at extended counts and
once with default settings. The prior full unit/browser/production gate remains
2,872 / 451 / 4; it was not repeated for this test-only instrumentation.

Lossless native capture remains unresolved. The macOS screenshot toolbar became
accessible, but neither selected-window nor entire-screen actions produced a
Desktop file. The screenshot service subsequently exited and failed to reopen;
no screenshot process remained. This attempt produced no pixel reference and
does not advance native raster certification. Existing JPEG observations and the
user-provided lossless startup PNG retain their previously documented limits.

## Complete well-outline comparison against user PNG

[Fresh seven-well diagnostics](../reference/native/modern/lossless-probe/well-edges/README.md)
confirm exact agreement between the user's native PNG and modern framebuffer
throughout the well strip. Current WebGPU and WebGL2 each differ at 240 pixels,
confined to vertical edges/corners. A DOM-only experiment with SVG geometric
precision increases the difference to 1,856 pixels and is rejected.

Pinned source identifies a native OpenGL line-loop/MSAA path distinct from the
web SVG stroke and from native explicit-width band-focus geometry. Reports,
captures, source hashes and reproduction are retained. Two diagnostic runs
completed; they report differences and are not passing parity assertions.
No product change or full-suite rerun. A general well-edge correction and its
multi-geometry/DPR native reference validation remain open.

## Native well raster strategy established across sixteen scenes

[Native window-framebuffer captures and prototypes](../reference/native/modern/well-scenes/README.md)
now cover 2/7/12/20 lanes, physical scale 1/2 and translations 0/.25. Two native
launches produced byte-identical references. The startup case matches the user's
PNG well strip exactly. The rejected offscreen-native capture path is explicitly
distinguished from the retained window captures.

WebGL's reflected projection plus unflipped readback matches all sixteen cases,
including with explicit four-sample framebuffers and canvas antialiasing disabled.
WebGPU matches all sixteen using standard top-down geometry and explicit integer
nearest-even multisample resolve. Automatic and half-up resolves change some
native RGB130 corners to131; those failed variants remain recorded. Final probes
assert exact equality; three final diagnostic invocations passed (two canonical
API probes, followed by the explicit-framebuffer GL variant).

No product renderer changed. The [integration plan](superpowers/plans/2026-10-10-native-well-presentation.md)
covers shared physical-resolution presentation, both effects/direct modes,
nonblack compositing references, DPR, failures and cleanup. This establishes a
measured strategy for the open well-edge correction, not application parity or
release completion. Prior full-suite counts are unchanged and were not rerun.

## Product well-presentation modules and colored raster references

New WebGL2/WebGPU presentation modules combine linear base-texture enlargement
and native well strokes in a four-sample physical-resolution target. Tests call
these modules directly and match 48 independent native references per backend:
the sixteen window-derived black scenes plus [32 colored/crossing-band cases](../reference/native/modern/well-scenes/compositing/README.md).
The headless native GL extension first reproduced every original window case.

The colored matrix invalidated the black-only integer nearest-even inference.
Summing normalized float32 samples in sample-index order matches the full matrix;
forced integer ties produced one-byte errors. Both failing and passing reports
are retained. TypeScript checks pass, and both 48-scene browser cases pass. The
modules preserve opaque output and own/dispose their presentation resources.
Application integration and lifecycle/recovery checks subsequently completed as recorded below.

## Native wells integrated into effects and direct rendering

Both application canvas modes now present the base gel and wells together at
physical display resolution, leaving scientific effects textures unchanged.
SVG well rectangles retain their logical geometry/test IDs with no visible
stroke. Complete seven-well comparisons against the user's native PNG pass on
both backends/modes; native offscreen band texture and displayed band crop remain
exact. The first affected run passed 26 browser cases and TypeScript checks.

New live-DPR/lane workflows pass on both backends: 7→20 lanes, DPR1→2→1 in effects
and direct modes, exact native well strips, unchanged saved document and logical
picking. A guarded frame-time DPR check handles actual ratio changes without
resize/media events. Capture uses the same CDP session as the metrics override
and asserts image dimensions; the original Playwright session captures its old
DPR. Physical monitor transitions still need separate validation.

Lifecycle, failure injection, full regression/production gates and independent review for this increment are complete as recorded below. Broader visual and release parity gates remain open.

## Presentation recovery and resource disposal

Failure injection exposed and corrected direct-mode gaps: it now retries the
alternate full renderer, contains draw errors, provides bounded failure/Retry UI,
and immediately releases failed resources. Explicit checks caught and fixed
failed WebGL contexts left alive after early disposal. Presentation shader
failure also exposed partial shader objects escaping the shared GL program
constructor; its failure paths now release shaders/programs transactionally.

All 18 targeted presentation/resource lifecycle cases pass, including delayed
imports after route exit, mode/DPR cycling, shader/allocation/frame failures,
retry and zero tracked objects after unmount. Resource tracking now includes
GL renderbuffers. Initial broad checks passed 2,872 units and four production
cases; 473 browser cases passed and two scientific-buffer comparison tests
needed their old SVG-only well exclusion moved to the presentation input.
Those two now pass with the original exact full-image comparison unchanged.
The complete browser rerun passed 475 cases with one intentional skip.

Independent review then found an effects-mode terminal-failure resource leak.
Four new allocation/frame tests reproduced it on both backends; immediate,
idempotent disposal now releases all tracked objects and retires failed GL
contexts while the error screen remains visible. Retry recovers. Final gates
on the corrected product passed **2,872 unit tests, 479 browser cases (one
intentional skip), and four production cases**, with no golden/tolerance changes.

The [performance workload](../reference/web/performance/native-well-presentation/README.md)
at the preceding commit passed both backends, with stable tracked resource
counts and p95 rAF intervals <=16.8ms. It is not a native performance comparison
or release budget. The [completion record](superpowers/reports/2026-10-10-native-well-presentation.md)
retains review disposition and all execution rulings. A Minor remains deferred:
fresh visible-well arrays trigger avoidable scientific redraws on unrelated UI
changes. Whole-app parity, cross-platform/fractional-scale raster acceptance,
physical driver-reset recovery and native performance budgets remain open.

## Scientific redraw isolation and complete startup gel

The [complete startup gel](../reference/web/startup-gel/README.md) now has an exact
780×1040 RGBA comparison against the user's native PNG on both backends. This
extends the previous separate well/band checks to the entire composed gel
rectangle. Tubes, control/text raster, other states/scales and whole-app GUI
acceptance remain open. No native fixture or tolerance was changed.

Resolved the review's deferred redraw finding: GelPage memoizes visible wells,
and fragment selection retains the simulation context when its sample buffer
has not changed. Previously, pointer hover and keyboard selection invalidated
all scientific passes despite unchanged scene data. The regression first failed
on both backends, then passed after the two reference-stability fixes. It counts
real scientific passes through hover, keyboard selection, settings panels and
loupe creation/closure; real timeline/lane edits still redraw and alter pixels.
Band/tube pointer editing retains its native notification behavior. The test
hides selection strokes only for its scientific-image comparisons, not for the
independent native startup comparison.

Final checks: 2,872 unit tests, 481 browser cases (one intentional skip), and four
production cases passed. Native GUI access was retried and still returned
`cgWindowNotFound`; source-backed work can continue, but that does not certify
composed original-release GUI workflows. The previous goal turn and this turn
both made verified product/evidence progress; the full app goal remains active.

## Render-off band edges share native samples with wells

The [56-case direct-band raster matrix](../reference/native/modern/direct-band-scenes/README.md)
uses meshes emitted by unchanged pinned native `GelView::drawBands`, then native
CGL four-sample rasterization. It independently covers fourteen mesh cases at
DPR1/2 with and without crossing well outlines. Initial web comparisons exposed
fractional-edge differences up to 88 channel levels on both backends: bands had
been rasterized into a single-sample intermediate before well presentation.

DirectBandCanvas now draws its existing mesh into the same four-sample surface
as the wells. It retains additive band blending, source-over wells, display
opacity and native orientation. The intermediate texture and separate mesh
batch are removed; effects mode retains its image presentation. Direct programs
and vertex buffers are lazy, reused and released through existing recovery.
All 56 native RGB cases now match exactly on each backend, including fractional
clipping and well/band intersections. Native repeat capture verifies all 56;
the separate well oracle still reproduces 16 window and 32 colored references.

Added band-pipeline/allocation failure tests verify alternate-backend recovery
and zero retained objects after unmount. Final full gates: 2,872 units, 489
browser cases (one intentional skip), four production cases and typecheck/build
passed. No preexisting fixture or tolerance changed. The oracle uses modern
CGL and captured native meshes; original-release GUI output, other hardware and
fractional display scales, full control/particle/loupe scenes and release
performance requirements remain open.

Independent review of the direct-band correction found no Critical, Important or
Minor issues; its pending-test condition is satisfied by the final checks above.
The [review record](superpowers/reports/2026-10-10-direct-band-presentation.md)
retains its scope and open requirements.

## Native dye backgrounds, including imports and duplicate entries

The [native background harness](../reference/native/numerical/background/README.md)
executes unchanged pinned `Sample::getDyes` and `MolecularSim::drawBackground`
with actual Cinder Color math. Thirty-six cases cover idle/hover/down, individual
and mixed dyes, fractional values, imported masses above 125 ng and duplicates.
A separate native CGL RGBA8 probe records the solid-background RGB conversion.
Both numeric output and RGB conversion repeat identically.

Fixed two native differences: the background no longer clamps imported mass to
the slider maximum, and the shared sample/loupe canvas sums duplicate dye
fragments instead of taking the last entry. Background arithmetic now follows
native float32 operations exactly. The 36 numeric tests failed before and pass
after. Six browser scenarios also failed before; they now match exact native
RGB for excess/duplicate dye imports in idle/hover/down on both backends, and
saving retains all original dye entries/masses. No tolerance or existing image
baseline changed. Fresh gates: 2,908 units, 495 browser cases (one intentional
skip), and four production cases passed.

This closes the measured background calculation/import discrepancy, not native
particle-edge raster or composed loupe GUI certification. Next concrete dye
control issues identified by source comparison: DyeRow applies linear-to-sRGB
conversion to already native-domain colors; SET_DYE_MASS suppresses a missing
zero-mass entry and initializes new dye metadata differently from native
Sample::setDye/Fragment defaults. Native getDye (singular) intentionally uses the
first matching entry for its slider, whereas getDyes sums for the background;
that distinction must be retained when correcting those remaining controls.


## Native dye controls and saved defaults

Source comparison against pinned Gelbox `5f51097` confirms that
`SampleSettingsView::makeSliders` uses `Dye::kColors` directly. DyeRow now
preserves those display-domain colors instead of applying linear-to-sRGB gamma
conversion. Browser checks cover all four fill and empty-track CSS colors on
both rendering backends. These are source-derived color checks, not a claim of
complete native control-edge/font raster certification.

`Sample::setDye` constructs a default Fragment even on the first zero-mass
write. The reducer now does the same: bases 0, aggregate [1], neutral gray
[0.5, 0.5, 0.5], aspect ratio 1 and degradation 0. Existing entries still update
only the first matching fragment, consistent with native singular getDye.
Three creation cases failed before the correction; the color browser check
also failed on both backends before correction. A real UI zero-mass edit and
Save Selected Sample check verifies the serialized fragment fields.

No golden images or tolerances changed. The molecular renderer's terminal
failure cleanup is the next source-identified reliability concern: unlike the
corrected gel renderer, it releases resources on effect cleanup but not directly
when the second backend fails. A failure-injection test is needed to establish
its externally observable effect before a fix. Particle-edge/native composed
GUI certification and all full P0–P5 gates remain open.

Fresh validation for this increment: 2,909 unit tests, 499 browser tests (one
intentional duplicate skipped), and all four production checks passed, including
the TypeScript build. The full browser run includes both new color and saved
zero-entry scenarios on WebGPU and WebGL2. Logs: `/tmp/gel-dye-controls-unit.log`,
`/tmp/gel-dye-controls-full.log`, `/tmp/gel-dye-controls-production.log`.


## Molecular terminal-failure cleanup

Failure injection confirmed that the shared molecular canvas retained resources
when both backends failed: frame failures left explicit graphics objects alive;
initialization failures left a configured WebGPU canvas or a live WebGL context.
The terminal error state does not remount the effect, so relying on effect
cleanup was insufficient. SampleSimCanvas now disposes immediately on loss,
frame failure and initialization failure. The same idempotent cleanup is used
on unmount; failed WebGL contexts are explicitly retired.

Four browser cases cover initialization/frame failure with each preferred
backend. They require the terminal error panel, return to the gel-only explicit
resource/configuration baseline before retry, retirement of failed GL contexts,
working retry, unchanged saved sample content, and zero tracked resources after
route exit. Both frame cases and both initialization cases failed against the
old implementation. Existing repeated sample/loupe lifecycle tests also pass.
This measures explicit resource ownership and canvas configuration, not driver
resident memory. Multi-view concurrent failure, native particle-edge rendering
and the remaining complete-app acceptance gates remain open.

Final validation: 2,909 units, 503 browser cases (one intentional duplicate
skipped), and four production cases passed; production includes TypeScript and
Vite builds. No image baselines or tolerances changed. Logs:
`/tmp/gel-molecular-terminal-unit.log`, `/tmp/gel-molecular-terminal-full2.log`,
`/tmp/gel-molecular-terminal-production.log`. The first full browser run exposed
an overbroad test fault affecting the gel pipeline; injection now starts after
the gel initializes. Both isolated initialization cases were rechecked against
the old implementation and failed at the expected context-cleanup assertions.


## Particle raster audit — confirmed open discrepancy

Added [128 native particle images](../reference/native/modern/particle-scenes/README.md)
from the 64 existing independent mesh captures at DPR1/2. Both native mesh output
and CGL pixel captures repeat identically, and a separate verification run
matches all retained images. The native driver uses the application's MSAA4 and
Cinder's default straight-alpha source-over settings on opaque #F1F1F2.

The [dedicated browser audit](../reference/web/particle-scenes/README.md)
measures captured-native and web-generated meshes through the existing particle
batch renderers. For each backend and each DPR, 57/64 cases fail exact native
RGB comparison; maximum channel error is 157. All native/web mesh pairs produce
identical browser pixels, and both web backends produce identical pixels. This
isolates a rendering difference for these cases rather than a mesh-construction
difference. The web molecular surfaces currently have one sample.

All four dedicated audit tests intentionally remain failing parity gates; all
512 case/source/backend/DPR measurements completed. No tolerance or existing
image baseline was changed, and this increment changes no production renderer.
The prior normal-suite/production results therefore do not imply particle parity.
Next implement native multisampling/resolve with source-over, then certify shared
sample/loupe integration and transparent representatives separately. Native full
GUI, scheduling and composed-view acceptance remain open.


## Opaque molecular multisample correction

The [particle raster audit](../reference/web/particle-scenes/README.md) now passes
with exact native RGB for all 512 mesh/source/backend/DPR combinations. The
shared presentation gains explicit source-over mesh blending and an opaque
background parameter. Existing gel defaults remain additive and black.
SampleSimCanvas uses this path for opaque sample/loupe views, recreating owned
surfaces on backing-size changes and disposing them through its existing bounded
fallback/retry lifecycle. Transparent representatives retain the previous path
pending native compositing evidence.

Four additional component tests verify selected, hovered, multimer and narrow
particle fixtures through the actual shared canvas, frame subscription and mesh
builder at DPR1/2 on both backends. They passively record the acquired context to
exclude fallback masquerading as backend coverage. The low-level and component
checks are promoted into the normal browser suite, with the focused config kept
for reproducing the original audit.

The first integrated run passed 501 browser cases and failed only the two
strict degraded-particle snapshots, whose old edges reflected single-sample
rendering. Their diffs were inspected, then only those snapshots were regenerated
after independent native raster/component checks passed. Their 20-pixel tolerance
and every native reference remain unchanged. Independent code review found no
Critical/Important production issues; its passive-backend-probe suggestion was
applied. Full native composed GUI, transparent representatives, physical display
and release performance certification remain open.

Final verification: 2,909 unit tests, 511 browser cases (one intentional skip),
and four production cases passed, including TypeScript/Vite builds. Full browser
coverage includes the eight new particle cases, native direct/well/gel raster,
resource lifecycle, DPR, background colors and bounded failure recovery.
Logs: `/tmp/gel-particle-final-unit.log`, `/tmp/gel-particle-final-full.log`,
`/tmp/gel-particle-final-production.log`. The [review record](superpowers/reports/2026-10-10-particle-presentation.md)
retains scope and limitations.


## Representative compositor audit — architectural follow-up

Added [36 independent native representative-body images](../reference/native/modern/representative-scenes/README.md)
over the native gray well fill and white window background. Meshes and CGL pixels
repeat identically; a second invocation verifies retained pixels. Four dedicated
component audit tests finish all 72 comparisons, then fail exact parity: 16/18
cases differ per backend/DPR, maximum channel error 102.

An experimental transparent RGBA8 MSAA path reduces that maximum to 1 but still
fails 16/18 cases. It was reverted; [reports and the reproducible prototype patch](../reference/web/representative-scenes/README.md)
retain the evidence. No production renderer or tolerance changed. The successful
opaque particle correction therefore cannot simply be applied as a transparent
layer and claimed to have native compositing parity.

Next render the well underlay and representative on one native-style surface,
resolve once, and preserve transparency only where that native drawing contributes
nothing. This requires native rounded-fill/stroke/shadow and boundary-crossing
captures plus correct heading/child draw order. Native original GUI and complete
panel overlap/overflow remain open, alongside the other full release gates.
Validation for this reference increment: all 36 native images verified after
repeat mesh and CGL captures; baseline and prototype each completed 72 browser
comparisons and failed all four exact-parity tests as reported. After reverting
the prototype, all 2,909 unit tests passed. Production source matches `8d577da`;
no new full normal-browser/production result is claimed for this audit-only work.


## Fragment well and representative composition correction

The production fragment preview now draws the native rounded shadow, fill,
one-physical-pixel stroke and representative together on an RGBA8 MSAA4 surface.
A separate geometric coverage pass keeps untouched pixels transparent without
requantizing faint-particle alpha. Covered pixels resolve once against the known
white panel underlay and are then presented opaquely.

All **60 independent native RGB comparisons** pass across WebGPU/WebGL2 at DPR
1/2, including empty wells, degraded/multimer bodies, tiny fade and large particles
crossing the well boundary. A contrasting-background test also proves untouched
transparency and subquantum-fade coverage; an opaque-output mutation failed that
check on all four configurations. These tests now join the normal browser suite.
No native or existing regression screenshot was changed to obtain a pass.

Fresh verification: **2,909 unit tests, 515 browser cases (one intentional
duplicate skip), and four production root/subpath checks pass**, including the
TypeScript/Vite build. Logs: `/tmp/gel-fragment-unit.log`,
`/tmp/gel-fragment-full.log`, `/tmp/gel-fragment-production.log`.
The [evidence](../reference/web/fragment-well-scenes/README.md) and
[review](superpowers/reports/2026-10-10-fragment-composition.md) record exact scope.
The reviewer found no Critical/Important issue in the active path. One unused
API combination—cutout with separate gel-well lines—has a documented deferred
coverage limitation; no current caller uses it.

Heading/brace/control overlap, overflow beyond the panel canvas, original GUI
certification, cross-platform raster and performance remain open. The old
standalone transparent audit remains historical failing evidence of the rejected
composition strategy, not a test of the production FragmentWell path. Full P0–P5
gates remain open.


## Fragment overflow and heading order

Representatives now extend beyond the fragment panel, as native drawing permits.
The composite canvas expands once to window extent, with a translated logical
origin, and stays bounded to the window even for huge imported particle sizes.
It retains its element and resizes its backing buffers on DPR changes. The
heading now draws after the representative and before child controls.

Four production-component browser cases verify outside-panel pixels, visible
heading glyphs, stable bounded allocations, unchanged workspace scroll size,
DPR changes, and an exact native well crop after restoring a normal particle on
the expanded surface. The original panel clipping and old heading order each
failed their regressions. Review found unwanted scroll overflow from the initial
relative-positioned canvas; a failing scroll-size test led to absolute positioning
and now passes. See the [review record](superpowers/reports/2026-10-10-fragment-overflow.md).

Fresh checks: **2,909 unit tests, 519 browser cases (one intentional duplicate
skip), and four built-app production checks pass**. TypeScript/Vite build passes;
no reference pixels or screenshot goldens changed. Final logs:
`/tmp/gel-fragment-overflow-final-unit.log`,
`/tmp/gel-fragment-overflow-final.log`, and
`/tmp/gel-fragment-overflow-final-production.log`.

The white-underlay composition still needs correction/certification where a
translucent representative overlaps earlier non-white content, including braces
and other views. This increment proves overflow visibility and heading order,
not complete cross-view compositing or native GUI parity. Full P0–P5 remain open.


## Inspector transparency and brace stacking

Removed opaque full-panel backgrounds from Species, Buffer + Dyes and gel
settings, matching the pinned native draw methods. The brace now paints before
the inspector contents at their existing shared z-index. Native view insertion,
hit regions and keyboard ownership are unchanged.

A real image-drop workflow now shows the earlier image through empty Species
panel space while the panel still owns picking there. It failed with white pixels
before the correction on both backends. Four Stage/FragmentView checks at DPR1/2
also failed before the brace-order correction and now show exact opaque molecule
RGB over a previously visible brace pixel. These source-backed checks are not a
full native GUI or brace-sampling certification.

Fresh checks: **2,909 units, 525 browser cases (one intentional duplicate skip),
and four production checks pass**, including TypeScript/Vite build. Native and
regression goldens are unchanged. Logs: `/tmp/gel-inspector-layering-unit.log`,
`/tmp/gel-inspector-layering-final.log`, `/tmp/gel-inspector-layering-production.log`.
The [scope record](superpowers/reports/2026-10-10-inspector-layering.md) retains
limitations. Translucent representative composition over earlier non-white
content remains open, along with full P0–P5 acceptance.


## Shared composition: ordered mesh operations

The presentation backends now support per-layer affine transforms, explicit
source-over/additive blending, physical scissoring, and line strips. They retain
one multisample surface/resolve and the old caller interfaces. Clipping is reset
before later unscissored operations and legacy well lines. Explicit additive
operations require an opaque surface; transparent FragmentWell defaults stay
source-over.

Ten independently repeated/reverified native CGL images cover five constructed
scenes at DPR1/2. All 20 comparisons match exact RGB on WebGPU/WebGL2. The four
original browser tests failed before implementation; the empty scene already
matched. Four unit checks cover transformed coordinates, bounds and invalid
scissors, and the unsupported transparent/additive combination.

Fresh results: **2,913 units; 529 normal browser cases, one intentional duplicate
skip; four production checks and TypeScript/Vite build pass**. The separate
shared-surface proof also still passes all 32 exact comparisons.
[Evidence](../reference/web/ordered-mesh-scenes/README.md).

This completes only the mesh portion of shared-composition Task 1. Texture
operations, ordered app registration and native control/text migration are still
pending; the app continues to use separate view canvases. The earlier production
edge/solid exact audits were not rerun here and remain open, not superseded by
these API tests. Full P0–P5 acceptance is unchanged.


## Shared composition: ordered texture operations

The existing presentation APIs now accept an ordered scene containing meshes and
borrowed textures, with explicit UVs, tint, straight/premultiplied alpha,
filtering, mip selection, addressing and UNORM color interpretation. New scenes
default to native source-over; legacy direct-band callers keep additive defaults.
Both backends retain one MSAA surface and resolve, with cached draw resources and
explicit caller ownership of input images.

Ten repeated/reverified standalone native CGL images cover five texture scenes
at DPR1/2. All 20 WebGPU/WebGL2 comparisons match exact RGB. Two lifecycle tests
cover successful draws, sampler allocation failure, disposal and reuse of the
borrowed image. Diagnostic mip levels are supplied inputs: these tests do not
certify native image decoding, automatic mip generation or font rasterization.
[Evidence and limits](../reference/web/ordered-texture-scenes/README.md).

A full-suite failure exposed an ownership error in the cancellation test: it
counted the replacement direct renderer's valid texture as cancelled effects
work. Delaying the shared presentation import reproduced it. The corrected test
covers both import timings; removing the production cancellation guards makes
all four variants fail, and restoring them passes twelve repeated focused cases.
No production lifecycle change was necessary.

Final verification for this increment: **2,913 units, 537 normal browser cases
(one intentional duplicate skipped), four built-app checks, and TypeScript/Vite
build pass**. The shared-surface proof retains all 32 exact comparisons. Task 1's
ordered API is implemented and verified; Tasks 2–4 and final whole-branch review
remain. No original GUI, platform or full parity gate closes from these results.

## Shared composition: first app view contributions (development only)

The live sample body/shadow/particles and fragment well/representative now
contribute ordered geometry to one window canvas behind an internal development
switch. Their existing DOM input elements remain; these views no longer acquire
separate graphics contexts in shared mode. Presentation runs after the existing
React `flushSync` commit and reads current root coordinates and store view order.
Production builds explicitly ignore the migration flag.

The actual FragmentWell component matches12 native edge comparisons exactly
with a registered geometric underlay. Same-frame open/remove tests verify the
committed DOM and unchanged molecular parts/ticks/local seed/global RNG; moving
presentation before commit makes both backend tests fail. Movement, scrolling,
DPR/resize, initialization fallback and late-import retirement also pass.
[Evidence and limitations](../reference/web/shared-view-scenes/README.md).

Task2 remains open: certify real sample/fragment native overlap, full SampleView
first-open measurement, loss/recovery and bounded allocations. Gel, loupes,
images, text, controls and frames have not yet migrated. A moved sample crossing
the old gel canvas still demonstrates incorrect mixed-boundary ordering. Neither
these component comparisons nor the development switch close production parity.

Verified for this development integration increment: **2,916 units, 549 browser
cases (one intentional duplicate skipped), four production checks, and
TypeScript/Vite build pass**. No native references or tolerances were changed.
Task2 and the full parity/release gates remain open.


## Shared sample/fragment first-frame and lifecycle gates

Full SampleView coverage found that passive size measurement omitted its body
from the first shared frame. Measuring during layout fixes the two failing
backend cases, keeping sample and inspector contributions in the same committed
frame without changing engines or random state.

Five new static native sample/fragment overlap scenes at DPR1/2 cover clipped
ordinary particles, the unclipped representative, fractional coordinates and
both view orders. All20 WebGPU/WebGL2 RGB comparisons match exactly. Ten native
captures were repeated and independently reverified. Source-backed CGL evidence
covers these body contributions; it does not certify complete original GUI paint.

Six lifecycle checks pass: repeated device/context loss preserves the engine and
frozen image; resize maintains stable live resource counts; route exit retires
owned resources to zero; allocation failure and retry preserve the engine; late
device acquisition ignores a retired canvas. A deliberate cleanup omission makes
both allocation checks fail. GPU driver-resident memory remains a release gate.
[Reference and limits](../reference/web/shared-view-overlap/README.md).

Final verification: **2,916 units, 559 browser cases (one intentional duplicate
skipped), four production checks and TypeScript/Vite build pass**. Shared-
composition Task2 is implemented and verified; final whole-branch review remains
at the end of Task4. Task3 migrates gel/loupe/image graphics, and Task4 migrates
ordered chrome/text/frame paint before production changes. Full parity remains open.


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
