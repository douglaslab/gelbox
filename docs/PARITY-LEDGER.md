# Current parity acceptance ledger

Evidence index updated through `2335420`, 2026-10-11; bounded records retain their
own source revisions. This replaces the initial
findings in [PORT-AUDIT](PORT-AUDIT.md) as the current evidence index. The
[ROADMAP](ROADMAP.md) remains the completion contract. The web app is not yet
fully accepted. No percentage is assigned to this mixed set of requirements.

The strategy remains targeted restoration of the TypeScript/React application,
with shared WebGPU/WebGL2 presentation. The audited evidence does not justify
another rewrite or a Rust migration. Most original omissions are implemented;
the remaining work is specific reference/interaction coverage, platform
validation, and explicit decisions about known native defects and boundaries.

## Current candidate and staged release

The website remains staged from runtime `4ba0139`, with native preview
1.0.1/build20261011. The [local release audit](../reference/native/releases/20261011/local-website-audit.json)
verified all 223 web asset hashes, eight local HTTP routes and both native
download hashes. Website commit `3316a54` corrects the Safari Save Sample
verification note without changing the app bundle. Nothing is published.

The uncommitted [instruction-order candidate](../reference/native/replay/overlapping-tiers/candidate-instruction-order/README.md)
passes compiled production/compatibility/visual regressions but fails 52 current
reference units. It is unqualified. The original instruction diagnostic supports
its geometry changes, with explicit external-math limitations; it does not close
D02 or supersede canonical reference data. The fixed staged build's two-hour
stability run is still live and cannot qualify this different candidate.

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
| A04 | Save/Open | Mounted menu; [restored native file shortcuts](../reference/web/file-shortcuts/README.md); import/edit/download; native reader and original GUI reopen; shipping Safari picker/download. [Sample interop][sample-files], [gel interop][gel-files], [Safari][safari], [file tests](../ts/tests/visual/files.spec.ts). | **Verified** for retained sequences. The shortcut audit found and corrected missing Open/Save handlers; four compiled browser/backend cases now check exact current gel/sample downloads. [Original native shortcut replay](../reference/native/replay/file-shortcuts/README.md) now supplies exact gel/sample saves. Shipping Safari menu Open and Command-S match the native gel; its Option-S character mapping bug is corrected, with both compiled regression and shipping Safari Save Sample now matching the native sample exactly. Safari intercepts Command-O before page delivery; that limitation remains unresolved. W01 composed acceptance remains separate. |
| A05 | Native JSON | Native sample/gel constructors, null collections, object-form release files, exact supported fields, native reader quantization. [Interop][gel-files], [release writer defect][writer-defect]. | **Accepted D01 save correction:** web writes lane-preserving arrays rather than reproducing native data loss. Safe missing-Samples and malformed-input semantics are classified under D01, with parser and compiled preservation evidence. |
| A06 | Native sample XML | Pinned constructor fixtures for fields/defaults/ignored children/empty sample; actual file UI rejects declarations/unsafe aggregate indices. [XML](../reference/native/files/interop/xml/README.md), [test](../ts/tests/visual/native-xml-interop.spec.ts). | **Verified** for native dialect corpus. General XML and native gel XML export are not requirements. |
| A07 | Sample metadata | Unicode name, icon, scale, signed ID, dyes, aggregates and buffers preserved through edit/save/native reread. [Sample interop][sample-files], [test](../ts/tests/visual/native-file-interop.spec.ts). | **Verified** for retained mixed sample; native float/token conversion is explicit. |
| A08 | Import validation | Structural validation; malformed JSON/XML leaves current document intact; partial multi-file successes preserved. [File tests](../ts/tests/visual/files.spec.ts), [image/file sequence tests](../ts/tests/visual/reference-images.spec.ts), [serialization units](../ts/tests/unit/serialize.test.ts). | **Bounded verification:** native JSON/XML and legacy nested validation are covered. Legacy imports normalize native geometry and reject malformed data before replacement; [retained evidence](../reference/web/legacy-import/README.md). Paired native file workflow remains W01; malformed-input differences remain D01. |
| A09 | Dropped samples | Empty/drop lane selection, pending drop/Open order, replacement layout before following sample. [File tests](../ts/tests/visual/files.spec.ts), [mixed batch tests](../ts/tests/visual/reference-images.spec.ts); native `GelboxApp::load` contract in [image reference][numeric]. | **Compiled verified:** [queued mixed batch and occupied/full-lane preservation](../reference/native/replay/file-workflow/README.md) on both production backends. **Unverified:** original-native composed replay for those paths. Include in W01. |
| A10 | Species creation/deletion | Empty sample/add/edit/delete-final, right-click creation, Alt clone, Tab/deselection. [Tests](../ts/tests/visual/species-editing.spec.ts), [compiled runtime reference][runtime], [runtime UI](../ts/tests/visual/runtime-integration.spec.ts). | [Original-native right-click → edit → delete replay](../reference/native/replay/right-click/README.md) matches saved samples and retained empty-tube behavior across four compiled configurations. Initial random output is not compared; broader clone/selection sequences remain W02. |
| A11 | Empty tube | Tube selection creates the native empty sample and enables add/save; repeated click closes panel. [Species tests](../ts/tests/visual/species-editing.spec.ts), [tube tests](../ts/tests/visual/tube-drag.spec.ts). | [Original-native empty-tube replay](../reference/native/replay/empty-tube/README.md) verifies creation, editing, final deletion and retained empty tube/panel across four compiled configurations. Broader cross-view editing remains W02. |
| A12 | Sample movement | Original release selected degraded multimer + hover + tube lane move preserves exact document and focus. [Release replay][move], [web replay](../ts/tests/visual/native-composed-move.spec.ts); clone/gutters/off-gel [tests](../ts/tests/visual/tube-drag.spec.ts). | **Verified** retained move sequence; [Occupied empty destination replay](../reference/native/replay/tube-movement/README.md) now matches four compiled cases; empty-tube off-gel removal also matches all four compiled configurations; [Populated occupied/off-gel replay](../reference/native/replay/populated-tubes/README.md) also matches both full native saves across four configurations; [Persistent-loupe move/return](../reference/native/replay/overlap-picking/README.md) now matches full native saved documents and observed empty/refill behavior across four configurations; cloning and other persistent-loupe drop branches remain W02. |
| A13 | Band movement | Continuous transfer, gutters, Shift lock, temporary sample cleanup, dye merge, cancel/capture loss. [Tests](../ts/tests/visual/band-transfer.spec.ts), native `GelView::mouseDragBand` source. | **Unverified** native composed transfer/clone replay. W02/W04; web expected-value tests are not independent GUI traces. |
| A14 | Aggregate-aware inverse solve | Native solver corpus and real web multimer/tied-tier/clone drag tests with native offset/tier. [Numerical corpus][numeric], [drag test](../ts/tests/visual/band-solver.spec.ts), [units](../ts/tests/unit/nativeSolver.test.ts). | **Verified** corpus/solver integration; unusual-voltage/time composed native drag is W04. |
| A15 | Overlap picking | Native minimum UI-height/tie-order rule and web pointer tests. [Test](../ts/tests/visual/band-picking.spec.ts), [particle picking corpus][numeric], [units](../ts/tests/unit/nativePicking.test.ts). | [Original-native tied-overlap deletion](../reference/native/replay/overlap-picking/README.md) now matches the complete saved gel across four compiled configurations. The independent unequal-height case now also selects/deletes the narrower second species and matches its complete native saved survivor across all four configurations. Other overlap drag histories remain W04. |
| A16 | Dye selection/drag | Dye controls/disabled buffer state, source rules, merge/clone retaining DNA fields. [Dye paint](../reference/web/shared-dye-scenes/README.md), [transfer tests](../ts/tests/visual/band-transfer.spec.ts), [inspector](../ts/tests/visual/inspector-wiring.spec.ts). | **Verified** controlled paint; [Original-native capped same-dye transfer](../reference/native/replay/dye-transfer/README.md) verifies the destination payload and retained source DNA in four compiled configurations; other dye/clone branches remain open. W02. |
| A17 | Selection identity |28 compiled native ownership/raw-index observations; retained sample identity, off-document selection, clone independence, loupe origin selection. [Native identity][numeric], [web identity](../ts/tests/visual/sample-identity.spec.ts), [loupe selection](../ts/tests/visual/loupe-selection.spec.ts). | **Verified** native model observations; cross-view move/clone/delete history still W02. No invented stable species IDs. |
| A18 | Lane reduction | Web retains hidden samples/selection/engine; visible-only save and restore tests. [Files](../ts/tests/visual/files.spec.ts), [combined hidden-lane test](../ts/tests/visual/shared-hidden-lane.spec.ts), native `Gel::setLayout`. | [Original-native lane-control replay](../reference/native/replay/hidden-lanes/README.md) verifies reduction/restoration and subsequent editing through actual controls. Opening settings clears selection, so hidden-selected editing is unavailable in that sequence. Native persistent-loupe continuation remains W03. |
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
| A29 | Loupe positioning/interaction | Empty background creation, frame/anchor/wedge, hover preview, close/delete/focus, multiple buttons and resize. [Tests](../ts/tests/visual/loupe-interactions.spec.ts), [hover](../ts/tests/visual/hover-loupe.spec.ts), [compiled workflow][compiled], [native paint](../reference/web/shared-loupe-scenes/README.md). | **Verified** captured paint and compiled web actions; [Original-native left-button frame/probe/wedge continuation](../reference/native/replay/overlap-picking/README.md) now matches movement deltas, content changes and source/background selection in four compiled configurations. Other drag branches remain W02. |
| A30 | Loupe seed |1,280 exact seed probes and refreshed/paused low-population cases, retained global/local streams. [Corpus][numeric], [runtime][runtime], [loupe units](../ts/tests/unit/nativeLoupe.test.ts). | **Verified** named seed/lifecycle cases; no requirement to enumerate unlimited stochastic histories. |
| A31 | Images |24 compiled native gesture cases; exact PNG scene/mip comparisons; web PNG/JPG/GIF first-frame, ordering, disposal and file-batch checks. [Image paint][images], [interaction tests](../ts/tests/visual/reference-images.spec.ts), [native methods][numeric]. | **Verified** for the linked codec/gesture corpus and [original-release JPEG/PNG/GIF Open→move→resize→replace trace](../reference/native/replay/visible-images/README.md). That trace exposed and fixed missing web Open-image support. Monitor/profile transitions and native drop-position qualification remain W06. |
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
| R01 | General slider/aggregate-graph mappings, ranges, quantization, notches, presets, labels, disabled states, pointer ownership and focus | [128 exact slider paint comparisons](../reference/web/shared-slider-scenes/README.md), [native geometry/gesture contract](../reference/native/slider-controls/README.md), [slider gestures](../ts/tests/visual/slider-gestures.spec.ts), [graph accumulated edits/presets](../ts/tests/visual/graph-gestures.spec.ts), [secondary buttons](../ts/tests/visual/slider-secondary.spec.ts). **Verified** bounded paint and web regression. [Original-native replay](../reference/native/replay/multimer-drag/README.md) additionally covers one column edit, both aggregate presets, a two-column drag, graph release below bounds mass handle-edge versus track drags, fractional aggregate weights, continuous aspect editing, one size step/degradation notch, and forward Tab/reselect/Backspace after a slider edit with exact saved samples. W02 still needs remaining endpoint/notch/quantization cases, densely sampled graph edits, cancellation and other keyboard-focus branches. |
| R02 | Continue legacy `gel-sample-v0`/`gel-state-v0` imports; validate before replacement; explicit native layout conversion | **Verified within tested scope:** [decoder](../ts/src/lib/gel/legacyFile.ts) validates fresh nested objects, preserves scientific inputs/metadata/hidden slots, normalizes visible lanes to 7–20 and rebuilds native layout context. [Unit cases](../ts/tests/unit/legacyFile.test.ts) and [compiled browser cases](../ts/tests/production/legacy-files.spec.ts) cover conversion and malformed-file preservation on both backends. [Red/green evidence](../reference/web/legacy-import/README.md). Paired original-native W01 remains open. |
| R03 | Separate document, view identity and derived simulation/render state; synchronous shared commands; coordinate consistency | [GelStore](../ts/src/lib/gel/gelStore.ts), [compiled runtime reference][runtime], [identity tests](../ts/tests/visual/sample-identity.spec.ts), [projection regression](../ts/tests/visual/shared-window-projection.spec.ts). Existing source/regressions support the implemented boundary. W02/W03/W05 verify the externally observable cross-view invariants; no wholesale reducer/engine rewrite is required by this contract. |

