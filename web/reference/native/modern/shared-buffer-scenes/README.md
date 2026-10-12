# Native Buffer controls

The capture extracts pinned BufferView draw/updateLayout, text/style/value
formatter blocks, Slider drawing/mapping and SliderView layout methods. Small
adapters supply window/UIFont access, translation-only View frame/bounds, fixture
getter values and selected/notch states. The default disabled-buffer config is
asserted from the pinned Config header. Native constant labels/maxima and molecule
assets are retained unchanged.

Five compositions cover H2O, .5x TBE, 1x TAE, a custom buffer retaining TBE notches,
and a newly created custom buffer without notches. Each draws before/after a
translucent triangle at DPR1/2: twenty native scenes. Sixteen text textures record
the heading, preset labels and parameter labels. Native transparent TextLayout
output, integer image-size division, single-level sampling and native draw order
are preserved. Independent rebuilding repeats/reverifies every scene and texture.
Run `capture.py --output <directory>` to verify; `--update` replaces references.

The actual web BufferView matches all forty RGB comparisons without tolerances
or reference pixel changes. Native float32 mapping matters: fixture value 13.25
normalizes/multiplies back to 13.249999, then displays 13.0 mM after half-step
rounding. This only formats the value; it does not modify stored composition.

Real-app tests separately verify preset mouse-down timing, release outside,
secondary-button activation, retained keyboard activation, disabled concentration
controls and custom-notch lifecycle. ViewCollection and BufferView source forward
mouse-down without a button filter. This drawing harness does not simulate full
native event dispatch or certify original-release GUI history. Modern Cinder/macOS
RGBA8 MSAA4 evidence remains bounded; other control and production gates stay open.
