# Native band picking

Restore5f51097 GelView::pickBand/pickBands and GelSim::calcBandGeometry/fragAggregateToBand hit rectangles. Native expands above by nonnegative smear then blur, then additionally subtracts flame height; the current max(smear,flame) is wrong when both apply. Native selects the minimum UI-rectangle height, first on ties. All-band loupe picking retains native ordering.

- [x] Add nativeMetadata.uiRect comparisons across the C++ matrix (now505 cases) and explicit additive flame/smear regressions; smallest-height/first-tie/miss tests.
- [x] Share corrected bandUIRect/pickBand between overlay and loupe extraction; derive pointer and hover picks from gel coordinates independent of DOM ordering.
- [x] Real browser overlapping/identical band tests, migrate old synthetic originless band clicks to actual clicks; full verification and fresh review.

Keep rendering and scientific simulation unchanged. Full loupe extraction/ancestry and raster certification remain open.

Evidence: initial unit tests failed for additive flame/smear and missing smallest-height picker; overlapping real-browser tests4/4 failed before UI wiring and pass now. Full1864unit/180browser and production build pass. Fresh review independently ran523 focused unit tests and confirmed native semantics with no blocking findings. No baseline edits. Provenance hashes valid; native capture repeated identically.
