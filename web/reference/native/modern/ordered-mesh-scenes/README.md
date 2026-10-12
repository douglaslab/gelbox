# Ordered mesh draw-state reference

Ten 64×64 native RGB captures cover five constructed scenes at DPR1/2:
source-over/additive/source-over transitions; affine scale/translation/shear/
reflection; physical scissors including off-window and zero-width regions;
line-list and line-strip geometry; an empty scene; and clipping reset before
legacy gel-well lines. The fixtures are hand-authored drawing inputs, not web
screenshots. CGL executes those operations on a single RGBA8 MSAA4 framebuffer.

```sh
python3 reference/native/modern/ordered-mesh-scenes/capture.py
```

Each capture runs twice and must match. A fresh invocation verifies retained RGB.
`--update` explicitly replaces reference images; `--output PATH` retains binaries,
headers, both raw runs and a provenance report. Manifest hashes identify inputs,
driver, executable and pinned native source contracts (View/GelView/GelboxApp).

Positive-Y projection and raw row order follow the window-validated native well
oracle. Scissor fixtures are in logical top-left coordinates and multiplied by
DPR before CGL; the reflected raster uses these same numerical coordinates.
Native lines remain one physical pixel wide. The driver transforms local geometry
in a float32 vertex shader before projection. These binary-exact affine fixture
coefficients do not certify every floating-point transform or fractional DPR.

These are source-backed standalone draw-state probes, not original-release GUI
captures. Texture sampling, view registration, fonts, arbitrary transforms and
full-app lifecycle remain outside scope. See [web comparisons](../../../web/ordered-mesh-scenes/README.md).
