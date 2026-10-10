# Shared tubes and floating drag image

Twenty RGB comparisons match independent native tube scenes exactly: seven-lane
idle and selected layouts, twenty-lane selected layout, dragging outside the row,
and moving onto an occupied lane, at DPR 1/2 on WebGPU/WebGL2.

MicrotubeRow now paints each loaded icon beside its native background before the
gel body. The shared image cache owns one tube texture. During an outside-row drag,
the original mouse-down tube rectangle follows the pointer delta and paints after
the gel body, without the gel scissor. Moving over an occupied tube suppresses that
floating icon, matching native picking even though the sample remains in transit.

The legacy path also gains the missing floating image. Pointer capture, sample
transfer and cloning, keyboard selection/deletion during drag, re-entry and capture
loss remain tested. Existing tube-drag tests run in both rendering modes. The new
drag visibility test failed in both modes before implementation.

There is no native microtube1500ul@2x.png. At DPR 2 native falls back to the 1x asset.
The initial shared loader only retried unsuccessful HTTP responses, and failed when
Vite returned an HTML fallback with status 200. It now retries the 1x file after any
failed higher-resolution decode too, matching Layout::uiImageWithPath. The native
DPR2 tests caught this failure and pass after the fix. The legacy floating image
also uses the existing DOM fallback handler. Both-mode/both-scale tests assert
successful decoding as well as visible pixels; they caught its initial missing
handler. Load-error/retry and cache lifecycle checks remain covered.

Reproduce with shared-tubes-native.spec.ts, shared-tubes.spec.ts and tube-drag.spec.ts.
Native source and capture limits are in reference/native/modern/shared-tube-scenes.
These fixtures do not certify sample headers, other controls, text or full GUI
composition. Shared rendering remains development-only.

Final checks: 2,917 unit tests, 687 browser tests (one intentional skip), four
production tests and build pass. All 20 retained comparison results and PNG bytes
match the final full browser run. Ten native captures repeat and independently
reverify. No comparison tolerance or native pixels changed to fit web output.
