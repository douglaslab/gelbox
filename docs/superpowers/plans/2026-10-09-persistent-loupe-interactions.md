# Persistent native loupe interactions

Contract docs/ROADMAP.md; pinned GelView::addLoupe/openGelDetailView/updateGelDetailView and SampleView::mouseDown/mouseDrag/keyDown/updateCallout/draw/tick.

Replace viewport popup coordinates with gel-local frame and anchor. Initial 171-square frame has center anchor+(171,0). Draw its convex-hull callout and 10.4-radius anchor. Match sharp frame/focus/shadow treatment; remove non-native close button. Persistent loupes take keyboard focus; Delete/Backspace/Escape close only that loupe; Tab does not cycle an original sample through a synthetic view. Pointer down brings it forward. Drag frame, anchor, or wedge with native offsets; Cmd-create works over blank gel and initially drags both. Release/cancel/lost capture must end the gesture. Resize/scroll follows gel coordinates. Frame-only moves/reordering must not regenerate synthetic content. Detail simulation runs paused (timeScale0), including preroll.

- [x] Failing browser workflow and frame/gesture state regressions; native paused reference cases.
- [x] Implement gel-local frames, three drag modes, focus/close, paused detail, stable derived content.
- [x] Full checks, inspect images, fresh review/fix pass, update evidence, commit.

Hover previews/shortcut, object identities/off-document retention, cross-view scheduling and full native screenshot certification remain open required work. Current CUA reference handle fails cgWindowNotFound; source available and native numerical harness usable, so implementation is not blocked. No new native screenshot claimed.

Evidence: docs/STATUS.md “Persistent loupe frames, gestures and focus.” Fresh review anchor-overlap issue reproduced/fixed; 2,606 unit / 200 browser / build checks pass. Open backend curvature mismatch recorded for immediate investigation.
