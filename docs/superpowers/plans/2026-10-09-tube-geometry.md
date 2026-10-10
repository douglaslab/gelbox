# Native tube geometry

Spec: ROADMAP P1/P2 strict visual and picking parity. Source 5f51097 GelView::calcMicrotubeWellRect/calcMicrotubeIconRect/drawMicrotubes/pickMicrotube; View::snapToPixel. Native asset 47x89.

- [x] Add source-derived pure tube layout for well, icon, background and hit rect. Validate 7 and 20 lanes and pixel snapping independently from DOM.
- [x] Use that geometry in MicrotubeRow and GelPage instead of fixed 50px/36px dimensions; make pointer picking match drawn bounds including gaps and area down to gel top.
- [x] Real-browser geometry tests at 7/20 lanes, full suites/build, review and status evidence. Existing native captures remain exploratory; no exact native pixel claim.

Verification: 330 units, 156 browser tests, build/TypeScript pass. Fresh review clean. Captures inspected and recorded in reference/web/tubes.json. Capture readiness checks actual browser screenshot because direct GPU-to-2D copies proved unreliable.
