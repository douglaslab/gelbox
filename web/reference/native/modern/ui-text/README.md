# Native dynamic UI font

`capture.py` builds a standalone Cinder/CGL harness using the pinned Gelbox
Layout and its exact UIFont construction: Avenir Medium at 12 and 24 pixels.
Run without arguments to verify, or use `--output <directory>` to retain a
separate build. `--update` explicitly replaces references.

The capture reads actual CoreText character advances and pair kerning with
Cinder's text attributes. `oracle.json` independently records actual
TextureFont measureString/getGlyphPlacements for 23 representative labels,
an empty string and 1,000 seeded printable ASCII strings at each scale.
The exported atlas reconstructs native RG texture swizzle (R,R,R,G) as
straight RGBA; it is top-down, linearly filtered, and has no mipmaps.

Four rendered scenes cover both scales, fractional local baseline and parent
translation, alternating alpha tint, and translucent geometry before/after
text. Cinder snaps both the input baseline and the resulting glyph rectangle
before applying the parent transform. A missing first snap caused real pixel
failures in the web implementation; the corrected path matches all eight
web/backend comparisons exactly, without pixel tolerances.

The harness repeats each capture and requires identical raw bytes. A separate
build also verified the retained references. `manifest.json` records pinned
source and artifact hashes. This proves the modern Cinder/macOS UIFont path
for native numeric UI strings. It does not certify original-release full GUI
rendering, Unicode shaping, or complete Slider layout/paint/integration.
