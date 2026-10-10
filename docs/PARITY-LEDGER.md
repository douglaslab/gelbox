# Current parity acceptance ledger

Reviewed against the worktree at `e8cc60d`, 2026-10-10. This replaces the initial
findings in [PORT-AUDIT](PORT-AUDIT.md) as the current evidence index. The
[ROADMAP](ROADMAP.md) remains the completion contract. The web app is not yet
fully accepted. No percentage is assigned to this mixed set of requirements.

The strategy remains targeted restoration of the TypeScript/React application,
with shared WebGPU/WebGL2 presentation. The audited evidence does not justify
another rewrite or a Rust migration. Most original omissions are implemented;
the remaining work is specific reference/interaction coverage, platform
validation, and explicit decisions about known native defects and boundaries.

## How to read the records

**Verified** means the stated bounded scenario or comparison is proved by the
linked retained evidence. **Unverified** means implementation/regression evidence
exists but the required independent replay or acceptance is incomplete.
**Decision open** is unverified, not an accepted deviation. **Excluded** identifies
disabled native experiments or claims outside the agreed release scope.
No broad capability is certified solely because its web tests pass.

Common reference authority: Gelbox `5f5109705279085fcf6bcac6c8be1c9806b6d3d6`,
its effective assets/tuning/defaults, and the build/configuration hashes in each
linked native manifest. [Modern native reconstruction][modern] uses compatibility
patches and a pinned existing Cinder library; it is not asserted equivalent to
the original release. [Original release observations][release-replay] identify
binary SHA `037514b…a7`, client1365×768, DPR2; their CUA screenshots are visual
observations, not lossless pixel goldens. Numerical adapters retain the pinned
methods but have the explicit scope described in [the corpus][numeric].

Scenario IDs below are stable acceptance records, not new fixture names. Starting
files, ordered actions, expected state and exact assertions are those in the
linked test and native dossier. For source-backed rows without an independent
native action trace, that missing trace is the discrepancy, not a fictional
capture. Complete-window RGB comparisons require zero differing RGB bytes;
particle inputs are frozen/replayed where stated. Numeric tolerances and native
JSON quantization belong to their linked corpus, not a universal image tolerance.

## Original inventory, reconciled

