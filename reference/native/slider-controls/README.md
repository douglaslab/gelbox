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


## Aggregate graph editing

Pinned `Slider.cpp::setValueWithMouse` selects a column from current pointer X
and clamps it to the vector's extent. It derives height from Y, quantizes using
the graph's 0..1 mapped range, then applies notch snapping and updates that one
column. `setLimitValue` clears the entire vector and sets only its first/last
entry to 1. `FragmentView.cpp` configures 0/1 notches, 0.05 value steps and an
8px snap distance with a 32px graph. The web implements these gesture rules.

`graph-gestures.spec.ts` checks native-format saved sample values after dragging
across multiple columns, using both endpoint icons, and cancelling before further
motion. All six backend/scenario combinations failed before correction and pass
afterward. This does not certify native graph raster/layout or all input cases.
Native's getter pads short distributions without changing existing weights and
retains longer ones. The inspector now follows this padding-only conversion,
including zero and sub-0.001 first weights and arrays longer than seven. Empty
arrays display a monomer default; opening the inspector does not rewrite the
document. Sample.cpp::toJson omits an empty Aggregate vector, which the web
serializer already matches. Four additional import/edit/save cases per backend
verify these boundaries against downloaded native-format JSON.

## Graph row and columns

`Slider::doLayoutInWidth` places the common icon center at y=13, then adds
half the graph height to the endpoints: graph bottom y=29, top y=-3. The
web graph now keeps a 26px notional row with a 32px centered graph, so the
following degradation slider retains its native 56px row offset. Graph icons
now use decoded natural size like regular slider icons (11×11 and 28×32).

Each native column spans track width / vector length, inset 1px at each side,
with height exactly weight × 32; zero weights have no blue fill. The web
minimum-height floor is removed. Native draws a gray per-column baseline and
a pale maximum line. Beware `Rectf(ll, ll + (w,-h))`: Cinder's RectT::set does
not canonicalize coordinates, and getUpperLeft returns (x1,y1), so the
per-column stroke remains at the baseline rather than following bar height.
This was checked against pinned Cinder's Rect.h and Rect.cpp.

`graph-layout.spec.ts` checks all five row offsets, graph bounds, decoded icon
bounds, exact zero/full column heights and baseline-stroke placement at 1×/2×
on both web backends. Its geometry and stroke assertions failed before their
respective corrections. Web screenshots are retained as test artifacts. Line
antialiasing/display-scale rasterization and full native panel comparison still
require certification; this geometry evidence does not close those gates.


## Buffer layout from the bar

Pinned BufferView::updateLayout calls layoutSlidersFromBar with a 135×23 bar,
13px icon gutter, and 31px row spacing. Slider::doLayoutFromBar centers the
natural image height on bar center y=11.5 and rounds its upper-left corner.
All four bundled buffer molecule PNGs are 28×26 at 1× and 56×52 at 2×; their
logical high-icon origin is (135+13, roundf(11.5-13)) = (148,-2).
The bar origin is the configured buffer origin plus (66,41), without an
additional icon-row offset. The web now follows this rule in gel and sample
buffer panels, rendering the disabled image separately from the bar.

buffer-layout.spec.ts checks all four bars/images in both panels at 1×/2× on
both renderers. It failed before correction. Existing files.spec.ts additionally
clicks disabled images/tracks and checks imported concentrations in saved JSON.
This does not certify label texture metrics or native raster output. Native
syncPresetToModel sets a vertical notch for the matched preset and retains old
notches when no preset matches; those markings and their per-view retention are now implemented.


buffer-notches.spec.ts checks TBE/TAE/H2O marker positions at both scales, with
X = barX + round(preset concentration / maximum × 135) - 1 for a 1px-wide
CSS stroke. It also observes the live application store to change a sample
composition without recreating its inspector, checks retained marker positions,
and reopens the view to verify that a custom initial buffer has no markers.
Six backend/scenario combinations failed before implementation and pass after.
The stroke uses fill color × 0.8 at disabled alpha 0.5. Exact native pixel-width
and antialiasing comparison at Retina scale remains part of raster certification.


## Handle drawing restoration

Pinned `src/Slider.cpp::draw` and `calcHandleRect` define a 16×20 hit rectangle.
Drawing snaps its upper-left in logical coordinates, then insets each edge by
0.5: a 15×19 fill with radius 4. Enabled handles draw a separate solid black
rectangle at y+3, alpha 0.15, before the fill. There is no blur. Both enabled and
disabled handles then draw an outline using `ColorA * 0.5`, which halves RGB
and alpha. Disabled fill is the enabled RGB mixed halfway toward white.
`ColorAT::operator*(T)` in the pinned Cinder header confirms alpha multiplication.
Cinder's stroked rounded rectangle uses GL line geometry; Gelbox does not override
the default one-device-pixel line width.

The web now represents these layers as SVG rectangles inside the existing handle
hit area, with a 1/DPR logical-pixel outline. Track measurement and resolution
listeners update snapped placement and stroke width; listeners/observer are
removed on unmount. Drag membership continues to use the unsnapped native hit
rectangle, independent of the rendered SVG.

Four display-scale/backend regressions initially failed on the missing drawing
structure. They now cover snapped positions, inset bounds, outline alpha/width,
and enabled/disabled shadows. Twelve existing gesture cases also passed.
Fresh full suite: 333 passed, one intentional duplicate skipped; production build
and TypeScript checks passed. Reviewed web screenshot artifacts show the solid
shadow and outline. No screenshot baselines changed. This is source-backed drawing
restoration: native GL tessellation/antialiasing versus SVG raster differences,
composed native screenshots, and lifecycle stress certification remain open.
