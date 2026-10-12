# Native inverse band solver and drag anchor

Reference:5f51097 GelView::solveBasePairForY, getDragBandYReference and mouseDragBand. Replace web binary search with native integer target/search/termination rules, chosen aggregate tier, missing-band fallback, and Config's50 iteration budget. Preserve mouse-down top-to-pointer offset during vertical drag; Alt clone starts from native slowest aggregate band. Cross-lane band transfer/dye merge/picking priority remain subsequent gesture requirements.

- [x] Extend C++ oracle by extracting solver method verbatim behind minimal well-bounds/config adapter; capture target/aggregate results across existing matrix.
- [x] Failing exact differential tests; replace web solver and document numerical limits.
- [x] Store drag reference top and aggregate in gesture state; use offset and per-sample context in real pointer paths; failing browser multimer-offset workflow.
- [x] Full verification, fresh review and evidence record.

Evidence: 504 native cases / 2,849 exact inverse comparisons; 1,344 unit tests, 166 browser tests and production build pass. Fresh independent review found float-boundary divergence and equal-minimum Alt selection; both fixed after failing regressions. Float32 mobility/geometry are shared by rendering and inverse search. No baselines updated. Remaining numerical limits are documented in the numerical reference README.