| ID | Original audit capability | Current scenario and authoritative evidence | Acceptance / remaining action |
|---|---|---|---|
| A01 | Native baseline | Pinned source/config/assets reconstruct and build; modern native captures repeat; original release executable and UI observations retained. [Build dossier][modern], [release provenance][release-replay]. | **Unverified:** establish original-release/modern-build equivalence for the acceptance scenario set, including clipping/JSON/palette differences. Do not require equivalence for every possible input. |
| A02 | Startup/layout | Startup, selected sample/species, settings/menu, image/loupe overlap windows compared at1365×768/DPR2. [Startup][startup], [populated windows][populated], [controls][controls], [overlap][overlap]. | **Verified** for these controlled states on both renderers. Other resize/history states are A33 and W01–W05. |
| A03 | Typography | Native UIFont atlases and2,048 ASCII string placements; shared text/control captures; locale regression. [Text][text], [font provenance][fonts], [locale test](../ts/tests/visual/native-label-locale.spec.ts). | **Verified** for captured numeric/control text. **Decision open:** distribution/font policy and non-ASCII/platform scope; do not call a fallback font equivalent. |
| A04 | Save/Open | Mounted menu/shortcuts; import/edit/download; native reader and original GUI reopen; shipping Safari picker/download. [Sample interop][sample-files], [gel interop][gel-files], [Safari][safari], [file tests](../ts/tests/visual/files.spec.ts). | **Verified** for retained sequences; W01 must consolidate full composed workflow acceptance. |
| A05 | Native JSON | Native sample/gel constructors, null collections, object-form release files, exact supported fields, native reader quantization. [Interop][gel-files], [release writer defect][writer-defect]. | **Decision open D01:** web writes lane-preserving arrays rather than reproducing native data loss. Missing-Samples safe extension and malformed coercion boundary also need a recorded disposition. |
| A06 | Native sample XML | Pinned constructor fixtures for fields/defaults/ignored children/empty sample; actual file UI rejects declarations/unsafe aggregate indices. [XML](../reference/native/files/interop/xml/README.md), [test](../ts/tests/visual/native-xml-interop.spec.ts). | **Verified** for native dialect corpus. General XML and native gel XML export are not requirements. |
| A07 | Sample metadata | Unicode name, icon, scale, signed ID, dyes, aggregates and buffers preserved through edit/save/native reread. [Sample interop][sample-files], [test](../ts/tests/visual/native-file-interop.spec.ts). | **Verified** for retained mixed sample; native float/token conversion is explicit. |
| A08 | Import validation | Structural validation; malformed JSON/XML leaves current document intact; partial multi-file successes preserved. [File tests](../ts/tests/visual/files.spec.ts), [image/file sequence tests](../ts/tests/visual/reference-images.spec.ts), [serialization units](../ts/tests/unit/serialize.test.ts). | **Bounded verification:** native JSON/XML and legacy nested validation are covered. Legacy imports normalize native geometry and reject malformed data before replacement; [retained evidence](../reference/web/legacy-import/README.md). Paired native file workflow remains W01; malformed-input differences remain D01. |
| A09 | Dropped samples | Empty/drop lane selection, pending drop/Open order, replacement layout before following sample. [File tests](../ts/tests/visual/files.spec.ts), [mixed batch tests](../ts/tests/visual/reference-images.spec.ts); native `GelboxApp::load` contract in [image reference][numeric]. | **Unverified:** native composed replay for occupied/all-full drop paths and ordered mixed batch. Include in W01. |
| A10 | Species creation/deletion | Empty sample/add/edit/delete-final, right-click creation, Alt clone, Tab/deselection. [Tests](../ts/tests/visual/species-editing.spec.ts), [compiled runtime reference][runtime], [runtime UI](../ts/tests/visual/runtime-integration.spec.ts). | **Unverified** as a complete native GUI editing sequence; component/model rules and web actions checked. W02. |
| A11 | Empty tube | Tube selection creates the native empty sample and enables add/save; repeated click closes panel. [Species tests](../ts/tests/visual/species-editing.spec.ts), [tube tests](../ts/tests/visual/tube-drag.spec.ts). | **Unverified** native end-to-end replay; include creation and final deletion in W02. |
| A12 | Sample movement | Original release selected degraded multimer + hover + tube lane move preserves exact document and focus. [Release replay][move], [web replay](../ts/tests/visual/native-composed-move.spec.ts); clone/gutters/off-gel [tests](../ts/tests/visual/tube-drag.spec.ts). | **Verified** retained move sequence; **unverified** native clone/occupied/off-gel branches. W02. |
| A13 | Band movement | Continuous transfer, gutters, Shift lock, temporary sample cleanup, dye merge, cancel/capture loss. [Tests](../ts/tests/visual/band-transfer.spec.ts), native `GelView::mouseDragBand` source. | **Unverified** native composed transfer/clone replay. W02/W04; web expected-value tests are not independent GUI traces. |
| A14 | Aggregate-aware inverse solve | Native solver corpus and real web multimer/tied-tier/clone drag tests with native offset/tier. [Numerical corpus][numeric], [drag test](../ts/tests/visual/band-solver.spec.ts), [units](../ts/tests/unit/nativeSolver.test.ts). | **Verified** corpus/solver integration; unusual-voltage/time composed native drag is W04. |
| A15 | Overlap picking | Native minimum UI-height/tie-order rule and web pointer tests. [Test](../ts/tests/visual/band-picking.spec.ts), [particle picking corpus][numeric], [units](../ts/tests/unit/nativePicking.test.ts). | **Unverified** native full GUI overlapping-band replay; add tied/unequal overlap to W04. |
| A16 | Dye selection/drag | Dye controls/disabled buffer state, source rules, merge/clone retaining DNA fields. [Dye paint](../reference/web/shared-dye-scenes/README.md), [transfer tests](../ts/tests/visual/band-transfer.spec.ts), [inspector](../ts/tests/visual/inspector-wiring.spec.ts). | **Verified** controlled paint; **unverified** native composed dye transfer/release sequence. W02. |
| A17 | Selection identity |28 compiled native ownership/raw-index observations; retained sample identity, off-document selection, clone independence, loupe origin selection. [Native identity][numeric], [web identity](../ts/tests/visual/sample-identity.spec.ts), [loupe selection](../ts/tests/visual/loupe-selection.spec.ts). | **Verified** native model observations; cross-view move/clone/delete history still W02. No invented stable species IDs. |
| A18 | Lane reduction | Web retains hidden samples/selection/engine; visible-only save and restore tests. [Files](../ts/tests/visual/files.spec.ts), [combined hidden-lane test](../ts/tests/visual/shared-hidden-lane.spec.ts), native `Gel::setLayout`. | **Unverified** native composed reduce/edit/save/restore replay. Existing combined test injects store setup; W03 must use actual controls. |
| A19 | Buffer controls | Exact40 native paint comparisons, disabled concentration rows, preset press timing/focus, custom notches. [Evidence](../reference/web/shared-buffer-scenes/README.md), [compiled workflow][compiled]. | **Verified** bounded control cases. Imported-document/open-panel interaction joins W01; live loupes/recovery joins W05. |
| A20 | Rotation | Disabled under native defaults; imported/off-preset settings checks retain disabled state. [Gel settings test](../ts/tests/visual/gel-settings.spec.ts), [files test](../ts/tests/visual/files.spec.ts). | **Verified** disabled-state contract. Enabling rotation is excluded from this release. |
| A21 | Time display | Native180-minute mapping; exact slider text/geometry and gesture endpoints0:18/3:00. [Slider evidence](../reference/web/shared-slider-scenes/README.md), [native gesture](../reference/native/modern/performance-interaction/README.md). | **Verified** captured mapping/gesture. |
| A22 | Forward gel simulation |509 band/setup cases,2,909 inverse requests,137 exact-byte warp cases; source/tuning extraction and independent native outputs. [Corpus][numeric], [numeric units](../ts/tests/unit/nativeNumerical.test.ts), [warp units](../ts/tests/unit/nativeWarp.test.ts). | **Verified** named case matrix and recorded tolerances. Scientific accuracy beyond native-model parity is excluded. |
| A23 | H₂O global effect | Actual settings UI routes buffer to both renderers; CPU warp bytes/native raster references. [UI test](../ts/tests/visual/buffer-rendering.spec.ts), [warp integration](../ts/tests/visual/native-warp-integration.spec.ts), [compiled workflow][compiled]. | **Verified** focused wiring/render cases; W05 covers combined failure/recovery. |
| A24 | Sample-buffer physics | Experimental native branch remains disabled; buffer metadata preserved independently. [Initial source anchor](PORT-AUDIT.md), [interop][sample-files]. | **Excluded:** do not enable experimental chemistry. Verify this invariant in any future numerical change. |
| A25 | Molecular renderer | Native lifecycle/picking/mesh corpus, controlled particle frames, representative and whole sample/species windows. [Corpus][numeric], [particle paint](../reference/web/particle-scenes/README.md), [populated windows][populated]. | **Verified** finite native state/mesh/raster cases. Original-release orchestration coverage remains A01/W02. |
| A26 | Degradation | Native wholeness, narrow slices, degradation filters, native clipping quirks; particle cases include paused detail behavior. [Corpus][numeric], [degraded browser test](../ts/tests/visual/degraded-particles.spec.ts). | **Verified** named numerical/mesh cases. Degraded multimer GUI drag is W04. |
| A27 | Extra degrade modes/bloom | Native shrink/randomdrop experiments disabled; no native bloom requirement. [Initial audit](PORT-AUDIT.md). | **Excluded**, not missing features. |
| A28 | Loupe content | Native synthetic samples, source ancestry, live source changes; real web source selection with three buttons. [Corpus][numeric], [selection tests](../ts/tests/visual/loupe-selection.spec.ts), [shared overlap][overlap]. | **Verified** scoped model/render/selection cases; source editing with multiple views joins W02/W05. |
| A29 | Loupe positioning/interaction | Empty background creation, frame/anchor/wedge, hover preview, close/delete/focus, multiple buttons and resize. [Tests](../ts/tests/visual/loupe-interactions.spec.ts), [hover](../ts/tests/visual/hover-loupe.spec.ts), [compiled workflow][compiled], [native paint](../reference/web/shared-loupe-scenes/README.md). | **Verified** captured paint and compiled web actions; full matching native action trace for all drag branches remains W02. |
| A30 | Loupe seed |1,280 exact seed probes and refreshed/paused low-population cases, retained global/local streams. [Corpus][numeric], [runtime][runtime], [loupe units](../ts/tests/unit/nativeLoupe.test.ts). | **Verified** named seed/lifecycle cases; no requirement to enumerate unlimited stochastic histories. |
| A31 | Images |24 compiled native gesture cases; exact PNG scene/mip comparisons; web PNG/JPG/GIF first-frame, ordering, disposal and file-batch checks. [Image paint][images], [interaction tests](../ts/tests/visual/reference-images.spec.ts), [native methods][numeric]. | **Unverified:** independent native JPG/GIF decoder cases and supported color/orientation boundaries. W06. Controlled PNG composition is verified. |
| A32 | App render/hover settings | Native settings/menu full windows, Render on/off overlap, Help target and owned-release button rules. [Controls][controls], [direct overlap](../reference/web/shared-overlap-direct/README.md), [Help test](../ts/tests/visual/help.spec.ts). | **Verified** recorded control/workflow cases; original-release equivalence stays A01. |
| A33 | Narrow windows | Fixed panels retained; positive resize shifts and shared projection at unchanged physical size tested. [Stage test](../ts/tests/visual/stage.spec.ts), [projection test](../ts/tests/visual/shared-window-projection.spec.ts). | **Unverified:** matching native narrow/large-window replay and physical-display scale transitions. W07. |
| A34 | Backend acquisition/loss | Fallback, failed adapter/device/setup, repeated loss, terminal error/retry, late setup retirement covered. [Acquisition](../ts/tests/visual/renderer-acquisition.spec.ts), [loss](../ts/tests/visual/renderer-loss.spec.ts), [shared lifecycle](../ts/tests/visual/shared-scene-lifecycle.spec.ts). | **Verified** development integration cases. W05 carries these into one compiled multi-step workflow. |
| A35 | Lifecycle/DPR | Compiled hidden/frozen recovery,100-cycle view churn per backend, native/web workload and performance budget. [Resume][resume], [churn][churn], [budget][budget]. | **Verified** bounded checks; physical monitor, OS sleep/long suspension, resident-memory and unexplained preliminary native capture failure remain W07/W08. |
| A36 | Production hosting | Compiled root/subpath assets, files, shared renderer ownership,22 Chromium cases/216 exact RGB comparisons. Firefox/WebKit10-case workflow suites, shipping Safari UI/save observations. [Production][production], [compiled compatibility][compiled], [Safari][safari]. | **Verified** recorded macOS paths. Do not advertise other OS or cross-browser native pixel equality. Publication is a separate action. |
| A37 | CI claim | Linux remains regression coverage, not native/GPU certification. Named macOS commands/evidence and measured hardware profile exist. [Production][production], [budget][budget], [CI](../.github/workflows/ci.yml). | **Verified** bounded reporting policy; final release run and user review remain W09. |

