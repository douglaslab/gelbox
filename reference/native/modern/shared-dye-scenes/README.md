# Native Dye controls

The harness extracts the pinned SampleSettingsView style, value formatter and
TextLayout label-creation blocks, Dye constants and Slider drawing/layout methods.
Adapters supply window content scale, UIFont access, molecule loading with native
2x fallback, and the asserted native 0..125 range. Four actual dye rows use native
31-unit spacing, 135x23 bars, 13-unit icon gutters and natural image sizes.

Three scenes (zero, mixed and full values) run at DPR1/2 with translucent geometry
before/after them: twelve native RGB scenes. The full-value fixture highlights
all four high icons to exercise every tint; this is a drawing fixture, not a
claim that one physical pointer presses all controls simultaneously. Eight static
label textures are exported as canonical top-down RGBA. They deliberately keep
the native opaque white TextLayout background, integer pixel-scale size division
and single-level linear filtering.

The actual web DyeRow component matches all 24 RGB comparisons exactly. Native
values display "mM", even though the stored dye quantity is mass; strict parity
preserves that original display convention. A future scientific/UI change must
be separate. The former web label said "ng" and its total-width layout shortened
the bar by including the icon and gutter.

Every native capture repeats identically; a separate build verifies the twelve
scenes and eight label textures. Run `capture.py --output <directory>` to verify.
Only `--update` replaces reference pixels. Source/input/artifact hashes are in
`manifest.json`. This is modern Cinder/macOS RGBA8 MSAA4 evidence, not a complete
original-release GUI certificate. Parent heading/Buffer controls, complete GUI
workflows and broader production/platform gates remain separate.
