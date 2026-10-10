# Native direct-band raster cases

The unchanged `GelView::drawBands` method at Gelbox `5f51097` produced the
14 real Cinder meshes retained under `reference/native/numerical`. Its extraction,
mesh geometry and `GL_SRC_ALPHA, GL_ONE` blend are independently characterized
there. This driver uploads those captured float32 vertices to native macOS CGL,
draws into four-sample RGBA8, adds native `.8` well lines with source-over, and
resolves with OpenGL. It never reads the TypeScript mesh builder or web pixels.

56 references cover all 14 meshes at DPR1/2, with and without wells. Two well
rectangles cross ordinary and fractional bands. Mesh cases include body, blur,
smear above/below, flame and equal-height branch, negative dimensions, zero
brightness, overlap, fractional positioning and clipping. The positive-Y raster
and raw row order follow the window-validated well oracle in
`../well-scenes/compositing`; that proves the narrower well contract, not a full
native Render-off GUI scene.

Reproduce with `python3 reference/native/modern/direct-band-scenes/capture.py`.
The command checks mesh provenance, compiles the CGL driver, repeats every raw
capture twice, and requires exact agreement with all 56 retained PNGs. `--update`
is only for deliberate native recapture. `manifest.json` records hashes,
renderer and limitations. Visible RGB is the contract; the native offscreen
alpha channel is not used to certify display alpha.

`native-direct-raster.spec.ts` runs the real DirectBandCanvas at both DPRs and
compares every RGB channel. The original product failed the fractional case at
both scales/backends (up to 88 levels), because it rasterized bands into a
single-sample intermediate before copying them into the multisample well pass.
It now draws band triangles and wells into the same multisample surface, with
the native additive/source-over order. The intermediate texture and separate
mesh batch are removed. All 56 cases now match on each backend, including wells
crossing fractional edges. Effects mode still supplies its image texture.

`before-*.json` records the initial diagnostic with only the ordinary-position
well; `after-*.json` uses the final two-well matrix. These reports are not directly
interchangeable for the added well; the failing fractional no-well cases are
unchanged and establish RED→GREEN. No preexisting native or web golden changed.

This evidence uses modern native OpenGL and the captured native meshes, not the
original-release window renderer. Complete original-release Render-off GUI
capture, other devices/fractional DPRs, complete controls/particles/loupes, and
release performance acceptance remain open.
