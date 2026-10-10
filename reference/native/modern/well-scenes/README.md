# Native well-line matrix and verified rendering prototypes

Sixteen independent native window-framebuffer references vary lane count
(2, 7, 12, 20), physical scale (1, 2) and logical translation (0, .25 on both
axes). The helper uses native `Gel::setLayout`, `getWellBounds` and the same
no-width `gl::drawStrokedRect` overload used by `GelView::drawWells`. It requests
four MSAA samples through the existing application renderer and uses RGBA .8.
Geometry is exported at sufficient precision to preserve native float values.

These are **modern compatibility-build references**, not sixteen original-release
GUI workflows. The 7-lane/scale-2/untranslated case matches the existing native
startup window and the user's PNG exactly throughout the complete seven-well
strip. Other cases extend coverage using the pinned source. Two launches produced
byte-identical complete-window PNGs and cases.json. Retained PNGs are top-left
crops only; raw hashes and build provenance are in manifest.json.

## Results

| Prototype | Exact cases | Remaining error |
| --- | ---: | --- |
| WebGL normal top-down projection/readback flip | 6 / 16 | Coverage and corner differences |
| WebGL reflected projection/unflipped readback | 16 / 16 | None |
| WebGL explicit four-sample RGBA8 framebuffer, canvas AA disabled | 16 / 16 | None |
| WebGPU standard top-down projection, automatic resolve | 0 / 16 | Some native RGB130 corners become RGB131 |
| WebGPU explicit half-up resolve | 0 / 16 | Same RGB130→131 discrepancy |
| WebGPU explicit integer ties-to-even resolve | 16 / 16 | None |

All comparisons are exact RGB-byte equality; no changed tolerances or native
pixels. The final probes assert zero differences for every case. The earlier
JSON reports retain both WebGPU orientation experiments and failing variants.
These prototypes use actual WebGL2/WebGPU drawing, independently of application
renderers. Their success is **not yet an application parity claim**.

For WebGPU, resolve sums the four per-sample byte values, divides by four and
rounds to the nearest integer, choosing the even value on ties. Thus 81.5→82
and 130.5→130, matching these references. Rounding half upward reproduced the
second error. The explicit resolve is necessary on the tested M5 Max/Chromium
setup; do not assume an arbitrary hardware resolve has native's rounding.

An initial native *offscreen FBO* experiment had reversed corner coverage relative
to the native window, despite otherwise identical inputs. It was rejected as a
reference. The retained helper draws the window framebuffer directly and copies
it. Similarly, projection/readback orientation is part of the web contract.

## Native reproduction

Reconstruct the compatibility build using `../README.md`. Apply `capture.patch`
to pinned GelboxApp.cpp after the compatibility changes, copy `WellProbe.h` into
`src`, and use the distinct lossless-probe app bundle ID. Create
`/tmp/gel-native-lossless-probe/well-scenes`, build and launch through app control.
Draw 30 writes sixteen full-window PNGs and cases.json to that directory.
Crop each image to `(0,0,390*scale,50*scale)` using its case's scale. The retained
actual build also contained prior probe includes/capture code; those hashes are
recorded, but the provided patch isolates only this probe's invocation.

## Web reproduction

From the repository root (Node 22):

```sh
cp reference/native/modern/well-scenes/line-probe.spec.ts ts/tests/visual/temporary-line-probe.spec.ts
cp reference/native/modern/well-scenes/gpu-probe.spec.ts ts/tests/visual/temporary-gpu-line-probe.spec.ts
npm --prefix ts run test:visual -- temporary-line-probe.spec.ts --project=chromium-webgl2 --output=/tmp/gel-line-fbo
npm --prefix ts run test:visual -- temporary-gpu-line-probe.spec.ts --project=chromium-webgpu --output=/tmp/gel-gpu-line-even
rm ts/tests/visual/temporary-line-probe.spec.ts ts/tests/visual/temporary-gpu-line-probe.spec.ts
```

The WebGL probe deliberately requests a non-antialiased canvas and constructs its
own four-sample framebuffer, matching the application context constraint. Each
probe reports all sixteen cases and asserts zero pixel differences. No product
code changed. Integration must preserve gel compositing, both render modes,
DPR/resize behavior, recovery and disposal; see the linked implementation plan.
