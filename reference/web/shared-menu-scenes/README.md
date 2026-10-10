# Shared application menu

The actual FileControlMenu matches 48 exact native RGB comparisons: both
renderers, DPR 1/2, six menu states and translucent geometry before/after. Native
capture independently rebuilds/repeats 24 scenes plus ten shipped text textures.
The initial CSS menu failed all four pixel tests; the shared implementation passed
without changing native reference pixels or tolerances.

The divider paints before children. Children retain native insertion order:
Render, Loupe, optional Save Selected Sample, Save Gel, Open. Captured native text
replaces browser glyph rasterization in shared mode. Native integer texture-size
division fixes the previous fractional Retina button dimensions. DOM hit regions
and accessible controls remain active under the shared paint.

Real-app tests cover pointer press preview without premature model changes,
release outside, left/right/middle activation, and keyboard checkbox/button
activation. The first interaction tests failed before pointer ownership was
implemented. An initial implementation prevented keyboard checkbox defaults;
allowing native keyboard change events fixed the failing Space assertions.
Rendering and input geometry run in both legacy/shared presentation modes.

Later image covering/removal restores the complete menu at both scales/backends.
The first overlap fixture included the reference image's own 16px corner handle
in its expected-white crop (nine pixels at 1x); increasing the covering image's
margin keeps that handle outside the menu region. No production paint or pixel
threshold was changed for that fixture correction.

Shared rendering remains development-only. Gel overlays, remaining input audit,
whole-branch review, integrated native acceptance, production enablement and
platform/performance gates remain open.

Final checks: 2,922 unit tests, 813 browser tests (one intentional skip), production
build and four root/subpath cases pass. All final menu screenshots retained here
match native pixels exactly; prior 128 slider, 40 Buffer, 24 Dye and 96 palette
comparisons remain exact. Source/artifact hashes and shipped texture/metric bytes
were verified against the independently rebuilt native capture.