## Additional explicit roadmap contracts

These requirements extend the original37-row inventory and must not disappear
merely because it lacked a separate row for them.

| ID | Contract | Current evidence / remaining action |
|---|---|---|
| R01 | General slider/aggregate-graph mappings, ranges, quantization, notches, presets, labels, disabled states, pointer ownership and focus | [128 exact slider paint comparisons](../reference/web/shared-slider-scenes/README.md), [native geometry/gesture contract](../reference/native/slider-controls/README.md), [slider gestures](../ts/tests/visual/slider-gestures.spec.ts), [graph accumulated edits/presets](../ts/tests/visual/graph-gestures.spec.ts), [secondary buttons](../ts/tests/visual/slider-secondary.spec.ts). **Verified** bounded paint and web regression; **unverified** native composed interaction replay. W02 must include handle-versus-track offset, endpoint/notch/quantization, graph multi-column edits and presets, release-outside/cancel and focus-to-Tab/Delete. |
| R02 | Continue legacy `gel-sample-v0`/`gel-state-v0` imports; validate before replacement; explicit native layout conversion | **Verified within tested scope:** [decoder](../ts/src/lib/gel/legacyFile.ts) validates fresh nested objects, preserves scientific inputs/metadata/hidden slots, normalizes visible lanes to 7–20 and rebuilds native layout context. [Unit cases](../ts/tests/unit/legacyFile.test.ts) and [compiled browser cases](../ts/tests/production/legacy-files.spec.ts) cover conversion and malformed-file preservation on both backends. [Red/green evidence](../reference/web/legacy-import/README.md). Paired original-native W01 remains open. |
| R03 | Separate document, view identity and derived simulation/render state; synchronous shared commands; coordinate consistency | [GelStore](../ts/src/lib/gel/gelStore.ts), [compiled runtime reference][runtime], [identity tests](../ts/tests/visual/sample-identity.spec.ts), [projection regression](../ts/tests/visual/shared-window-projection.spec.ts). Existing source/regressions support the implemented boundary. W02/W03/W05 verify the externally observable cross-view invariants; no wholesale reducer/engine rewrite is required by this contract. |

