# Startup gel texture-format experiment

2026-10-10, web product commit `219b172`, Chromium 131 through Playwright 1.49,
1365×768 logical viewport, DPR 2. Native reference is the parent `startup.png`;
its modern-build and framebuffer-color limitations still apply.

Native `GelRender::setup` creates composite FBOs with Cinder's default RGBA8
format and band FBOs with a default Texture::Format. Cinder's desktop
Texture2d(width,height,Format) also defaults to RGBA8. WebGPU gel targets use
rgba8unorm-srgb and WebGL2 targets SRGB8_ALPHA8. Native HD gel rendering is
false by default, so its offscreen texture uses one pixel per gel unit.

The retained Playwright probe intercepts the served renderer module for WebGPU
or target module for WebGL2 and changes only the intermediate texture format
to rgba8unorm / RGBA8. It asserts exactly one replacement route was used in
each treatment. No product file or golden was changed. Four capture cases
passed twice; this is a diagnostic, not an added release-suite gate.

To repeat from repository root, copy `probe.spec.ts` to
`ts/tests/visual/native-format-probe.spec.ts`, run
`npm --prefix ts run test:visual -- native-format-probe.spec.ts --workers=1`,
then remove that temporary test. Captures are written under
`/tmp/gel-native-lossless-probe` (create it first). Retained captures live here.
Run `python3 reference/native/modern/lossless-probe/texture-format/compare.py`
to regenerate the comparison (Pillow and numpy required).

For the fixed band-region crop, both backends give identical results:

| Storage | Differing pixels | Sum of absolute RGB differences | Maximum channel difference |
|---|---:|---:|---:|
| Current sRGB | 23,645 | 303,975 | 19 |
| Linear treatment | 23,134 | 300,963 | 18 |

Linear storage reduces total difference by approximately 0.99%, leaving most
of the discrepancy unexplained. This establishes a source-format divergence,
but does not justify declaring the raster mismatch fixed. Preserve the current
product until a comparison of native/web **offscreen gel outputs**, before
window/browser scaling, localizes the remaining error. That comparison should
also verify runtime native internal formats rather than relying only on source
defaults. No tolerance was relaxed and no full-scene parity is claimed.