## Finite remaining acceptance work

Each package has a stopping condition. Do not expand these into an unlimited
requirement to prove every RNG history or every possible input. If replay exposes
an actual discrepancy, fix it with a failing regression and rerun affected gates.

| Package | Ordered scenario / required artifact | Completion evidence |
|---|---|---|
| W01 — file workflow | Native mixed gel/sample → web Open/drop → edit species and buffer with panels open → Save → reopen in original native. R02 legacy validation/layout conversion is verified; include occupied/all-full sample drop and pending mixed-file batch. Start from retained interop fixtures. | [Original-release baseline → compiled buffer/species edits → native reread → web reopen](../reference/native/replay/file-workflow/README.md) now verified, including exact float32 boundary conversion. Compiled queued/occupied/full drops pass in Chromium, Firefox and WebKit ([expanded workflow gate](../reference/web/workflow-compatibility/README.md)); original-native composed drop replay remains open. Stale imported-buffer binding is now reproduced and diagnosed; [evidence](../reference/native/files/interop/gel/stale-buffer/README.md). Current-document binding (D04) and lane-preserving saves (D01) are accepted exceptions. D01 input boundaries are classified below; malformed imports preserve the open document in all four compiled configurations.  [Right-edge file-drop correction](../reference/web/file-drop-edge/README.md) now matches pinned native inclusive picking, with saved-state checks on all four browser/backend configurations; this source-derived boundary case does not replace the outstanding original-native drop replay. |
| W02 — editing and shared state | Empty tube → add/delete-final; selected sample + persistent loupes → tube move/Alt clone/occupied/off-gel; species/band clone/delete; dye merge; source/loupe selection and all three loupe drag modes; R01 slider/graph mappings, gestures, presets and focus. | [Original-native empty tube → create/edit → delete final species → web save/native reread](../reference/native/replay/empty-tube/README.md) now verifies sample payload, retained empty tube/panel and post-save keyboard behavior. Four compiled backend/engine cases pass. [Tube move and occupied empty destination](../reference/native/replay/tube-movement/README.md) also match full saved documents in four compiled cases. Empty-tube off-gel removal now also matches a saved original-native checkpoint on all four configurations. The [aggregate continuation](../reference/native/replay/multimer-drag/README.md) now matches one graph-column edit, both aggregate presets, a two-column drag, release below the graph, and mass handle-edge versus track drags exactly across four configurations; native mass checkpoints caught and corrected continuous-slider float precision. Fractional graph weights and continuous aspect values are now corrected against additional native saves; one size-step/degradation-notch sequence and forward Tab/reselect/Backspace after a slider click also match. [Populated occupied-destination and off-gel drops](../reference/native/replay/populated-tubes/README.md) now match both complete native saved gels exactly in four configurations, without loupes. [Capped same-dye transfer](../reference/native/replay/dye-transfer/README.md) now matches the original destination sample and retained source DNA in all four configurations. [Persistent-loupe lane1→lane2→lane1](../reference/native/replay/overlap-picking/README.md) now matches exact native documents and observed empty/refill behavior in four configurations; the web additionally retains its frame/canvas identity and anchor/frame placement. The trace records and cleans up an accidental extra loupe; it does not certify exact native pixels or native internal view identity. The same original-native continuation now covers one left-button frame-only, probe-only and wedge drag, followed by molecule selection opening the source controls and empty-loupe selection closing them; four compiled configurations match those observable transitions and the exact final saved gel. The populated off-gel continuation additionally matches the exact native twelve-empty-lane save, closed source panel and retained empty loupe in all four configurations. [Right-click creation → deterministic edits → post-save Backspace](../reference/native/replay/right-click/README.md) now matches native sample saves and retained empty tube/panel in four compiled configurations. [Backward keyboard deselection → last-dye wrap → deletion](../reference/native/replay/keyboard-selection/README.md) matches the exact native sample in four compiled configurations, with pointer rollover explicitly excluded. Remaining cloning, occupied-destination persistent-loupe drops, other dye branches, secondary-button drag/overlap/cancellation and other source/loupe and slider/graph workflows still need paired traces and applicable view identities; reuse existing lower-level cases.  [Native pointer-modifier correction](../reference/web/loupe-modifiers/README.md) fixes Control-click loupe creation on macOS, with source evidence, development gestures and four compiled browser/backend cases; original-native GUI confirmation remains separate. |
| W03 — hidden lanes | Populate lane12 → select species/open loupe → reduce to7 → edit hidden selected sample → save → restore12. | [Actual lane-control replay](../reference/native/replay/hidden-lanes/README.md) establishes that opening native gel settings clears the selection, so hidden-selected editing is unavailable through that sequence. Original native and compiled web preserve the hidden sample through seven → twelve lanes and subsequent edits. [Original-native persistent-loupe continuation](../reference/native/replay/overlap-picking/README.md) now matches four compiled configurations: the same loupe stays in place, empties when lane12 is hidden, and refills when restored. The seven-lane save matches exactly; restored comparison explicitly reconstructs observed lane12 around the unchanged native keyed sample. Both apps omit hidden lanes from a seven-lane save; live retention is not a hidden-data save roundtrip. D01 explicitly accepts preserving lanes instead of reproducing native keyed-save data loss. |
| W04 — difficult band drag | Degraded multimer, non-first aggregate, unusual voltage/time, Shift/Alt, tied and unequal overlapping bands. | [Original-native degraded multimer lane transfer → vertical drag](../reference/native/replay/multimer-drag/README.md) now matches the selected sample exactly (1642bp) and retained source payloads across four compiled configurations. Native keyed gel saves lose the destination, so Save Sample supplies its independent checkpoint. [Zero-voltage downward drag](../reference/native/replay/zero-voltage/README.md) now matches the complete native saved gel across four configurations: Bases becomes1 while the band stays at the well and the slider displays100bp. [Negative-voltage upward drag](../reference/native/replay/negative-voltage/README.md) matches Bases14000 and all saved fields across four configurations, with the sole explicit Time decimal→float32 parsing conversion. [Tied-overlap deletion](../reference/native/replay/overlap-picking/README.md) now independently verifies first-fragment tie picking through the exact saved survivor in four configurations. The independent unequal-height overlap deletion now verifies narrower-second-species priority through the exact native survivor across four configurations. The [isolated trimer replay](../reference/native/replay/isolated-tier/README.md) independently establishes tier3 with a single nonzero aggregate weight: two different grab points and equal downward deltas both yield native Bases1672, matched by all eight compiled cases. [Overlapping multi-tier drag](../reference/native/replay/overlapping-tiers/README.md) now exposes an unresolved original-native922bp versus web1001bp discrepancy; all four compiled configurations fail the new exact comparison. A simulation-only fast-math build now reproduces the native narrower-trimer selection; the original Release configuration enables fast math. A [local arithmetic correction candidate](../reference/native/replay/overlapping-tiers/candidate/README.md) now passes all20 paired drag cases,96 production,76 compatibility and969 visual tests (one existing skip). Full units retain25 numerical-reference failures; nine solver disagreements against a separately captured fast-math model await original-GUI boundary checks. The candidate remains uncommitted and is not staged to the website. Time uses the existing explicitly asserted decimal→float32 comparison boundary. Modifier gestures and other zero/negative-voltage paths remain open. |
| W05 — integrated recovery | Native/reference expected state for buffer change with live loupes → resize/DPR → graphics failure/recovery in compiled web. | [Compiled recovery](../reference/web/integrated-recovery/README.md) now verifies both loss and terminal allocation failure on both starting backends: actual buffer/loupe/selection actions, emulated resize/DPR, retained identities and document, exact recovered gel pixels, and resumed molecular paint. [Original-native water→TBE with a persistent loupe](../reference/native/replay/overlap-picking/README.md) now supplies the paired buffer/loupe trace: four compiled configurations match both complete saved gels, retained loupe content/placement and visible gel changes. Exact native pixels and physical monitor/OS lifecycle checks are not implied; the latter remain W07. Web-only failure injection is an explicit platform test, not a native event. |
| W06 — image decoding | Drop small canonical PNG/JPG/GIF assets with distinct first frames, alpha, orientation and relevant color metadata into native and web; manipulate and replace document. | [21-fixture native codec corpus](../reference/native/image-decoding/README.md) and [compiled cross-engine comparison](../reference/web/image-decoding/README.md) now expose and fix JPEG/PNG orientation differences. Dimensions/orientation match; measured JPEG rounding and WebKit translucent RGB remain explicit boundaries (D06). [CMYK rejection and grayscale acceptance](../reference/native/image-decoding/color-models/README.md) now have native codec and compiled regression coverage. [Display P3/Adobe RGB decoded-pixel comparisons](../reference/web/image-decoding/wide-gamut/README.md) now cover five additional fixtures on all four backend/engine combinations; existing D06 differences persist. [Straight-alpha PNG upload](../reference/web/image-decoding/straight-alpha/README.md) now fixes WebKit filtered composition:40 exact native scene and56 mip comparisons across all four backend/engine configurations, plus44-format actual upload comparisons. [Original-release visible JPEG/PNG/GIF replay](../reference/native/replay/visible-images/README.md) now verifies Open, stored JPEG orientation, PNG transparency, GIF first frame, move/resize, image retention across gel replacement and focused-image deletion. Both whole-gel saves match four compiled configurations. This exposed and fixed Open treating images as JSON text; it now uses the existing image loader. Native file-drop positions and monitor/profile rendering remain open; these visible observations are not exact screenshot goldens. |
| W07 — window/platform lifecycle | Paired narrow/large native and web resize; physical monitor scale transition; bounded OS sleep/resume and longer run on the release Mac. | [WebKit engine activity replay](../reference/web/lifecycle/webkit-activity/README.md) now verifies two inactive/active cycles, stopped/resumed frames, live view identities, particle paint and unchanged saved gel. [Shipping Safari tab switching](../reference/web/lifecycle/safari-tab-resume/README.md) now verifies two actual background/return cycles at the staged website path with the sample panel open, resumed visible animation and both full saved documents unchanged. This sample-only UI observation does not measure hidden-frame counts or internal identities. Persistent-loupe Safari resume, Firefox background behavior and physical OS/display transitions remain open; physical actions may require Shawn. |
| W08 — memory/capture reliability | Measure driver/process-resident growth under repeated real workload, retaining explicit object counts separately; reproduce or attribute the preliminary native missing-view failure. | The [300-cycle baseline](../reference/web/performance/resident-memory/README.md), [Metal control](../reference/web/performance/resident-memory/metal-comparison/README.md) and [workload/inspector controls](../reference/web/performance/resident-memory/workload-controls/README.md) separate process RSS from tracked objects. Removing resize reproduces growth. Disabling network inspection preserves all resource/behavior assertions while reducing early-to-late renderer growth from59.19/51.62MiB to−6.84/+8.66MiB (WebGPU/WebGL2), supporting a substantial instrumentation contribution. The default graphics-path failure is resolved for Metal. The [1,000-cycle repeat](../reference/web/performance/resident-memory/workload-controls/network-disabled-1000/README.md) passes resource assertions but still shows renderer median growth of32.84/8.49MiB; it does not establish a plateau. Analysis of its51 forced-GC checkpoints from cycles500–1000 shows JS heap endpoint changes of+25,976/−4,576 bytes, constant DOM/listener counts and negative fitted JS heap slopes. That narrows attribution but does not bound native allocator/driver memory. [Native event/removal tracing](../reference/native/modern/performance-interaction/attribution/README.md) now detects an intentionally removed sample and verifies a full normal run with stable resources and no external mutating pointer/key events. The historical failure remains unattributed. The [current compiled responsiveness budget](../reference/web/performance/current-budget/README.md) passes both backends with constant tracked resources; it does not measure resident memory. [A200-cycle native region/footprint probe](../reference/web/performance/resident-memory/vmmap-200/README.md) passes both backends and records renderer/GPU summaries; renderer footprints fall between cycles100 and200, while GPU footprints change by+14.7/+2.0MiB overall. Chromium PartitionAlloc introspection is unavailable, so ownership remains incomplete. The [1,000-cycle footprint repeat](../reference/web/performance/resident-memory/vmmap-1000/README.md) passes both backends: renderer physical footprint changes by+2.7/−0.5MiB from cycles100 to1000, GPU-process footprint by+0.9/+2.7MiB; last-half JS heap/DOM counts do not grow. RSS retains a positive slope and all12 reports lack PartitionAlloc introspection. This finite accelerated run is not an all-day bound. A [two-hour paced session candidate](../reference/web/performance/session-duration/README.md) now declares footprint/heap/resource limits before measurement, has twelve verifier controls, and is running against fixed source26b4eb0. Its duration is a working assumption pending Shawn’s preference; no session acceptance result is available yet. The native failure disposition remains open.  The [completed original two-hour run](../reference/web/performance/session-duration/completed-original/README.md) fails its unchanged heap criterion on WebGL2 at cycles30/40/80. Both workloads completed120 cycles and7244 measured seconds; all other original duration/DOM/resource/process-footprint assertions pass. A separately identified [convergent-sampling two-hour run](../reference/web/performance/session-duration/frozen-session/README.md) is now running against staged4ba0139 after both short preflights; same budgets, no acceptance result yet. |
| W09 — final acceptance | Resolve A01, D01–D06 and W01–W08; run final appropriate numeric/unit, full browser, compiled native RGB, compatibility, lifecycle and performance commands from one recorded revision. Present side-by-side scenario captures to Shawn for complete workflow review. | [Latest control-correction regression gate](../reference/native/replay/multimer-drag/README.md):3,051 unit,955 visual (one intentional skip),54 production and24 compatibility cases pass. The earlier [broad regression gate](../reference/web/regression-gate/README.md) retains its original run evidence. The website refresh at ff35ea9 subsequently passed3,051 unit and58 production cases; the full compatibility gate at319fa71 now passes30 cases, including native malformed-import preservation ([log](../reference/web/input-boundaries/compatibility-full-319fa71.log.gz)). The [Open-image correction gate](../reference/native/replay/visible-images/README.md) now passes3,051 unit,72 production,52 compatibility and24 focused visual cases; local website source9ce75cd independently repeats unit/production verification. These runs span recorded revisions and are not the final single-revision gate. This is current regression evidence, not closure: remaining required native/platform scenarios and explicit decisions/user acceptance still apply. No deployment implied.  [Current shortcut regression](../reference/web/file-shortcuts/README.md) additionally records969 full visual passes (one intentional skip) at8f308d8, after the compiled82-production/62-compatibility correction gates. Native/platform and session acceptance remain open. |

