# Preserve native straight-alpha PNG filtering

The previous browser ImageBitmap path lost RGB under zero alpha in WebKit, with up to one channel level of visible straight-alpha rounding. Those are not harmless once straight samples are filtered: all ten retained native ImageView scenes failed in WebKit, reaching 64 levels of displayed RGB error. Firefox matched exactly. Before reports and screenshots are retained.

A diagnostic replaced only the WebKit image upload with the native base texture's straight samples. All ten scenes then matched exactly. The diagnostic is retained separately and is not product code or the final test path.

The production fix lazily decodes stored PNG samples using pngjs 7.0.0's browser build and uploads RGBA bytes directly to the existing WebGL2/WebGPU texture paths. Browser bitmaps remain for the existing view lifecycle. A WeakMap ties raw samples to their bitmap without a global strong reference. The wrapper preserves PNG transparency-key RGB that pngjs normally clears and matches Cinder's integer 16-to-8 conversion. Palette/gray/low-bit/16-bit/Adam7 handling is checked against independent native output, not against the same encoder's expectations. JPEG/GIF keep their existing paths.

Validation:

- 44 independently hand-encoded PNG format fixtures match native Quartz RGBA; all 52 raw-decoder comparisons pass, including eight existing profile/orientation/alpha fixtures.
- All 3,051 unit tests pass.
- The new compiled drop test checks actual GPU uploads for all 44 formats on Chromium WebGPU/WebGL2, Firefox WebGL2 and WebKit WebGL2 (176 comparisons).
- Twelve source-level scene/mip tests pass across those four configurations: 40 exact displayed RGB scene comparisons and 56 exact mip-level comparisons. These use real product decoding and upload, without the diagnostic override.
- All 54 image interaction/lifecycle tests pass and cover deletion, late import/decode, backend loss and upload-failure rollback. The WebGPU failure hook now covers writeTexture on tracked image textures as well as the previous bitmap-copy path.
- Eighteen compiled Firefox/WebKit compatibility tests pass. All 48 compiled production tests pass; the build/test log is retained.

Independent review found no blocking correctness issue and reran all 52 decoder units. The unrelated lockfile metadata change identified in review was removed. The decoder adds about 70KB gzip, loaded only for PNGs, and four bytes per pixel retained alongside each bitmap. Parsing is synchronous on the main thread; large-image responsiveness remains unmeasured. Third-party notices accompany the build.

This closes the observed filtered-PNG discrepancy for the retained native scenes; it does not certify arbitrary codecs, original-release full GUI output or shipping Safari. Raw ImageBitmap diagnostic reports still show WebKit's browser behavior, but shared reference-image textures no longer consume those lossy pixels. The legacy canvas presentation still does. D06 JPEG rounding remains pending; there is no accepted tolerance increase in these exact scene comparisons.

Reproduce from ts:

```sh
npm run test:unit
npm run test:production
npm run test:visual -- -c playwright.compatibility.config.ts
npm run test:visual -- -c playwright.image-compatibility.config.ts
```
