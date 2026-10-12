# Font asset distribution inventory

This is a technical inventory, not a determination of Avenir redistribution rights. D03 remains open.

The production bundle includes 46 PNGs under `assets/native-text/`: fixed native headings, menu labels, buffer/dye labels and presets, plus two dynamic UI glyph atlases. Every shipped image has an exact SHA-256 match in the retained native reference tree; `inventory.json` identifies those matches. All 46 also match the fresh production build. These are captured raster assets, not bundled Avenir font files.

The dynamic shaper supports 95 printable ASCII characters at each of two scales. `nativeUiText.ts` throws for other characters. Its current caller is `sliderPaint.ts`, for native numeric UI values; arbitrary imported sample names are not routed through this shaper. This does not establish general Unicode shaping support. Fixed-label textures are used by the sample heading, inspector headings, buffer presets, application menu, and buffer/dye slider labels.

The DOM/native fallback style requests locally installed `Avenir, sans-serif`. The separate web shell imports Inter 400/500/700; those font files are included by Vite. Prior comments describing Inter as a replacement for native Avenir were stale and are corrected. Native parity is not established for platform fallback fonts.

The installed `@fontsource/inter` package supplies an SIL Open Font License notice. Its exact contents are now copied to `ts/public/third-party/inter.txt`, and the production build emits the same bytes at `third-party/inter.txt`. The notice was missing from the previous public notices directory. This change does not provide or imply an Avenir license.

Validation: fresh `npm --prefix ts run build` passed; byte comparisons confirm the installed, public and built Inter notices are identical, and all 46 native text images are preserved. No font pixels, metrics or behavior changed. The website review snapshot was not refreshed.

Before distribution, D03 still requires a decision on the captured Avenir asset strategy and supported platform/text scope. Replacing it with Inter would change the verified native appearance and cannot silently close the requirement.
