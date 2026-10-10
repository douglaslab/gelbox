# Native hover loupes

Contract docs/ROADMAP.md strict native parity; base4a6c86c. Native GelView::updateHoverGelDetailView, openGelDetailView, ViewCollection mouse ordering and GelboxApp keyDown/keyUp are authority.

- [x] Capture source-backed transition cases in pure controller tests: default off, Meta temporary, Meta-L toggle, movement/exit, pointer-down rollover clearing without immediate refresh, drag/source updates, pointer-up, document replacement, browser cancellation/blur.
- [x] Render a paused transient derived sample with native frame/callout, no ring, no focus stealing; retain shared highlights. Bind real hit-tested global pointer/key events and the native AppSettingsView Loupe on hover checkbox, preserve persistent loupe creation/gestures. Track document replacement independently of sample edits.
- [x] Real browser regressions on both backends for key-only activation/release, toggle, blank gel, following, leaving, focus, paused content, edits, persistent creation, drag and cancellation; inspect hover snapshots. Full verification, one fresh review, evidence and commit.

Native event timing matters: mouseDown clears collection rollover after its handler without refreshing hover; subsequent native gel/key/move refresh closes it. mouseUp restores rollover without refreshing. The preview frame is pickable, so entering it closes preview via the old GelView mouseMove; its wedge is not pickable. Browser blur/cancel clears transient state to avoid stuck modifiers/capture. Source follow-up: SampleView::tick disables interpolation and sets the target frame directly; closing views are removed on the next tick. Do not add an animation absent from the pinned behavior. Original raster comparison remains required separately. Do not claim full native visual parity.

Review focus: native versus DOM hit targeting/capture, event refresh order, no transient focus/ring/persistent bookkeeping, global shortcut and native application-checkbox ownership, document versus sample lifecycle, source selection/highlights, paused reseeding, cleanup/remount and click-through on preview removal.

Completed implementation ce3ea21 plus fresh-review fix pass. Source correction: setGel closes old previews then calls gelDidChange, immediately recreating eligible previews. Final verification2749units/219browserpasses1intentionalduplicateskip/build/typecheck. Evidence and open certification scope in docs/STATUS.md.
