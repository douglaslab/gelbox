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