## Finite remaining acceptance work

Each package has a stopping condition. Do not expand these into an unlimited
requirement to prove every RNG history or every possible input. If replay exposes
an actual discrepancy, fix it with a failing regression and rerun affected gates.

| Package | Ordered scenario / required artifact | Completion evidence |
|---|---|---|
| W01 — file workflow | Native mixed gel/sample → web Open/drop → edit species and buffer with panels open → Save → reopen in original native. R02 legacy validation/layout conversion is verified; include occupied/all-full sample drop and pending mixed-file batch. Start from retained interop fixtures. | Paired action/state logs, downloaded files, native reread/visible state and compiled web replay. Resolve stale imported-buffer panel observation and D01. |
| W02 — editing and shared state | Empty tube → add/delete-final; selected sample + persistent loupes → tube move/Alt clone/occupied/off-gel; species/band clone/delete; dye merge; source/loupe selection and all three loupe drag modes; R01 slider/graph mappings, gestures, presets and focus. | Native handler/GUI traces with document, selection, focus, panel/view identities at each checkpoint; matching compiled web actions. Reuse existing lower-level cases rather than rewrite engines. |
| W03 — hidden lanes | Populate lane12 → select species/open loupe → reduce to7 → edit hidden selected sample → save → restore12. | Native and compiled web action trace through actual lane controls; hidden state retained, saved visible lanes exact, restored view/document agreement. |
| W04 — difficult band drag | Degraded multimer, non-first aggregate, unusual voltage/time, Shift/Alt, tied and unequal overlapping bands. | Native actual drag sequence and matching web sequence, picked source/tier/offset and resulting document checked against existing solver corpus; include zero/negative voltage cases where native defines behavior. |
| W05 — integrated recovery | Native/reference expected state for buffer change with live loupes → resize/DPR → graphics failure/recovery in compiled web. | Matching scientific output and view state before failure and after recovery, unchanged saved document/selection, visible fresh paint; both web backends. Web-only failure injection is an explicit platform test, not a native event. |
| W06 — image decoding | Drop small canonical PNG/JPG/GIF assets with distinct first frames, alpha, orientation and relevant color metadata into native and web; manipulate and replace document. | Decoded pixels/dimensions and native visible results with recorded codec/platform scope; preserve view order, focus, deletion and non-persistence. Either verify supported boundaries or obtain an explicit narrowed format decision. |
| W07 — window/platform lifecycle | Paired narrow/large native and web resize; physical monitor scale transition; bounded OS sleep/resume and longer run on the release Mac. | Named displays/scales and before/after captures/state; no stale canvas or lost document. Extend Safari/Firefox lifecycle checks where support is claimed. Physical actions may require Shawn. |
| W08 — memory/capture reliability | Measure driver/process-resident growth under repeated real workload, retaining explicit object counts separately; reproduce or attribute the preliminary native missing-view failure. | Time series and a justified bounded criterion; a clean object ledger alone is insufficient. Retain failures and their conditions. |
| W09 — final acceptance | Resolve A01, D01–D03 and W01–W08; run final appropriate numeric/unit, full browser, compiled native RGB, compatibility, lifecycle and performance commands from one recorded revision. Present side-by-side scenario captures to Shawn for complete workflow review. | Current linked reports, no unresolved required discrepancy, explicit accepted deviations and user acceptance. No deployment implied. |

