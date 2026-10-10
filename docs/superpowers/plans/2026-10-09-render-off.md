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
- [ ] Write reference contract tests for empty/body/blur/smear/flame/equality/negative/fractional/multi-band cases and pinned extraction provenance. Run Python; missing outputs must fail.
- [ ] Compile entire unchanged native drawBands and original Band.h with real Cinder geometry; adapter only supplies gel bands and intercepts GL draw. Capture twice identically and record source/toolchain hashes. Run reference contracts.
- [ ] Add failing TS differential tests against every captured vertex; implement float32 builder. Run tests and verify all cases.
- [ ] Commit reference and builder with limitations; task-done.

### Task 2: Integrate direct canvas and native controls
**Files:** components/gel/DirectBandCanvas.tsx, GelCanvas.tsx, GelContext.tsx; lib/gel/gelState.ts; routes/GelPage.tsx; components/chrome/FileControls.tsx; tests/unit/renderMode.test.ts; tests/visual/render-mode.spec.ts; STATUS/ROADMAP.
**Interfaces:** DirectBandCanvas({bands,gelSize}) draws full-display-resolution mesh with opaque black clear. GelState.renderEnabled boolean; SET_RENDER_ENABLED(value), TOGGLE_RENDER actions.
- [ ] Write failing tests for default/set/toggle/document replacement/save exclusion, actual checkbox/Cmd-R rendering with image focus, direct pixel samples/overlap/empty, off-mode edits and repeated toggle teardown. Run RED.
- [ ] Implement controls and direct canvas using existing geometry batches; cleanup both normal and direct async paths. Recheck latest scene after acquisition; handle DPR/window resize. Preserve overlay/input scene.
- [ ] Run GREEN targeted, full units, both browser backends and build. Inspect output capture; no unexplained golden refresh.
- [ ] Update status/evidence/limitations, commit, task-done and one final review. One RED→GREEN fix pass for Important findings; preserve decisions in plan, remove only this plan's scratch workspace.
