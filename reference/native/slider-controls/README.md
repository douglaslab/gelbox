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
font/raster/baselines, buffer bars and graph geometry, and complete graph/icon gesture semantics. Regular handle-relative dragging
and four-pixel notch capture are now implemented as described below.


## Regular-slider gesture contract

`src/SliderView.cpp::mouseDown` records handle membership and the current
normalized value before mapping a hit inside `calcPickRect`. `mouseDrag` uses
that original value plus horizontal displacement / track length for a handle
hit, otherwise maps the pointer absolutely for a track hit. It ignores zero
mouse movement. Thus an inside-track handle click changes value initially, but
subsequent motion is relative to the pre-click value; an outside-track portion
of an endpoint handle does not cause the initial value change.

`include/Slider.h` sets `mNotchSnapToDist = 4.f`; `Slider.cpp::notch` compares
in local view pixels. The web's former normalized 0.04 default depended on
track width and is replaced by 4 / track width before normalized snapping.

`ts/tests/visual/slider-gestures.spec.ts` checks these contracts through browser
pointer input. It additionally verifies web pointer cancellation, actual capture
release and held-pointer entry. All twelve backend/case combinations failed
before correction and passed afterward. This is a source-backed restoration;
full native GUI replay and graph/remaining control certification are still open.