These packages cover the roadmap's five named high-risk sequences (W01–W05),
P0 reference/ledger (A01 and this index), P1–P4 product behavior, and P5 production,
platform and release gates. Further implementation is driven by their failures,
not by the old M1–M27 milestone queue.

## Decisions that must not be silently counted as accepted

- **D01 — native file defects and input boundaries.** The original release loses
  earlier lanes when its keyed Samples writer produces an object. Current web
  exports preserve all visible lanes as arrays; native can read them. Retained
  original-release evidence proves the defect. Keeping preservation is the
  recommendation, but this ledger does not invent user approval for a deviation.
  Also explicitly classify safe web handling of absent Samples and malformed
  native inputs; do not reproduce undefined native memory behavior.
- **D02 — reference authority.** Quantify known original-release versus modern
  differences (palette float conversion, geometry compatibility adapters, JSON),
  and choose case-specific reference outputs from evidence. Do not replace the
  pinned target with the modern build by assertion. Binary-to-source provenance
  uncertainty remains a qualification to resolve for the release scenario set.
- **D03 — platform/font distribution.** macOS is the initial native certification
  environment. The shared UI includes captured Avenir glyph assets; determine
  the distributable asset/font strategy and supported character/platform scope.
  Do not silently equate Inter/fallback rendering with native Avenir. Other OS
  support and publication targets are not yet advertised or chosen.

