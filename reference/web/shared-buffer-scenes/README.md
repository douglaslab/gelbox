# Shared Buffer controls

40 exact RGB comparisons exercise the actual BufferView against pinned native
drawing/layout methods: all presets, custom composition retaining previous
notches, and newly opened custom composition without notches. Both rendering
backends and DPR1/2 are tested, with translucent geometry before/after the view.
Native captures independently rebuild/repeat twenty scenes and sixteen text
textures. Static text and molecule assets are shipped unchanged.

The shared parent contribution paints Buffer heading/preset selection/text/frame
before the four disabled concentration sliders. Presets apply immediately on
mouse-down, including secondary buttons, and keep their keyboard action. Native
half-step formatting follows float32 normalization, without mutating model data:
13.25 remains stored as 13.25 while its native label displays 13.0 mM.

`shared-buffer-native.spec.ts` initially failed all pixel assertions before
implementation. The first attempted run lacked native files and was not counted
as a valid failing test. `shared-buffer.spec.ts` failed mouse-down timing before
correction, then verified both real panels, release outside, keyboard activation,
disabled rows and image covering/removal. Existing `buffer-notches.spec.ts` now
runs both rendering modes and verifies unchanged raw custom values and notch
lifecycle. A test initially assumed 13.25 would display 13.5; native pixels and
float arithmetic proved 13.0, so the test assumption was corrected. No native
reference pixels or tolerances were changed.

Final checks: 2,922 unit tests, 785 browser tests (one intentional skip), production
build and four root/subpath checks pass. Prior 128 slider and 24 Dye comparisons
remain exact. Retained PNG pixels match the final full-suite output.

Shared composition remains development-only. Remaining control paint, original
GUI and full interaction replay, browser/platform/performance checks, production
enablement and user acceptance remain open.
