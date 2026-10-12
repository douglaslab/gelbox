# Native gel band focus reference

`capture.py` compiles the pinned GelView::drawBandFocus method against modern
Cinder. Fixture bands supply UI rectangles, focus colors and sample/fragment
identity tokens; those adapters are explicit and do not replace scientific band
or full GUI replay checks. The pinned SampleFragRef equality expression is
asserted. Source hashes include GelView, GelSim, Sample and View definitions.

Eleven cases cover no focus, selection, hover, combined selection/hover, multiple
bands belonging to the same fragment, different sample/fragment identities,
overlapping strokes, each gel clipping edge, and a subpixel rectangle. DPR 1/2
and translucent geometry before/after give 44 scenes, repeated byte for byte.

The window scissor uses native float32/truncation arithmetic, converted from
native lower-left coordinates to this harness's positive-Y readback axis. That
axis conversion was corrected before running the first web differential test.
The draw method and Cinder stroke geometry are unmodified.

Run `python3 reference/native/modern/shared-band-focus-scenes/capture.py` for an
independent rebuild and verification; `--update` explicitly replaces references.
This is a bounded modern-Cinder source-method reference, not original-release
full-window raster or input certification.
