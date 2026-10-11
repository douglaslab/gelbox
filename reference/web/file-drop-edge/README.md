# Sample file drop at the right gel edge

Source-based parity correction from web parent `6129463`.
Native `GelView::pickLane` at gelbox `5f51097` first calls Rect::contains,
then clamps the calculated lane to the last visible lane. Cinder `75f4821`
Rect::contains includes both endpoints. The retained source excerpts identify
these revisions. This is source evidence, not a new original-native GUI trace.

The web used x < width, so an exact right-edge drop fell back to the first empty
lane. GelPage now includes the edge and clamps its lane index. Existing occupied
lane fallback and outside-gel behavior remain in the reducer.

The compiled file-workflow test drops a named XML sample at the right edge and
one CSS pixel outside. It checks the resulting saved sample lane, two-sample
count and unchanged original ladder. Both renderer cases failed at the exact
edge before the change (`red.log.gz`); the outside case originally used a half
pixel. The first post-fix full run exposed that DragEvent truncates fractional
clientX: a browser probe returned 600 for requested600.5, and601 for requested601.
That half-pixel test had therefore exercised the edge again. Its failure log is
retained; the outside test now uses a whole pixel.

Verification: build,3,051 units,76 full production cases and8 file-workflow
compatibility cases pass. The latter covers Firefox and WebKit. Full native GUI
occupied/full/mixed-drop replay remains W01; this fix does not close that item.
Native and Safari UI access was unavailable during this investigation:
getApp returned cgWindowNotFound for both original native paths and Safari,
while native PIDs71172 and75624 were still running. Neither process was restarted.

The local website was refreshed from source `26b4eb0` and committed as
`66be215`. The updater independently reran3,051 units and76 production cases.
All223 packaged/HTTP-served hashes and both page routes were verified. The
first HTTP check stopped at a filename containing a space; URL encoding that
filename allowed the full check to complete. Nothing was published.
