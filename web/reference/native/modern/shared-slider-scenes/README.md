# Native Slider paint

`capture.py` extracts the pinned Slider header and its actual drawing, layout,
value mapping, handle/pick rectangle and snapping methods. A small adapter
supplies window content scale and GelboxApp UIFont access; native drawing and
font construction remain unchanged. Four pinned clock PNGs exercise icon size,
placement and tint. They are fixture assets, not a claim that every application
control uses clocks.

Sixteen states cover standard, bar and column-graph sliders, enabled/disabled,
zero/intermediate/full values, notches, pressed high icons and dynamic text.
Each is rendered at DPR1/2 with a translucent triangle before/after it: 64 native
RGB scenes. CGL uses raw RGBA8 with four samples. Every capture repeats identically
and a separate build verifies the retained references. Run without `--update`
to verify; use `--output <directory>` to retain the build and raw readbacks.

The web paint function matches all 128 comparisons across WebGPU and WebGL2.
The initial empty implementation failed the pixel assertions before drawing was
implemented. No native reference adjustments or pixel tolerances were needed.

This is modern Cinder/macOS evidence for Slider drawing and local layout. Real
Timeline/Gel/Species controls use the shared drawing path, tested separately
for image covering/removal, icon states, picking and drag ownership. Buffer/Dye
parent layout, static labels and icons still need integration. It is not an
original-release full GUI certificate or production-enable gate by itself.
