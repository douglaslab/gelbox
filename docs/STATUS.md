# Gelbox web port — current status

_Last reviewed: 2026-10-09 · implementation baseline `2f3021d` · native reference `5f51097`._

## Direction

Shawn confirmed: **strict native behavior and visual parity first; improvements afterward. Finish the web app first; reconsider Rust/native only for a concrete need.**

The replacement strategy is in [ROADMAP.md](ROADMAP.md). The source-backed gap inventory is in [PORT-AUDIT.md](PORT-AUDIT.md). The old M1–M27 plan is historical, not the current completion contract.

## What exists

A working TypeScript/React application under `ts/`, with pure gel simulation, WebGPU and WebGL2 gel renderers, three-panel editing UI, live molecular simulation, and synthetic-sample loupes. Historical implementation milestones reached M26a in June 2026. This is substantial reusable work, but native parity is not complete or independently certified.

- Renderer/simulation: mobility, diffusion, smears, aggregation, dyes, well damage, mesh particles, and global-warp implementations exist. The main gel canvas does **not** wire running-buffer global warp into the renderer.
- UI: sample/species/gel panels, many sliders, band resize/clone, tube move/clone, and cross-panel selection/hover exist. Missing native workflows and deliberate/accidental behavioral differences remain.
- Molecular view: live engine, multimer clusters, slice meshes, dye backgrounds, and selection outlines are implemented. Degradation wholeness ranges/filtering still diverge from native.
- Loupes: live synthetic content and multiple fixed popups exist. Native dragging, callout geometry, hover preview, source-selection ancestry, and full positioning behavior remain incomplete.
- Files: native Gelbox JSON import/export now exists, preserving sample metadata and scientific fields. Legacy web formats remain readable. A native → web codec → native ladder roundtrip preserved every JSON field. Open/Save commands are mounted in a bottom-left popup; native XML palette import and targeted sample drops are implemented. Native shell geometry, render/hover settings, and broader interchange coverage remain open.

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

P0 reference work and P1 file compatibility are underway; P2–P5 have not started.

| Increment | Deliverable | Current status |
|---|---|---|
| P0 | Runnable native reference, captures, effective configuration, parity ledger | In progress |
| P1 | Native application shell and compatible file/edit/save workflow | In progress: JSON codec |
| P2 | Native editing, identity/selection, panel and control behavior | Planned |
| P3 | Independently verified numerical and rendering fidelity | Planned |
| P4 | Complete native loupes and reference images | Planned |
| P5 | Browser reliability, production-build verification, parity release | Planned |

The next action is to complete P0 provenance and scenario coverage, then begin P1 file compatibility and shell workflows. See ROADMAP for dependencies and exit gates. No application code was changed as part of this strategy review.

## Historical records

The previous status narrative, including original milestone counts and now-stale assertions, is preserved in [archive/STATUS-pre-2026-10-09.md](archive/STATUS-pre-2026-10-09.md). Historical plans/specs remain under `superpowers/`; consult them for implementation rationale only. Their claims of complete phases, future Rust phases, placeholder molecular rendering, bloom, or image inference do not supersede the new roadmap.

## Current implementation checks

After the JSON codec changes: 36 unit files / 309 tests pass; typecheck and production build pass. Vite reports existing mixed static/dynamic import warnings. Native GUI Open and Save Gel verified semantic equality for the ladder roundtrip; this is one interchange scenario, not complete file-format certification.

File workflow increment: native JSON/Open/Save, XML palettes, malformed XML preservation, actual file chooser, empty-lane placement and startup selection availability are exercised in browser tests on both backends. Unsafe legacy XML multimer indices are rejected because native writes out of bounds; use JSON for these samples. This remains an explicit parity edge-case decision, not certified equivalence. When all visible lanes are occupied, the web app reports an error; native calls an unimplemented off-gel icon function.

Final file-workflow verification: 309 unit tests pass; 116 browser tests pass across both backends, with the two pre-existing narrow-reflow cases skipped; typecheck and build pass. The old drop test now verifies preserving lane 0 and placing the imported sample in lane 1.
