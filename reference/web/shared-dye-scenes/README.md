# Shared Dye controls

24 exact RGB comparisons exercise the actual DyeRow component against the native
Slider and SampleSettingsView label/style methods. Zero, mixed and full values,
pressed-icon tint, native text and molecule assets are drawn with translucent
geometry before/after them at DPR1/2 on WebGPU/WebGL2. Source and limits are in
`reference/native/modern/shared-dye-scenes`; native rebuilding/repeated readback
reproduces twelve scenes and eight label textures.

Native bar width is 135 excluding icons; label and molecule images sit 13 units
away at their natural integer-scaled dimensions. Names are low-endpoint controls.
Value text is black and displays native "mM"; the previous web "ng" display was
not faithful to the original UI. Empty-fill colors use native float interpolation
in shared paint. Native opaque label texture backgrounds are preserved.

`shared-dye-native.spec.ts` initially failed all pixel comparisons, then passed
without changing reference pixels or tolerances. `shared-dye.spec.ts` verifies
real-app endpoint actions, half-bar clicks, geometry and image covering/removal.
The existing sample-settings edit/save tests now run in both rendering modes.
Label/asset byte equality is checked separately. The captured full-value fixture
highlights all icons via the presentation attribute to test each texture tint;
physical mouse interaction is covered by the real-app tests.

Final checks: 2,921 unit tests, 767 browser tests (one intentional skip), production
build and four root/subpath checks pass. The prior 128 native slider comparisons
remain exact. Retained PNG pixels and hashes match the final full-suite output.
Buffer concentration controls/presets, remaining control paint and broader GUI,
production, browser, performance and user acceptance gates remain open.
