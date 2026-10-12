# Native sample header

`python3 capture.py` rebuilds the pinned Cinder adapter, captures twice, checks
byte-identical output and verifies the retained pixels. `--update` explicitly
replaces references; `--output DIR` retains build/readback evidence.

The adapter extracts `SampleView::drawHeader`, the contiguous icon/heading part
of `SampleView::layout`, and Layout's text and snapping methods from Gelbox
`5f5109705279085fcf6bcac6c8be1c9806b6d3d6`. The complete pinned Layout header
supplies dimensions, colors, string and font. It uses the pinned native tube
asset from `../shared-tube-scenes`. No browser rendering supplies the reference.

`metrics.json` records the exact native heading and icon rectangles, font
identity/descent, texture orientation and filtering. The Sample heading is
83×33 logical pixels at both scales, placed at `(51,-49)` relative to the panel.
The texture uses straight alpha, linear min/mag filtering, and no mip levels.
`sample-{1,2}.png` are canonical top-down copies of native RGBA texture readback,
including transparent RGB. These are shipped unchanged as
`ts/public/assets/native-text/sample{,@2x}.png`.

The four scene captures use integer and fractional panel origins, RGBA8 MSAA4
and raw resolved pixels. One FBO per scale is reused for both positions; this
avoids repeated FBO destruction/recreation within a scale in the CGL adapter.
The native render method itself is unchanged.

This establishes the modern Cinder/macOS Avenir Heavy sample-header reference.
It does not certify other labels, dynamic text, original-release full GUI,
other OS font rasterizers, or the unfinished complete shared UI composition.
