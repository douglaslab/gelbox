# Shared native dynamic text

Eight exact RGB comparisons cover native UIFont glyphs on WebGPU and WebGL2 at
DPR1/2, fractional local baseline and parent translation, alpha tint, and
translucent geometry before/after text. Actual Cinder TextureFont draws provide
the native reference. The shared registry and asset cache provide the web path.
No pixel tolerances or native reference adjustments were needed.

All 2,048 independent native string measurement/placement results match the web
ASCII shaper. Tests assert that shipped metrics and atlas PNGs equal the native
capture bytes. Native rebuilding/repeated readback independently reproduces the
four scenes and two atlases.

Reproduce with `native-ui-text.spec.ts` and `nativeUiText.test.ts`. Final checks:
2,920 unit tests, 721 browser tests (one intentional skip), production build and
four root/subpath production tests pass. The capture's source and limitations
are documented in `reference/native/modern/ui-text`.

This is a reusable rendering foundation for native numeric values. Complete
Slider paint/layout and real control integration remain to be implemented.
Shared rendering remains development-only; original-release full GUI, platform,
performance and final acceptance gates remain open.
