# Shared palette controls

The actual ColorPaletteView matches 96 exact RGB comparisons against native
palette drawing: twelve selections, translucent overlap before/after, DPR 1/2,
and both WebGPU/WebGL2. Native capture independently rebuilds and repeats all
48 reference scenes. The initial CSS implementation failed all four pixel tests;
the shared geometry implementation passed without changing reference pixels or
tolerances. Fixed rounded geometry is reused across frames.

The selection background paints before every swatch. The palette contributes
after the Species heading and before its sliders, retaining DOM hit regions and
keyboard accessibility. Real-app image covering/removal is checked along with
all twelve original-release saved colors and palette-drag/Delete focus behavior
in both legacy and shared presentation modes.

Secondary-button handling follows the original Cinder commit
`75f4821216a0e105075f3c55be1fbe38784a18c6`:
`src/cinder/app/cocoa/CinderViewMac.mm` forwards rightMouseDown/otherMouseDown and
the corresponding drag events. GelboxApp and ViewCollection forward them, and
ColorPaletteView mouseDown/mouseDrag do not filter buttons. The web primary-only
guard was removed after four failing interaction tests. Right/middle presses,
dragging through cell gutters, release outside, retaining the last valid color
and Sample keyboard ownership now pass. Keyboard activation remains available.
This source-backed check does not replace the remaining whole-app input audit.

Shared composition remains development-only. Menus, checkboxes, overlays,
integrated acceptance, production enablement and platform/performance gates
remain open.

Final verification: 2,922 unit tests and 797 browser tests pass (one intentional
skip), along with the production build and four root/subpath checks. The full
run retains all 96 exact palette screenshots and comparison reports here; prior
128 slider, 40 Buffer and 24 Dye comparisons remain exact. An initial full run
found two legacy WebGPU overflow tests checking bounds before asynchronous
renderer setup; isolated reruns passed. The test now polls the same required
bounds instead of assuming readiness after two frames. No pixel assertions or
tolerances were weakened. The final complete browser rerun passes.
