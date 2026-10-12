# Font smoothing investigation

Host: macOS 27.0.1, Apple Swift 6.4, system Avenir-Medium. Native target remains
Gelbox `5f51097`; recorded official executable/source equivalence is unverified.
Cinder source examined at `f90f332d1a4d453282c76435f3401271f25922f9`:

- `src/cinder/Font.cpp`: CGFontCreateWithFontName, then CTFontCreateWithGraphicsFont.
- `src/cinder/cocoa/CinderCocoa.mm::createCgBitmapContext`: DeviceRGB premultiplied
  bitmap context; no explicit font-smoothing disable.
- `src/cinder/gl/TextureFont.cpp`: white glyphs drawn into an atlas with the legacy
  CoreGraphics glyph API, then tinted at drawing time. Glyph destination rectangles
  are individually snapped; DOM text does not duplicate that placement contract.

## Controlled native-platform probe

Run `swift reference/native/fonts/smoothing/raster-probe.swift /tmp`.
The output directory must already exist. It writes eight transparent PNG probes
for the same 24px Avenir-Medium text, varying CTLine/legacy glyph API, smoothing,
and black/white rendering. It reports actual CG/CT face names. These probes are
CoreGraphics experiments, not captures from Gelbox or a reconstruction of its
complete glyph atlas and GL drawing path.

Measured alpha sums (0..255 coverage, all pixels) on this host:

| Smoothing | Draw color | CTLine | Legacy glyph API |
|---|---|---:|---:|
| Off | Black | 125300 | 125300 |
| Off | White | 125300 | 125300 |
| On | Black | 144038 | 144038 |
| On | White | 165373 | 165373 |

Both paths report Avenir-Medium. Smoothing and draw color change coverage without
changing the font face. White atlas glyphs can therefore look heavier after tinting
than text drawn directly in its final color. This explains a mechanism, not exact
agreement with the historical executable's raster.

## Browser experiment and correction

The root stylesheet forced `-webkit-font-smoothing: antialiased`, inherited by the
parity workspace. On this Mac, changing only this setting to `auto` visibly increases
coverage toward native text. `web-antialiased.png`, `web-auto.png`, and
`web-subpixel-antialiased.png` record a DPR 2 Chromium WebGL2 experiment using the
same opened gel settings panel. Auto and subpixel-antialiased captures are byte
identical; antialiased differs. No face, size, stroke, or weight was changed.

The workspace now overrides the dev shell smoothing settings to auto. Four existing
macOS font-face/advance cases at 1×/2× now also assert the effective smoothing mode;
they failed before the correction. Their face and width checks remain unchanged.
Browser support outside this macOS certification environment remains a release gate.

Remaining differences include atlas color-dependent smoothing, individually snapped
glyph placement, text rasterization across browser engines, and color-managed
comparison with the lossy native capture. Do not treat this as whole-app pixel parity
or compensate the remaining discrepancy by choosing a different font weight.
