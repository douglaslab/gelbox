# Native parity audit

_2026-10-09 · Source audit of `gel` `2f3021d` against `gelbox` `5f51097`._

This is the seed for the P0 parity ledger in [ROADMAP](ROADMAP.md), not a claim that the entire native application has been run or exhaustively characterized. Native behavior below is source-backed unless a runtime result is explicitly stated. Complete the native captures and scenario IDs in P0 before certifying strict parity.

## Existing verification

On this macOS workspace, using the project's Node 22 runtime: typecheck/build passed; 35 unit files / 285 tests passed; Chromium WebGL2 and WebGPU each passed 52 tests with 1 intentionally skipped narrow-layout test. These checks were run during the 2026-10-09 review before documentation changes. They use the TS implementation's own fixtures and image baselines. The C++ application was not built or run during the review.

## Initial inventory

| Capability | Current finding | Source anchors | Owning increment |
|---|---|---|---|
| Native baseline | Source/tuning available; runtime/capture provenance not established | `../gelbox/xcode/`, `../gelbox/assets/tuning/`, `../gelbox/include/Config.h` | P0 |
| Startup/layout | Web adds header/tabs/footer; panel geometry/lifecycle differs from the native target | `ts/src/components/AppLayout.tsx`, `stage/Stage.tsx`; native `GelboxApp.cpp`, `GelView.cpp`, `Layout.h` | P1/P2 |
| Typography | Inter used; native uses Avenir | `ts/src/lib/layout/layout.ts`; native `Layout.h` | P0/P2 |
| Save/Open | Implementation exists but `FileControls` is unmounted; native shortcuts absent | `ts/src/components/chrome/FileControls.tsx`, `routes/GelPage.tsx`; native `AppSettingsView.cpp`, `GelboxApp.cpp::keyDown` | P1 |
| Native JSON | Web accepts only `gel-sample-v0` / `gel-state-v0`; incompatible with native wrapper/fields | `ts/src/lib/gel/serialize.ts`; native `GelboxApp.cpp::wrapJsonToSaveInFile`, `Sample.cpp::toJson`, `Gel.cpp::toJson` | P1 |
| Native sample XML | No web importer; bundled native ladder is XML | Native `Sample.cpp`, `assets/palette/1kbladder.xml` | P1 |
| Sample metadata | Native names/icon/id fields absent from current web Sample type | `ts/src/lib/sim/sample.ts`; native `Sample.h`, `Sample.cpp` | P1 |
| Import validation | Checks schema tag but casts nested fields without structural validation | `ts/src/lib/gel/serialize.ts::deserializeFile` | P1 |
| Dropped samples | Web loads into selected lane; native uses drop position/first empty lane | `routes/GelPage.tsx::onDrop`; native `GelboxApp.cpp::load`, `pickLaneForDroppedSample` | P1/P2 |
| Species creation/deletion | No app/reducer path; native add button, right-click creation, delete keys exist | `lib/gel/gelState.ts`, `components/sample/SampleView.tsx`; native `SampleView.cpp::newFragment`, `keyDown`, `GelView.cpp::newFragmentAtPos` | P2 |
| Empty tube | Web only selects empty lane; native creates a sample for its sample view | `components/gel/MicrotubeRow.tsx`; native `GelView.cpp::openSampleView` | P2 |
| Sample movement | Web swaps occupied destinations, cloning overwrites; off-gel coordinates clamp to a lane | `lib/gel/gelState.ts::MOVE_SAMPLE`, `CLONE_SAMPLE_TO_LANE`, `components/gel/MicrotubeRow.tsx`; native `GelView.cpp::mouseDragSample` | P2 |
| Band movement | Web changes bases within original lane; missing cross-lane transfer and native pointer offset | `components/gel/GelOverlay.tsx`; native `GelView.cpp::mouseDragBand` | P2 |
| Aggregate-aware inverse solve | Web solver uses first returned band; native drag carries picked aggregate tier | `lib/sim/solver.ts`, `components/gel/GelOverlay.tsx`; native `GelView.cpp::mouseDragBand` | P2/P3 |
| Overlap picking | Web SVG order determines hit target; native chooses smallest band UI-rect height | `components/gel/GelOverlay.tsx`; native `GelView.cpp::pickBand` | P2 |
| Dye selection/drag | Web generic fragment selection/solver path; native opens sample settings and skips DNA resizing | `components/inspector/InspectorPanel.tsx`, `GelOverlay.tsx`; native `SampleView.cpp::showFragmentEditor`, `GelView.cpp::mouseDragBand` | P2 |
| Selection identity | Multiple overlapping selection fields; lane/index references and no synthetic ancestry | `lib/gel/gelState.ts`, `sampleFragRef.ts`, `components/sample/MolecularSimCanvas.tsx`; native `SampleFragRef` | P2/P4 |
| Lane reduction | Web truncates samples; native retains storage when shrinking layout | `gelState.ts::SET_NUM_LANES`; native `Gel.cpp::setLayout` | P2 |
| Buffer controls | Web sample sliders enabled; gel off-preset changes ignored; native sliders disabled by default | `components/inspector/BufferView.tsx`, `GelSettingsView.tsx`; native `Config.h::mEnableBufferSlides`, `BufferView.cpp` | P2 |
| Rotation | Web enables CSS rotation; native control disabled | `GelSettingsView.tsx`, `routes/GelPage.tsx`; native `GelSettingsView.cpp` | P2 |
| Time display | 180-minute scale matches native tuning; old STATUS claimed 4h in a stale note | `TimelineSlider.tsx`; native `assets/tuning/gel-sim.json` | P2 |
| Forward gel simulation | Substantial TS implementation/unit coverage; independent native differential corpus absent | `lib/sim/gelSim.ts`, `mobility.ts`, `geometry.ts`; native `GelSim.cpp` | P3 |
| H₂O global effect | Both backends implement it; main `GelCanvas` never calls `setGlobalWarp` | `components/gel/GelCanvas.tsx`, `lib/gel/render.ts`, `render-gl.ts`; native `Gel.cpp::getRenderGlobalWarp` | P3 |
| Sample-buffer physics | Native experimental mobility branch disabled; do not enable it as a parity fix | Native `GelSim.cpp::calcDeltaY` `if ((0))`; `lib/sim/mobility.ts` | P3 |
| Molecular renderer | GPU mesh/background paths, selection outlines, multimer clusters implemented; current goldens are TS-only | `lib/sim/molecularSimMesh.ts`, `molecularSimBackground.ts`, `components/sample/SampleSimCanvas.tsx` | P3 |
| Degradation | Web collapses wholeness range and substitutes loupe filter scaling | `lib/sim/molecularSimEngine.ts::setSample`; native `MolecularSim.cpp::setSample` | P3 |
| Extra degrade modes/bloom | Not missing production features: shrink/randomdrop disabled; no native bloom shader | Native `MolecularSim.cpp::Part::makeMesh`; historical M24/M25 findings | Out of parity scope |
| Loupe content | Synthetic sample + live particles implemented (M26a); source selection not wired | `lib/sim/sampleFromGel.ts`, `components/gel/Loupe.tsx`, `LoupePortalLayer.tsx` | P3/P4 |
| Loupe positioning/interaction | Fixed popup; no wedge/anchor drag modes/hover preview; Cmd-click background doesn't open | `components/gel/Loupe.tsx`, `GelOverlay.tsx`; native `SampleView.cpp`, `GelView.cpp` | P4 |
| Loupe seed | Web seed omits native gel-time contribution | `components/gel/Loupe.tsx`; native `GelView.cpp::updateGelDetailViewContent` | P3/P4 |
| Images | No reference-image view; native loads images for viewing, not sample inference | Native `GelboxApp.cpp::load`, `ImageView.cpp`; web `routes/GelPage.tsx` | P4 |
| App render/hover settings | Native toggles not reproduced in an app settings menu | Native `AppSettingsView.cpp`; web `AppLayout.tsx`, `GelPage.tsx` | P1/P4 |
| Narrow windows | Web hides sample/inspector; responsive test skipped; native resize behavior still needs capture | `components/stage/Stage.tsx`, `tests/visual/stage.spec.ts` | P0/P2 |
| Backend acquisition/loss | Main gel picks by API presence; failures logged, not alternate-backend recovery | `lib/gel/backend.ts`, `components/gel/GelCanvas.tsx`, `lib/gpu/device.ts` | P5 |
| Lifecycle/DPR | Async setup/disposal and DPR-change paths need dedicated coverage | `components/gel/GelCanvas.tsx`, `lib/gpu/surface.ts`, `SampleSimCanvas.tsx` | P5 |
| Production hosting | Vite uses relative base but assets use absolute `/assets/` URLs; subpath must be verified | `vite.config.ts`, `lib/layout/assets.ts`, component image URLs | P5 |
| CI claim | Linux tests skip WebGPU; current suite does not certify native parity or browser breadth | `.github/workflows/ci.yml`, `ts/playwright.config.ts` | P5 |

Source anchors without a leading `ts/` in the table refer to paths under `ts/src/`; native filenames refer to `../gelbox/src/` or `../gelbox/include/` as appropriate.

## Required ledger record for each reference scenario

P0 expands each row into: stable scenario ID; native revision/build/config; starting file or fixture; ordered real user actions; expected document/selection/focus/view state; native numeric/capture artifacts; web test/artifacts; comparison tolerance and rationale; current discrepancy; status (`unverified`, `verified`, or `accepted deviation`); and the explicit decision for any deviation. An implementation checkbox is not a verification status.

The initial inventory is deliberately not assigned completion percentages. Some small-looking omissions affect the whole application; a native run may uncover additional behavior not represented in the old milestones.
