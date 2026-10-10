# Reference images in the web application

> Use superpowers:executing-plans for inline execution.

**Goal:** Restore native image viewing through file drops, preserving gestures, view ordering, keyboard ownership and document boundaries.
**Spec:** ROADMAP P4 and reference/native/numerical/README.md image contracts; native 5f51097 is authority.
**Architecture:** Pure float32 gesture helpers checked against compiled native cases; a disposable image store owns decoded ImageBitmaps separately from gel documents. A transient shared view-order list assigns image/loupe/panel z-indices without moving captured DOM nodes. React renders static canvas content with native frame/handle/focus styling.

## Global Constraints

- Existing isolated worktree; Node22; do not edit native sibling or regenerate native outputs.
- Existing parity roadmap and user continuation authorize implementation choices; no new product behavior.
- Images enter via lowercase .jpg/.png/.gif drops, including sequential multi-file drops. Keep native JSON/XML Open filtering.
- Image focus does not raise it; loupes raise. Sample/gel-settings panels are inserted above gel; sample-settings above sample; fragment/app-settings newly append. Preserve focus selection separately.
- Image views survive gel replacement and are omitted from native saves. Delete/Backspace removes; Escape does not. Fully off-window mouse-up removes; edge contact survives.
- Canvas uses createImageBitmap static default/first frame (WHATWG ImageBitmap spec); decoding/color/pixel equivalence remains a certification boundary, not a claim from browser API behavior.

## Review Focus

- Multiple overlapping images/loupes and later panel creation: ordering tests must use actual hit testing, not only z values.
- Dropping several files, with an invalid file in the middle, preserves successful imports and order; a second drop cannot race the first.
- Decode completion after unmount closes its bitmap; deletion and unmount close each owned bitmap once; failures preserve current images/document.
- Resize handles, fractional arithmetic/snap threshold and fully-offscreen deletion follow native captures; cancellation/lost capture cannot leave a live gesture.
- Image keyboard input must not delete selected species or close native sample panels; changing gel documents retains images but clears loupes.

### Task 1: Implement and integrate reference images

**Files:** new lib/gel/imageGeometry.ts, referenceImages.ts, viewOrder.ts; components/gel/ReferenceImageLayer.tsx, useViewLayer.ts; GelContext.tsx, Loupe.tsx, Stage.tsx, FileControls.tsx, GelPage.tsx; unit imageGeometry/referenceImages/viewOrder tests; visual reference-images.spec.ts; STATUS.
**Interfaces:** ImageGeometry uses Rect and Point with imageGesture(start,down,current,natural,mode), imageResizeBox(frame), imageIntersectsWindow(frame,width,height). ReferenceImageStore owns entries `{id,bitmap,frame}` and exposes load(file,point), update(id,frame), remove(id), subscribe/getSnapshot, activate/dispose. Shared view order pure insert/remove/raise functions back React context; useViewLayer(key,above?) registers view and returns zIndex/raise.

- [x] Write failing geometry tests replaying all 24 native cases and lifecycle tests for success/deletion/late decode/failure, plus ordering insert/raise/remove tests. Run targeted Vitest; expect missing implementation failures.
- [x] Implement helpers with native float32 centered-fit operations, strict Euclidean snap and inclusive edge intersection. Implement resource ownership with explicit generation guard and injected decoder for tests. Run targeted units; expect all pass, exact flags and <=0.0001 coordinate tolerance.
- [x] Add failing browser tests for real PNG/JPG/GIF drops, static GIF frame, native move/resize/deletion, focus isolation, overlap order, persistence/save exclusion, multi-file errors, and pointer capture loss. Expect missing image views.
- [x] Integrate file drops and image layer. Shared order includes loupes and dynamically created panels; images fixed in window coordinates. Preserve existing panel and file APIs. Run browser cases on both backends; expect all pass without snapshot refresh.
- [x] Run full unit/browser suites and production build/typecheck. Update STATUS with exact evidence/limits; commit and task-done. One fresh whole-increment review; one RED→GREEN fix pass for important findings.

## Final review and decisions

The independent whole-increment review identified two Important issues, both accepted: a pending drop could overwrite a later Open, and application-settings mouse controls stole image keyboard ownership. The single fix pass shares a disposable FIFO across Open/Drop, reads current state when each operation executes, and preserves focus on settings pointer-down. Browser regressions reproduced both failures before correction; the queue also has failure-recovery and lifecycle invalidation tests. No Minor findings were deferred.

Rulings retained from implementation:
- Images own resources outside the gel document, survive replacement, and are excluded from saves. Incorrect ownership would leak bitmaps or lose independent views.
- Shared ordering follows native relative panel insertion; image focus does not raise an image. Incorrect ordering would change overlap and picking.
- Keep the native 16px settings-button bottom gutter. The old inline baseline added 7px; source geometry and an explicit rectangle assertion justify updating the two affected web snapshots.
- Recompute sample-placement geometry after each queued document replacement. Snapshotting the old layout placed a mixed-batch sample in the wrong lane.
- Preserve native static image intent using the browser default/first frame. Decoder, orientation, color and raster equivalence still require native certification.
- Queue Open and Drop together because native processes file actions synchronously in arrival order. Lifecycle guards invalidate late work; an incorrect queue could replace a newer document or act after unmount.
- Prevent settings pointer-down from changing view focus, matching native buttons. Click/checkbox actions retain their existing behavior; the risk is suppressing browser focus where native actually acquires it. The image deletion and sample focus-transfer regression covers the reported path; broader focus certification remains open.

Review boundaries remain explicit: original decoder/raster behavior is not certified; rotation is disabled and rotated stacking is unreachable; full-lane sample import uses the existing reported-error boundary (native standalone sample icons are unimplemented); other preexisting loupe/species control-focus differences belong to the remaining composed GUI gate. None is treated as proven parity.

The isolated worktree is retained for the active whole-app goal; no merge or publication is part of this increment.

Final evidence: 2,794 unit tests, 249 browser tests with one intentional duplicate skip, and production build/TypeScript pass after the review fixes. No extra screenshot updates. Full-suite integration found a redundant Escape in the species-save test helper: Save already closes the menu, and native retained sample focus now correctly receives Escape. Replace that unrelated keypress with a menu-closed assertion. Logs: /tmp/gel-image-review-{units,build,full-browser}.log.
