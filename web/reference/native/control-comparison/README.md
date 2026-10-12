# Gel settings comparison

Native: official Cocoa Gelbox 1.0 release, unchanged, source equivalence still
unverified. Window 2730×1592 physical pixels; client 1365×768 logical, DPR 2;
titlebar 56 physical pixels. Startup ladder, gel settings open, TBE selected,
70 V, time 3:00, seven lanes. Captured through CUA App.getScreenshot after clicking
the observed gear at window coordinate (1164,1405). Cursor/hover effects can be
present around the gear; exclude them from comparison.

The capture API returned **JPEG bytes with a Display ICC profile**, even though
an earlier temporary filename used `.png`. `native-settings.jpg` preserves the
unaltered capture bytes. This finding also means prior captures must have their
actual encoding/profile checked before any pixel comparison; file suffixes are
not evidence of lossless PNG or sRGB.

Web: Chromium WebGL2, 1365×768 viewport, DPR 2, default document with gel settings
open. Captured by native-text-baselines.spec.ts. `before` is the parent product
state; `after` includes the buffer baseline fix. These web files are lossless PNG.
The manifest records hashes and the product base commit. No native source or
binary was changed for this comparison.

## Reproduce analytical crops

Run `python3 reference/native/control-comparison/compare.py` with Pillow installed.
It normalizes embedded profiles to sRGB and extracts matching regions, subtracting
the native titlebar offset. It does not rescale, register glyphs, change weights,
or erase differences. Generated crops are analytical views, not new goldens.

The apparent blue discrepancy is substantially affected by color management:
a sampled native handle pixel is (75,143,226) in the captured Display profile,
but becomes (43,145,233) after conversion to sRGB. Raw source RGB, displayed RGB,
and Playwright screenshot RGB are different comparison spaces. JPEG noise also
precludes exact-byte raster acceptance. Do not compensate this with guessed CSS.

## Baseline evidence

Pinned Slider::drawTextLabel places bar baselines at bar bottom minus 8 and
regular slider baselines at unsnapped handle bottom plus 15. For this fixture:
Tris value baseline 195, voltage 520, timeline 698 logical client pixels.
A zero-size inline baseline probe measured web values 195.5, 520, 698 before the
correction. Bar labels now use an explicit 18px line box and bottom-derived
position to place the Avenir baseline at 195. Four backend/DPR cases check this.

Native text remains visibly heavier in equal-scale crops, beyond this half-pixel
baseline correction. The browser renders the source-specified Avenir faces;
that fact alone does not certify native glyph rasterization. Native Cinder/CoreText
texture rendering, historical executable/font correspondence, horizontal text
snapping and full color-managed application comparison remain open. The comparison
is exploratory evidence, not acceptance of a font-weight substitution or a closed
visual parity gate.
