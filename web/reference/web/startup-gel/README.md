# Complete startup gel comparison

Native reference: the user-supplied lossless window PNG retained under `reference/native/modern/lossless-probe/user-startup.png`. These web PNGs were captured by `native-well-stroke.spec.ts` at 1365×768 CSS pixels, DPR2. Their names indicate graphics backend, not native provenance.

The native title bar occupies 64 physical pixels. After removing that offset, the entire 780×1040 physical-pixel gel rectangle at (416,248) matches exactly in both effects-mode backends: zero differing RGBA channels. This includes all wells, bands, background and gel edges together. The normal browser regression now checks this whole rectangle. `comparison.json` records PNG hashes and independently measured exact results.

This certifies the default startup gel at this size/scale only. Full application captures retain differences in tubes, control edges and text; native window corner masking is also present. These are not accepted deviations. Direct-mode tests still compare the complete well strip only, because its band display intentionally differs from effects mode. Other documents, scales, full panels, molecules/loupes and native GUI workflow acceptance retain their separate requirements.
