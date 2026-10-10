# Native well compositing extension

The presentation matrix adds 32 scenes: every parent geometry over RGB(20,40,60),
and over the same background with a RGB(180,100,40) rectangle at x0..89/y18..21
in the 390×50 base texture. The native driver linearly enlarges this base before
blending the wells. The two input PNGs are exported from those actual input bytes.

`driver.cpp` creates a headless macOS CGL/OpenGL 4.1 context. It uses native-
captured well coordinates (`cases.h` from the parent cases.json), the same
GL_LINE_LOOP/.8 gray/.8 alpha/source-over primitives as pinned GelView/Cinder,
and four-sample RGBA8 targets. This is a raster oracle, not another complete
Gelbox build or original-release GUI replay. Its positive-Y projection and
unflipped readback reproduce **all sixteen parent window captures exactly**.
The negative-Y diagnostic does not; both paths are produced by the driver.

`capture.py` refuses to extend or verify the colored matrix unless all sixteen
native window comparisons pass. Then it checks all 32 retained colored images
and the input textures. Reproduction (macOS, command-line tools, Pillow):

```sh
python3 reference/native/modern/well-scenes/compositing/capture.py --output=/tmp/gel-well-reference-verify
```

The recorded renderer is Apple / Apple M5 Max / 4.1 Metal - 91.7. An independent
repeat reproduced all expected RGB bytes. PNGs omit irrelevant offscreen alpha:
Gelbox's window reference is opaque, and comparisons concern visible RGB.
No image resizing, tolerance, web-derived expected pixels or ICC conversion is
used. A future display/GPU platform needs separate verification.

## Rounding correction

The original black-only prototype inferred an integer nearest-even resolve.
The colored scenes disprove that as a general rule. Some RGB174.5-style corner
averages become 175 in native, and mathematically identical sums can differ by
sample order. The product WebGPU module now sums **normalized float32 samples in
sample-index order** and lets conversion to the UNORM target quantize the result.
That matches all 48 black and colored scenes exactly. Automatic hardware resolve
and forced integer tie rules each fail subsets of this matrix. Retained failing
and passing comparison reports make that distinction explicit.

The WebGL module matches all scenes using its explicit multisample framebuffer
and standard native resolve. Both modules include the base image in the same
multisample target before the lines; a separate transparent overlay is not used.
The application has not been integrated at this commit.

The attempted GUI compositing probe initially lacked the adjacent asset symlink
and crashed. After correcting that dependency, startup remained in macOS restore
alerts inaccessible through the current UI tool. Those attempts produced no
colored reference pixels. This headless path was accepted only after the complete
sixteen-window-scene cross-check above; it does not waive the GUI parity gate.
