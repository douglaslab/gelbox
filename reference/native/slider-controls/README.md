# Slider icon and timeline geometry

Reference: native Gelbox `5f5109705279085fcf6bcac6c8be1c9806b6d3d6`.
The original release was opened through CUA and its gel-settings panel was
inspected at 1365 × 768 client dimensions, display scale 2. Its exact source
equivalence remains unverified; this is source-backed geometry, not native
pixel certification.

`src/Slider.cpp::setIcon` derives logical size from texture size / asset
scale. `doLayoutInWidth` reserves notional 26 × 26 icon slots, positions
track endpoints using those slots and the 16px gutter, centers each image
at its original logical size, rounds its upper-left corner with `roundf`,
then expands the pick rectangle to include the image. Small images retain
the larger slot's hit area. Examples from the bundled 1× PNG headers:

| Asset | Logical size |
|---|---|
| gel-lanes-lo/hi | 32 × 32 |
| clock-lo/hi | 27 × 28 |
| voltage-lo/hi | 27 × 28 |
| size-lo | 8 × 8 |
| size-hi | 27 × 27 |

Their 2× variants are twice these pixel dimensions. The web regular-slider
icons now use decoded dimensions / asset scale, independently of slot size.
Bar and graph layouts retain their prior sizing and remain open comparisons.

`src/GelboxApp.cpp` constructs the timeline with width = gel width - 26 -
3 × 16 under the default settings-button placement, and translates it by
(16, gel height + 16). The web timeline now uses those bounds. For a 390px
gel, the notional slider width is 316px, with a 16px left inset and 58px
right inset. The alternate right-of-gel settings-button configuration uses
16px insets on both sides, as native source does.

`ts/tests/visual/slider-icons.spec.ts` checks decoded image dimensions,
pixel-snapped positions, timeline bounds and the small size icon's larger
clickable slot at display scales 1 and 2 on both renderers. The icon and
timeline cases failed before their respective corrections. Browser captures
use the same client dimensions as the observed native panel.

The two full-page persistent-loupe regression baselines were reviewed and
updated: differences were confined to timeline pixels (bounding box
208,675–550,715 in the 1365 × 800 test viewport). They are web regression
baselines, not native goldens.

Open: handle fill/stroke/shadow and pixel snapping, notch styling, label
font/raster/baselines, buffer bars and graph geometry, and complete slider
gesture semantics. In particular, native SliderView retains the handle's
mouse-down offset while dragging; the web control still maps absolute
pointer position and needs a separate behavioral correction.
