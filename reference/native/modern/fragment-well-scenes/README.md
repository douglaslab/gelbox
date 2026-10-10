# Native fragment well and representative reference

Thirty RGB images cover 15 scenes at DPR 1 and 2. They draw a white 303×520
panel, rounded shadow, rounded fill, one-physical-pixel stroke, then the native
representative body, in `FragmentView::draw` order. Cases include an empty well,
ordinary/degraded/multimer particles, several fade values, and large particles
crossing the well edges. The subquantum fade case exercises coverage even when
alpha would round to zero in a separate RGBA8 layer.

`build_geometry.py` extracts the legacy Cinder `RoundedRect` and
`WireRoundedRect` declarations and method bodies verbatim from the pinned
revision into a separate namespace. Modern Cinder supplies compatible support
types and linking. The resulting position streams retain the native triangle
fan and independent line primitives; no CSS or web geometry is used.
`geometry-provenance.json` pins those inputs and output.

`capture.py` runs the existing pinned native particle executable twice with
`cases.json`, verifies the well geometry, then renders both together with CGL
RGBA8 MSAA4 and native source-over blending. The zero-fade case draws no
representative, matching the native strictly-positive-fade selection condition.
Each raster capture runs twice and must produce identical bytes.

```sh
python3 reference/native/modern/fragment-well-scenes/capture.py
```

Verification compares freshly rendered RGB pixels to every retained image.
`--update` explicitly replaces references and provenance. `--output` retains
build products and both raw captures in a chosen directory. `build_geometry.py
--update` is separately required to replace geometry.

This is a source-derived, standalone CGL reference, **not original-release GUI
certification**. It excludes headings, braces, child controls, animated choice
of representative, and overflow outside the panel. The panel dimensions locate
the native well; they do not establish a native clipping boundary. Positive-Y
projection and raw row order follow the previously window-validated well oracle.
