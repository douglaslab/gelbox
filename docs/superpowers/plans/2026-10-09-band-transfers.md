# Native band transfers and dye release

Authority: native5f51097 GelView::mouseDragBand/mouseUp, Sample::removeFragment/mergeDuplicateDyes. Continue approved strict parity roadmap with existing TS/React model.

Design: a single UPDATE_BAND_DRAG reducer command receives gel-space x/y and current Shift state. It solves vertical position, then transfers the fragment only inside well-width lane interiors and gel height. Append to destination; swap-delete source. Existing empty source samples remain; a destination created by this gesture disappears when leaving it. New samples use TBE. Store temporary destination on BandDrag. Start and transferred selection follow the species. Dyes participate in drag/Alt clone but never inverse-solve. End merges duplicate dyes, first entry metadata/order retained, float32 sum capped125. Invalid trailing selection becomes unfocused after culling. Pointer capture/cancel/lost capture terminate the gesture with current placement retained.

- [x] Source-backed reducer regressions for transfer/order/temporary samples/gutters/Shift/dyes/merge/clone.
- [x] Atomic command and pointer integration, real browser saved-document workflows on both backends.
- [x] Full tests/build, fresh review, fix important findings with RED→GREEN evidence; status and commit.

Scope boundary: native overlap picking, full stable identity/loupe ancestry and native GUI replay remain required later; this increment establishes cross-lane document transitions.

Evidence: 11 transfer unit cases; 10 new real-browser cases across two backends. Full suite1355unit/176browser and build pass. Fresh review found same-lane selection reset; reproduced and fixed. All suggested extra regressions added. No deferred findings. No image baselines changed.