These packages cover the roadmap's five named high-risk sequences (W01–W05),
P0 reference/ledger (A01 and this index), P1–P4 product behavior, and P5 production,
platform and release gates. Further implementation is driven by their failures,
not by the old M1–M27 milestone queue.

## Explicit decisions and remaining boundaries

- **D01 — native file defects and input boundaries.** The original release loses
  earlier lanes when its keyed Samples writer produces an object. Current web
  exports preserve all visible lanes as arrays; native can read them. Retained
  original-release evidence proves the defect. **Lane-preserving saves accepted:**
  on 2026-10-10 Shawn approved the web fixes after being asked specifically about
  preserving every lane and binding buffer controls to the current document.
  His response was: “I'm good with web fixes and slight JPEG decoding differences.”
  **Safe input boundaries classified:** absent/null/empty Samples produces seven
  empty lanes, avoiding reliance on native constructor state when Samples is absent.
  Short arrays are padded; samples beyond the visible 20-lane limit remain stored.
  Null or empty-object lane entries are empty lanes; a sample with an explicit
  empty Fragments collection remains an allocated empty tube. The defective keyed
  Samples object is recovered in sorted child order; lost lanes cannot be inferred.
  Missing fields use constructor defaults, while wrong scalar/container types,
  non-finite numbers, non-int32 integer fields and malformed color/aggregate values
  are rejected. Unknown extra fields and runtime pointer fields are ignored.
  These are deliberate safe web input semantics, not claims of native malformed-file
  equivalence. [31 parser cases](../ts/tests/unit/nativeFile.test.ts) and
  [compiled import rejection](../ts/tests/production/legacy-files.spec.ts) cover
  these boundaries: seven malformed native variants retain the exact saved gel
  and band geometry with no page errors in all four configurations.
  Retained run logs: [input-boundary evidence](../reference/web/input-boundaries/).
