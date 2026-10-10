# Native offscreen startup gel and display filtering

The additional `capture.patch` applies to the modern lossless probe's
`src/GelRender.cpp`. After rendering a nonempty scene, it exports the composite
texture with Cinder `Texture::createSource()` / `writeImage()` and records
texture internal formats, dimensions and pixels per unit. Rebuild the existing
disposable probe and restart it; files appear under
`/tmp/gel-native-lossless-probe/{offscreen.png,formats.txt}`. The parent capture
patch remains applied. `manifest.json` records hashes and provenance.

The native startup texture is 390×520 RGB. Both band and composite textures
report 32856 (`GL_RGBA8`), and pixelsPerUnit is 1. Native's default HD gel flag
is false. The modern-build limitations in the parent manifest still apply.

The exploratory Playwright probe intercepts only the GelCanvas module to read
its composite FBO immediately before blitting. GL rows are flipped to top-down.
Its treatment also replaces sRGB storage with RGBA8. To repeat the pre-fix A/B experiment, use web commit `38a7726` and temporarily
copy `exploratory-probe.spec.ts` into `ts/tests/visual`, run it with
`--project=chromium-webgl2 --workers=1`, and remove the temporary file.
The retained web PNGs contain raw target bytes: the sRGB one has encoded RGB,
whereas the linear treatment contains linear RGBA8 channel values.

Before the fix, decoding the web sRGB channels and rounding to linear 8-bit
leaves 2,045 differing pixels, max channel error 3, sum absolute RGB error 6,327.
The linear treatment matches **every RGB pixel exactly**. The product now uses
linear RGBA8 gel targets on both backends. The new application readback test
compares all 390×520 RGB pixels against this independent native export. It
failed on both backends before the fix and passed afterward. Raw storage bytes
before decoding differed at 7,886 pixels, max channel error 75; those values
are not directly comparable to the decoded-error metrics above.

A second cause explained the remaining display mismatch: GelCanvas explicitly
requested CSS `image-rendering: pixelated`. The current linear texture enlarged
with nearest-neighbor filtering reproduced the old screenshot's band crop
exactly. Native uses linear texture filtering. The retained scaling probe
changes only that CSS value to `auto`; the resulting band crop matches native
**exactly**, on both backends. Product rendering now uses `auto`.

The regression in `ts/tests/visual/native-gel-texture.spec.ts` checks both the
full offscreen RGB texture and displayed band-region bytes at DPR 2. The display
crop is physical pixels [430,310,520,1230], deliberately excluding wells and
other UI. Neither test uses a nonzero tolerance or a regenerated web golden.
These prove this startup ladder's texture and band crop on the tested platform,
not all gel states, other DPRs, alpha behavior, or complete UI parity.
