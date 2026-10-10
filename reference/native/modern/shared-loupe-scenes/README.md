# Native loupe composition

Twelve repeated CGL RGBA8 MSAA4 captures cover six scenes at DPR1/2: idle,
focused, transient, fragment drawn last, anchor inside the frame, and anchor
hover. The frame origin is fractional. The scene combines the loupe's complete
visual sequence with a fragment well and overflowing representative.

The pinned SampleView source specifies anchor rings, callout fill/stroke,
shadow, molecular background, clipped particles, inset focus border, then frame.
The fixture follows this order. Ring geometry is extracted verbatim from legacy
Cinder's Ring implementation and generated independently in `geometry.cpp`.
The source-derived CGL driver uses the known convex hull for these left-anchor
and inside-frame cases; it does not import the web hull implementation.
Particles come from the pinned native MolecularSim executable, and the fragment
well uses the previously captured legacy Cinder geometry.

To reproduce on macOS:

1. Run `python3 reference/native/modern/shared-loupe-scenes/build_geometry.py`.
2. Run `python3 reference/native/modern/shared-loupe-scenes/capture.py`.

Both commands verify retained output by default and accept `--update` for
explicit regeneration. The geometry build needs the pinned modern Cinder host
library; the raster capture needs `/tmp/gel-native-numerical` or `--mesh-build`.
Geometry and raster manifests record inputs, native commits, executable hashes
and repeated-output checks.

This is independent native geometry and source-derived composition, not an
original GUI screenshot. It does not certify arbitrary rotation/scaling, every
anchor direction, dye/highlight combinations, or overlap with unmigrated UI.
