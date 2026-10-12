# Fragment compositing over colored backgrounds

90 native RGB captures: the 15 fragment well scenes at DPR 1 and 2, over
white, rose (217,45,81), and navy (26,39,65). Well shadow, fill, stroke and
representative are drawn together onto the underlying color. This catches
white halos and erased content hidden by a white-only comparison.

The body executable, pinned sources and legacy Cinder well geometry are those
of [fragment-well-scenes](../fragment-well-scenes/README.md). `capture.py`
verifies their provenance, repeats native mesh and raster capture, and checks
that every white scene exactly matches the existing white reference.

```sh
python3 reference/native/modern/fragment-background-scenes/capture.py
```

`--update` replaces captures explicitly. `--output PATH` retains build products,
both raw capture runs and a fresh report. The manifest records hashes, renderer
and scope. All 90 images were generated then independently recaptured unchanged.

This is standalone native CGL RGBA8 MSAA4 evidence, not original-release GUI
certification. It excludes text, brace, controls, animation and panel overflow.
The colored underlay represents previously drawn content; it does not change
the native application's white window background.

The exact browser audit is intentionally separate from regression acceptance:

```sh
npm --prefix ts run test:visual -- -c playwright.fragment-background-audit.config.ts --workers=2
```

It retains a zero-difference assertion and currently fails. The normal fragment
well test enforces a maximum 2/255 RGB-channel regression bound across all 90
references on each backend. This bounds the separate RGBA8-layer error; it does
not certify native pixel equivalence or close the remaining parity decision.
See [web measurements](../../../web/fragment-background-scenes/summary.json).
