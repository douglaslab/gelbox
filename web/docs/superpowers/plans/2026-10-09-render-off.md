# Native Render-off scene implementation plan

> Use superpowers:executing-plans for inline execution; one fresh whole-increment review.

**Goal:** Restore the native Render checkbox, Cmd-R and direct band scene.
**Spec:** ROADMAP P3, pinned GelView::drawBands / enableGelRender, AppSettingsView and GelboxApp::keyDown at native 5f51097.
**Architecture:** Compile the unchanged native drawBands method into a mesh capture adapter using real Cinder Band/TriMesh/Rect/Color. A pure TS builder produces the same flattened triangles. A direct canvas uses existing additive geometry batches on WebGPU/WebGL2, independently of the effect renderer. Application state owns a transient enabled flag; switching modes disposes the old renderer.
**Tech stack:** existing TypeScript/React/WebGPU/WebGL2, C++17/Cinder and Python reference tooling.

## Global constraints
- Preserve strict native behavior before improvements; complete web app, no Rust migration.
- Existing isolated worktree, Node22, read native sources via Git; no edits to sibling checkouts.
- Render defaults true. Native Cmd-R toggles globally before view key handling. Checkbox nearest settings button, below Loupe on hover.
- Toggle persists through document replacement, never serializes. Off scene retains wells, selection, picking and loupes.
- drawBands order per band: optional blur rectangle (alpha brightness*.2), body, below smear, above smear/flame. Upper smear deliberately uses Below brightness. Equality smear==flame selects flame. Negative nonzero upper extent is retained. Native float32 operation order.
- Native GL_SRC_ALPHA,GL_ONE RGB equals the existing premultiplied geometry batch additive mode. Draw to opaque black display surface; resulting alpha remains1. No effect offscreen textures, smile/warp/flame noise in direct mode. Display-resolution raster; original native raster certification remains separate.

## Review focus
- Toggle during asynchronous backend acquisition: late completion must not draw or allocate after teardown.
- Off-mode editing, document replacement and multiple toggles must use current bands, retain mode and exclude mode from saves.
- Smear/flame equality, negative extents, fractional coordinates and colored overlapping bands must preserve mesh order and additive blending.
- Cmd-R with an image/loupe focused must toggle once without browser refresh or changing focus; ordinary r does nothing.
- DPR/resizing and empty scene must clear black without stale pixels; full native anti-alias/font/raster certification remains open.

### Task 1: Capture and reproduce native direct mesh
**Files:** reference/native/numerical/{build-direct-bands.py,direct-bands-driver.cpp,direct-bands-cases.json,direct-bands-outputs.json,direct-bands-provenance.json,test_direct_bands.py,README.md}; ts/src/lib/gel/directBands.ts; ts/tests/unit/directBands.test.ts.
**Interfaces:** buildDirectBandMesh(bands: Band[]): Mesh, interleaved x,y,r,g,b,a in native triangle order.
- [x] Write reference contract tests for empty/body/blur/smear/flame/equality/negative/fractional/multi-band cases and pinned extraction provenance. Run Python; missing outputs must fail.
- [x] Compile entire unchanged native drawBands and original Band.h with real Cinder geometry; adapter only supplies gel bands and intercepts GL draw. Capture twice identically and record source/toolchain hashes. Run reference contracts.
- [x] Add failing TS differential tests against every captured vertex; implement float32 builder. Run tests and verify all cases.
- [x] Commit reference and builder with limitations; task-done.

### Task 2: Integrate direct canvas and native controls
**Files:** components/gel/DirectBandCanvas.tsx, GelCanvas.tsx, GelContext.tsx; lib/gel/gelState.ts; routes/GelPage.tsx; components/chrome/FileControls.tsx; tests/unit/renderMode.test.ts; tests/visual/render-mode.spec.ts; STATUS/ROADMAP.
**Interfaces:** DirectBandCanvas({bands,gelSize}) draws full-display-resolution mesh with opaque black clear. GelState.renderEnabled boolean; SET_RENDER_ENABLED(value), TOGGLE_RENDER actions.
- [x] Write failing tests for default/set/toggle/document replacement/save exclusion, actual checkbox/Cmd-R rendering with image focus, direct pixel samples/overlap/empty, off-mode edits and repeated toggle teardown. Run RED.
- [x] Implement controls and direct canvas using existing geometry batches; cleanup both normal and direct async paths. Recheck latest scene after acquisition; handle DPR/window resize. Preserve overlay/input scene.
- [x] Run GREEN targeted, full units, both browser backends and build. Inspect output capture; no unexplained golden refresh.
- [x] Update status/evidence/limitations, commit, task-done and one final review. One RED→GREEN fix pass for Important findings; preserve decisions in plan, remove only this plan's scratch workspace.


## Decisions, final review and limitations

- Execute the native-defined scene within the user's active web-parity goal and existing ROADMAP authorization. Preserve quirks rather than designing new rendering behavior.
- Use shared premultiplied additive batches on opaque black: RGB is equivalent to native SRC_ALPHA/ONE, and destination alpha stays1. Exact native meshes and browser pixel probes support this; original GL raster/AA equivalence remains unproven.
- Pin source/extraction/Cinder geometry independently in contract tests. Generated manifests alone could otherwise allow self-consistent provenance drift.
- Preserve transient mode through imports and omit it from native files. Keep overlays and loupes independent of the canvas mode.
- Direct mode draws at display resolution; the normal effects texture keeps its established native resolution. CDP scale-only emulation emits no resize or media-query change events (measured); tests therefore combine scale changes with actual viewport resizing. Real monitor-only transitions remain certification work.

The independent final review found one Important issue: retired WebGL contexts could exhaust the browser limit during repeated toggles and evict a live loupe. The single fix pass explicitly loses a detached canvas context after destroying its resources, while retaining connected contexts during resize/StrictMode cleanup. A deterministic regression retains each old context to prevent GC hiding the omission; it failed before correction. Fifty switches now preserve live loupe context, focus and exact paused screenshot on both backends. No Critical or Minor findings; no minor deferrals.

Rulings on review boundaries:
- Original executable raster/anti-alias/font equivalence stays open. Cost of treating mesh comparisons as full certification: unexplained native visual differences ship.
- Physical monitor-only transitions stay open; CDP behavior cannot establish actual monitor notifications. Cost if browser notifications fail: stale canvas resolution until resize.
- Adapter fallback, external loss, hidden-tab restoration and unsupported-browser failure UI remain P5 work. The new toggle-caused context loss was fixed here. Cost if broader gates are skipped: blank/unrecoverable rendering. Whole-app goal stays active.

Implementation also fixed preexisting effects async allocation after teardown and final-blit leaks, each reproduced before correction. Initial test-harness corrections: Vite's optimized React modules use default exports; isolated dev-host pixel tests must target the direct canvas. No product behavior was relaxed to satisfy tests.

Keep the isolated worktree for the ongoing whole-app goal. No merge or publication is part of this increment.

Final verification after the review fix: 2,809 units, 263 browser tests across both backends (one intentional duplicate skip), production build/TypeScript, two native reference contracts and diff whitespace check pass. No goldens changed. Logs /tmp/gel-direct-final-{unit,browser,build,reference}.log; full focused14-case run /tmp/gel-direct-review-green.log.
