# Complete startup well-outline comparison

The user-supplied native PNG and modern native framebuffer have **zero RGB
pixel differences** in the complete seven-well strip: physical x=416..1195,
client y=260..309. The user PNG's title bar is removed with a 64-pixel offset.
This supports using the modern capture for this region on this setup; it does
not establish original/rebuilt equivalence elsewhere in the application.

Fresh web captures at commit f32bbb3 confirm the previously recorded discrepancy
on both renderers. The diagnostic also tests the simple SVG antialiasing alternative
without changing application source:

| Well rendering | Different pixels | Largest RGB channel error |
| --- | ---: | ---: |
| Existing SVG `crispEdges` | 240 | 122 |
| SVG `geometricPrecision` | 1,856 | 58 |

The complete crop contains 39,000 pixels. Counts use exact RGB equality, with
no tolerance, resizing or ICC conversion in this comparison. Browser canvas
image decoding independently confirms the two native references agree here.
The PNG profile/provenance limitations in the parent manifest still apply.
The report's row counts locate the existing error exclusively on the well rows
282..293. Ordinary antialiasing additionally changes horizontal lines on adjacent
rows 281 and 294. The candidate is rejected, not shipped.

## Source diagnosis and next implementation requirement

Pinned `GelView.cpp` calls the no-width overload `gl::drawStrokedRect` for wells.
Pinned Cinder `draw.cpp` implements that overload with `GL_LINE_LOOP`, whereas
its explicit-width overload uses triangle geometry. Pinned `GelboxApp.cpp`
requests four MSAA samples. The web overlay uses an SVG stroked rectangle with
one physical pixel of width and `crispEdges`. These are different rasterization
paths, despite equivalent nominal geometry. Band focus uses the other Cinder
overload and must not inherit a well-only correction by accident.

For example, native first-well vertical interior pixels at x443/444 are 122/41;
the web is 163/0. Native corner intensities include 171, greater than the isolated
line intensity 163, so simple alpha partitioning alone is insufficient. The
sample coverage/join mechanism must be established before replacing the SVG
path. Do not hard-code this screenshot's pixels. Additional native references
with changed lane counts, fractional positions, DPR and scale are required to
validate a general correction. Full well-outline parity remains open.

## Reproduce

Run from the worktree root. The probe is copied temporarily because the normal
Playwright configuration intentionally includes only acceptance/regression tests.

```sh
cp reference/native/modern/lossless-probe/well-edges/probe.spec.ts ts/tests/visual/temporary-well-edges.spec.ts
npm --prefix ts run test:visual -- temporary-well-edges.spec.ts --output=/tmp/gel-well-edges
rm ts/tests/visual/temporary-well-edges.spec.ts
```

Both diagnostic cases pass because reference agreement is asserted and web
errors are measured/reported. **Their success does not certify web parity.**
Each backend report and both complete screenshots are retained beside the probe.
Product source, existing tests, tolerances and goldens are unchanged.
