# Native inspector details

The preceding [original-release composed replay](../composed-move/README.md)
exposed these differences. Pinned source confirms the intended behavior:

- `ColorPaletteView::pullValueFromGetter` selects the first color with minimum
  RGB distance. It does not overwrite the actual fragment color. The web now
  computes native float distances, including first-on-tie behavior. The native
  selected backdrop is the inset color rectangle inflated by three pixels,
  with radius four; the web formerly used a two-pixel inward outline.
- `SampleView::layout` sets the header tube to width 19 and places its bottom
  25 logical pixels above the sample bounds. The web formerly centered a
  32-pixel-high icon inside the header circle. The circle itself is unchanged.
- Native FragmentView supplies value formatters for size, mass and aspect,
  but none for degradation. Slider::drawTextLabel only draws a label when a
  formatter exists. The extra web degradation value label is removed; its
  numeric value, snapping and editing behavior are unchanged.

Two new unit cases and six browser cases failed before correction and pass
afterward. Browser checks measure the header geometry at DPR 2, inspect the
selected backdrop, verify label absence, and compare the downloaded complete
Gel document with the imported one. A custom RGB value (.25,.5,.75) now marks
swatch zero while remaining exactly preserved in saved data.

The retained web PNGs are observations from the full suite, not pixel goldens.
Native source hashes and links to the original-release observations are in
manifest.json. These corrections do not establish complete native typography,
color-management or antialiasing equivalence. Full inspector focus behavior and
other composed/native raster gates remain open.
