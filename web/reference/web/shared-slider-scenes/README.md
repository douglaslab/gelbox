# Shared slider paint

128 exact RGB comparisons against the pinned native Slider methods cover
standard, bar and column-graph styles, enabled/disabled states, zero/intermediate/
full values, notches, pressed high icons, dynamic text and earlier/later
translucent geometry. DPR1/2 and both WebGPU/WebGL2 are exercised. The native
capture repeats and independently rebuilds/reverifies all 64 reference scenes.

`shared-slider-native.spec.ts` tests the reusable paint function with clock
icons in every style. `shared-slider.spec.ts` tests actual Timeline, Gel and
Species standard/graph controls: later images cover all their paint and deleting
them restores the pixels, held icons clear when released outside, and endpoint
clicks still change values. Existing icon-size/pick-slot and drag-ownership tests
now run in both legacy and shared modes. The DOM retains interaction and value
text while the shared canvas paints controls in native child order.

Initial empty drawing failed all native pixel comparisons. Initial real-app
integration failed all image-cover assertions. The corrected path passes both.
Native pressed icon tint is .5; a new assertion failed the existing .7 CSS tint
before it was corrected. No native references or tolerances were adjusted.

Final verification: 2,920 unit tests, 745 browser tests (one intentional skip),
production build and four root/subpath checks pass. Source hashes are recorded
in `provenance.json`. The native capture documents its adapters and limitations.

Bar drawing is verified but Buffer/Dye parent layout, labels, presets and icons
are not integrated yet. Shared composition remains development-only. Complete
original-release GUI, production, platform, performance and acceptance gates
remain open.
