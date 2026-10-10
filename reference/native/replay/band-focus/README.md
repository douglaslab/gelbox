# Band focus drawing correction

The preceding original-release palette replay exposed an overly thick web band
outline. Pinned Gelbox `5f51097`, `src/GelView.cpp:391–411`, supplies the contract:
`mUIRect.inflated(vec2(1))`, a 2-logical-pixel stroke, and focus-color alpha .65
for selection plus .35 for rollover, capped at 1. `src/GelSim.cpp:332,372` assigns
half the dye color to dye focus and the original fragment color to DNA focus.

The web had reused the 4-pixel molecular-particle outline width and yellow
particle hover color. It now uses native band geometry, color and opacity.
Coordinate-based picking still uses the uninflated native UI rectangle.

`native-band-focus.spec.ts` checks DNA hover, selection plus hover, selected-only
state, exact outward rectangle geometry and dye-specific color on both renderers.
The new DNA test failed before correction. The retained PNGs show corrected web
states; native comparisons remain the earlier `../palette-focus` JPEGs, which
are not lossless pixel goldens.

Three older hover assertions expected the obsolete yellow band stroke and were
corrected to the fixture's native species colors. Two hover-preview screenshot
baselines include the underlying gel; their old band outlines changed. Both
diffs were visually reviewed, then those two baselines alone were regenerated.
No screenshot tolerance was changed. Full native raster and interaction parity
remain open, including post-drag rollover timing and palette float precision.
