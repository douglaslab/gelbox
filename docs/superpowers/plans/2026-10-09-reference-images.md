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

- [ ] Write failing geometry tests replaying all 24 native cases and lifecycle tests for success/deletion/late decode/failure, plus ordering insert/raise/remove tests. Run targeted Vitest; expect missing implementation failures.
- [ ] Implement helpers with native float32 centered-fit operations, strict Euclidean snap and inclusive edge intersection. Implement resource ownership with explicit generation guard and injected decoder for tests. Run targeted units; expect all pass, exact flags and <=0.0001 coordinate tolerance.
- [ ] Add failing browser tests for real PNG/JPG/GIF drops, static GIF frame, native move/resize/deletion, focus isolation, overlap order, persistence/save exclusion, multi-file errors, and pointer capture loss. Expect missing image views.
- [ ] Integrate file drops and image layer. Shared order includes loupes and dynamically created panels; images fixed in window coordinates. Preserve existing panel and file APIs. Run browser cases on both backends; expect all pass without snapshot refresh.
- [ ] Run full unit/browser suites and production build/typecheck. Update STATUS with exact evidence/limits; commit and task-done. One fresh whole-increment review; one RED→GREEN fix pass for important findings.