- **D02 — reference authority.** Quantify known original-release versus modern
  differences (palette float conversion, geometry compatibility adapters, JSON),
  and choose case-specific reference outputs from evidence. Do not replace the
  pinned target with the modern build by assertion. Binary-to-source provenance
  uncertainty remains a qualification to resolve for the release scenario set.
  [Original-release file replay](../reference/native/replay/file-workflow/README.md)
  now distinguishes direct float32 JSON parsing from modern-Cinder six-digit
  token conversion; use the original result for that scenario.
  The case-specific authority choices are now explicit:

  | Case | Authoritative result and comparison boundary |
  |---|---|
  | Palette constants | [Original-release saved swatches](../reference/native/replay/palette-values/README.md): all36 channels equal `f32(byte * f32(1/255))`. Imported colors remain unchanged. Modern palette entries are not substituted for release defaults. |
  | JSON numeric interchange | Original GUI directly parses float32: mass117.57998083587876 becomes117.5799789428711. The modern harness instead produces117.58000183105469 then writes117.58. Use original GUI saves; any float32 conversion is asserted explicitly. |
  | Interactive selection/editing | Original Cocoa release and its saved checkpoints govern the paired traces. Modern GLFW background input was observed at a different position than requested, so a modern CUA click alone is not interaction evidence. |
  | Degraded molecular clipping | [64-case legacy mesh corpus](../reference/native/numerical/README.md#particle-mesh-reference) uses verbatim original polygon/mesh methods, Cinder `75f4821` and pinned Boost `15a1f17`. It retains zero-width/full-ellipse and tiny-slice centroid quirks. Compare colors/pass groups exactly, geometry with the documented `max(0.0002, abs(native) × 0.00001)` bound and361 coverage probes per case; raw triangulation order and near-edge probes are outside this claim. The modern convex-clip adapter is not the authority for these cases. |
  | Controlled RGB raster tests | Modern source-method captures govern only the exact captured document, particle inputs, geometry and stated DPR. [Populated-window evidence](../reference/native/modern/full-window-scenes/README.md) reports twelve one-level differences when release palette inputs were incorrectly mixed into a modern capture; use each capture's own full input. This is conditional rendering evidence, not original-release pixel certification. |
  | Original visible screenshots | [Capture/profile investigation](../reference/native/control-comparison/README.md) identifies JPEG and Display ICC data. Treat these as visible observations, with explicit profile conversion for analytical crops; do not demand zero-byte equality or invent CSS corrections from raw channels. |

  Remaining D02 work is the original/modern geometry and visual qualification
  for the release scenario set, plus original-release binary/source provenance.
  The [clean-source Cinder rebuild](../reference/native/modern/cinder-provenance/README.md)
  now reproduces all285 object members and the symbol table exactly in each
  architecture; only archive timestamp/group-ID metadata differs. This closes
  the modern prebuilt-library qualification for the recorded toolchain.
  These known differences cannot be closed by declaring global build equivalence.
- **D03 — platform/font distribution.** macOS is the initial native certification
  environment. The shared UI includes captured Avenir glyph assets; determine
  the distributable asset/font strategy and supported character/platform scope.
  Do not silently equate Inter/fallback rendering with native Avenir. Other OS
  support and publication targets are not yet advertised or chosen.
  [Distribution inventory](../reference/web/font-distribution/README.md) now identifies
  all46 shipped native text images and their exact native references, the95-character
  dynamic ASCII scope, and local Avenir versus bundled Inter paths. The missing
  Inter notice is included in the current build; this does not resolve Avenir rights.

- **D04 — stale native buffer binding after loading.** The original release keeps an open gel buffer panel bound to the previous document, so preset edits do not reach the imported gel until settings is reopened. [Native saves/source and compiled regression](../reference/native/files/interop/gel/stale-buffer/README.md) prove the difference. The web now matches native panel lifetime and retains its existing current-document binding. **Accepted on 2026-10-10:** Shawn approved the web fixes in response to the specific lane-preservation/current-document-binding question (response quoted under D01). W01 still requires the remaining native workflow replay.

- **D05 — accepted voltage- and time-dependent curvature.** Shawn explicitly
  requested on 2026-10-10 both negative-voltage frowning and flat bands at time
  zero, with curvature increasing through the first ten simulated minutes.
  DNA bands now ramp linearly to full curvature at ten minutes, capped thereafter,
  with negative voltage reversing the sign. Dyes remain flat. [Current evidence](../reference/web/curvature-ramp/README.md)
  supersedes the historical time-zero polarity captures. Raw native goldens remain
  intact; numerical comparisons identify both intentional differences explicitly.

- **D06 — accepted bounded JPEG rounding; shared PNG alpha corrected.** Native Quartz and
  Chromium/Firefox JPEG differ by at most one 8-bit channel level in the retained
  corpus. WebKit discards fully transparent RGB and rounds translucent straight
  RGB by at most one level, with exact premultiplied values in that fixture.
  [Measured reports](../reference/web/image-decoding/README.md) preserve the
  difference. **Accepted on 2026-10-10:** Shawn approved the slight JPEG decoding
  difference after being told its measured bound is at most one 8-bit level
  (1/255 of full scale) per RGB channel. This accepts that bounded JPEG difference, not arbitrary codec,
  orientation, dimension or PNG-alpha differences. The [straight-alpha fix](../reference/web/image-decoding/straight-alpha/README.md) bypasses those lossy bitmap pixels for shared PNG textures and restores exact filtered output in the retained native scenes. The original-release visible Open/manipulation trace is now recorded under W06; native drop positions and monitor/profile transitions remain separate. The measured JPEG rounding exception is accepted.

Accepted deviations above identify the explicit user instruction and its scope; source evidence is linked alongside each decision.
Browser dialogs/download mechanics and OS window borders are the boundary
adaptations already identified by the roadmap; they do not waive application
state or client-area parity.

## Verification commands and evidence freshness

The latest runtime correction is native-compatible image loading through Open
at `9ce75cd`:3,051 units,72 compiled production,52 full compatibility and24
focused file/image visual cases pass ([retained gate](../reference/native/replay/visible-images/README.md)).
The website updater repeats the unit/production gates before packaging that commit.
The most recent full visual gate remains955 passes with one intentional skip
from the earlier control-correction revision. Recovery, memory and performance
reports retain their own source/build hashes and bounded scopes. Those broader
gates have not all been rerun after the Open correction; final W09 acceptance
requires the remaining requirements and one recorded revision.

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
