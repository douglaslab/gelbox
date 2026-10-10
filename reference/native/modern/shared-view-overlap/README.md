# Native sample / fragment shared overlap

Five static scenes at DPR1/2 compose the sample shadow, opaque background and
clipped particles with the fragment well and unclipped representative on one
RGBA8 MSAA4 window surface. Cases cover invisible, elongated and round particles,
reversed view order, and fractional positions/extents that exercise View.cpp's
separate origin/size integer conversions. The framebuffer is 400×300 logical pixels.

Particle vertices are captured twice from the pinned native `gel-mesh` executable;
well geometry comes from the legacy Cinder geometry oracle. The standalone CGL
driver follows the pinned SampleView / FragmentView draw order and blend state.
Each raw framebuffer is captured twice and required to match before comparison.

```sh
python3 reference/native/modern/shared-view-overlap/capture.py
```

The manifest pins native source, mesh executable provenance, captured meshes,
well geometry, inputs, driver and output images. These are source-backed static
native graphics references, not original-release GUI replay. Header, focus/frame,
brace, control and text paint are excluded and remain later migration work.