No accepted deviation is recorded here unless an explicit decision is linked.
Browser dialogs/download mechanics and OS window borders are the boundary
adaptations already identified by the roadmap; they do not waive application
state or client-area parity.

## Verification commands and evidence freshness

The latest broad runtime run is955 browser passes/1 intentional duplicate skip
and2,924 unit passes from the production cutover. Subsequent commits changed
tests/evidence/configuration, not product runtime. Later targeted evidence adds
22 compiled Chromium passes with216 exact native RGB comparisons;10 compatibility
cases per pinned/newer Firefox/WebKit runner;2 compiled recovery cases;100 churn
cycles on each backend;2 performance-budget cases and18 validator tests. These
are recorded results, not a claim that every suite ran anew during this audit.

Use Node22 and the test configuration's required local server/environment:

```sh
npm --prefix ts run test:unit
npm --prefix ts run test:visual
npm --prefix ts run test:production
npm --prefix ts run test:compatibility
npm --prefix ts run test:suspension
npm --prefix ts run test:performance:budget
node --test ts/scripts/performance-budget.test.mjs
```

Native reconstruction and corpus commands are in the linked dossiers. Some
native reconstruction scripts build fresh directories; others verify retained
outputs. Never run reference-update flags merely to make a comparison pass.

[modern]: ../reference/native/modern/README.md
[release-replay]: ../reference/native/replay/manifest.json
[numeric]: ../reference/native/numerical/README.md
[runtime]: ../reference/native/runtime/README.md
[startup]: ../reference/web/shared-gel-startup/README.md
[populated]: ../reference/web/shared-full-window-scenes/README.md
[controls]: ../reference/web/shared-controls-window/README.md
[overlap]: ../reference/web/shared-overlap-window/README.md
[text]: ../reference/web/native-ui-text/README.md
[fonts]: ../reference/native/fonts/README.md
[sample-files]: ../reference/native/files/interop/README.md
[gel-files]: ../reference/native/files/interop/gel/README.md
[writer-defect]: ../reference/native/files/interop/gel/release/README.md
[move]: ../reference/native/replay/composed-move/README.md
[images]: ../reference/web/shared-image-scenes/README.md
[production]: ../reference/web/shared-production/README.md
[compiled]: ../reference/web/compatibility/compiled-workflows/README.md
[safari]: ../reference/web/safari-shipping-ui/README.md
[resume]: ../reference/web/shared-resume/README.md
[churn]: ../reference/web/performance/shared-view-churn/README.md
[budget]: ../reference/web/performance/release-budget/README.md
