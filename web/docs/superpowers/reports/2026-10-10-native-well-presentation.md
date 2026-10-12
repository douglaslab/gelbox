# Native well presentation completion record

This increment integrates native well rasterization into both render modes and backends. It does not certify whole-app parity. Independent reviewer: gpt-6-astra, review range fb86e33..92fd008. One Important finding was fixed and verified; one Minor remains deferred. No second review was requested.

The reviewer found that effects-mode terminal failure retained scientific/presentation resources until unmount. Four new allocation/frame failure cases reproduced this on both backends. Effects mode now immediately disposes resources, clears references/watchers, unconfigures WebGPU and retires failed GL contexts. Tests assert zero tracked objects and retired GL contexts while the failure screen is visible, then verify Retry and unmount.

Verification after the fix: 2,872 unit tests, 479 browser cases with one intentional skip, and four production cases passed. Native raster checks remain exact; no goldens or tolerances were changed. The performance workload passed at the preceding commit; see [retained reports](../../../reference/web/performance/native-well-presentation/README.md) for scope and limitations.

Deferred Minor: fresh well-array props cause avoidable scientific redraws on unrelated UI changes. No latency magnitude was measured; memoization and focused render-count coverage remain follow-up work.

## Execution ledger and decisions

# SDD ledger — plan: docs/superpowers/plans/2026-10-10-native-well-presentation.md
Pre-flight: Task 1 presentation draw/destroy interfaces are consumed unchanged by Task 2; dimensions are physical pixels and scale includes DPR.
Pre-flight: Task 3 resource tracking covers Task 1 ownership and Task 2 lifecycle; GL renderbuffer tracking must be added.
Task 1: in progress, base fb86e33. Independent native matrix and corrected prototypes are retained; tests now target product modules.
Task 1: RED missing present/present-gl imports; first GREEN 16 scenes per backend plus typecheck.
Task 1: Ruling: use a headless native OpenGL capture after proving all 16 black scenes identical to window captures — GUI reference instances are blocked by inaccessible macOS restore alerts, and the headless driver exercises the same line/blend/resolve primitives with native-captured geometry — cost if wrong: colored reference certification must be revisited; no original-release GUI claim is made.
Task 1: Ruling: replace integer ties-to-even resolve with float32 normalized sample accumulation in sample-index order — the 32 colored references exposed one-byte errors from the original inference, while this arithmetic matches all 48 references — cost if wrong: other platform resolve arithmetic requires further reference validation.
Task 1: colored matrix RED WebGPU (WebGL exact); float32 resolve GREEN all 48. Tests compare the product modules, not prototype copies.
Task 1: complete (commits fb86e33..5124be1, tests: npm --prefix ts run test:visual -- native-well-presentation.spec.ts --output=/tmp/gel-presentation-task-done →   2 passed (3.4s))
Task 2: RED complete well outlines in both modes/backends; integration GREEN 26 affected browser cases, including untouched native band texture/display comparisons.
Task 2: Ruling: share a small useDisplayScale hook with a guarded rAF check — actual DPR changed without resize/media events in the live transition regression — cost if wrong: one cheap ratio check per active gel frame; cleanup is checked in Task 3.
Task 2: DPR/lane workflow RED stale backing size; GREEN two backend workflows after guarded scale detection. The screenshot test uses the same CDP session as its metrics override; Playwright's original session captured the old DPR. Strict image-dimension and native-pixel assertions remain.
Task 2: complete (commits 5124be1..1c55218, tests: npm --prefix ts run test:visual -- native-well-presentation.spec.ts native-well-stroke.spec.ts native-gel-texture.spec.ts render-mode.spec.ts molecular-dpr.spec.ts gel-presentation-dpr.spec.ts --output=/tmp/gel-well-integration-task-done →   30 passed (11.0s))
Task 3: RED six direct-mode failure cases; bounded recovery, immediate disposal and Retry made all 16 lifecycle cases green. Added explicit GL context retirement checks: four RED cases fixed by retiring contexts on failure while preserving connected contexts for normal DPR reinitialization.
Task 3: RED partial shader leak during presentation program construction; exception-safe GL shader/program cleanup made all 18 presentation/resource lifecycle cases green.
Task 3: initial full gate 2,872 units and four production cases green; browser 473 passed, two buffer-wiring tests failed because SVG-only well suppression no longer excludes canvas wells. Test now suppresses wells at the presentation input, preserving its exact full-image scientific comparison; both targeted cases green. Full browser gate rerun pending.
Task 3: complete (commits 1c55218..92fd008, tests: npm --prefix ts run test:visual -- --output=/tmp/gel-well-full-final →   475 passed (34.4s))

Final review: independent gpt-6-astra review of fb86e33..92fd008; no Critical, one Important effects terminal-failure resource leak, one Minor redundant scientific redraw. Retain Important/Minor grades: leakage while failure UI remains mounted is a correctness issue; redundant work has no measured latency regression in the available workload.
Final: minor (deferred): GelPage creates a fresh visible-wells array on unrelated UI changes, causing avoidable scientific redraws; memoize visible wells and add render-count coverage in a subsequent increment.
Final: Ruling: full original-release GUI parity remains open — exact bounded native raster evidence supports this increment, not whole-app certification — cost if wrong: broader visual discrepancies remain undetected until GUI acceptance.
Final: Ruling: other GPUs and fractional display scales remain unverified — the retained native matrix establishes scales 1 and 2 on the documented macOS hardware — cost if wrong: other-device raster differences require follow-up.
Final: Ruling: real driver resets remain unverified — injected allocation/frame failures prove bounded recovery and disposal for those triggers only — cost if wrong: physical reset recovery may still fail.
Final: Ruling: performance release budgets remain open — both benchmark cases passed with stable tracked resources and <=16.8ms p95 frame intervals, but no native budget or GPU/presentation latency comparison exists — cost if wrong: heavier workloads may miss acceptable responsiveness.
Final: effects terminal allocation/frame failure reproduced RED in all four new backend cases; immediate idempotent disposal made the complete 20-case presentation lifecycle file GREEN. Final full gates running.
Final: fixed effects-mode terminal-failure resource leak — four effects terminal allocation/frame cases RED→GREEN; final suite 2,872 unit / 479 browser (one intentional skip) / four production passed. No golden or tolerance changes. Benchmark at 92fd008 passed both backends before this cleanup-only fix; retained under reference/web/performance/native-well-presentation.
Final: keep local detached-HEAD worktree under existing no-push/no-merge authorization; broader app goal remains open.

## Subsequent follow-up

The deferred fresh-wells-array redraw finding was subsequently reproduced and
fixed. A broader selection check also caught redundant simulation-context
replacement, corrected without changing its values. See STATUS's scientific
redraw isolation record and `gel-render-invalidation.spec.ts`. This does not
change the original review's historical disposition above.
