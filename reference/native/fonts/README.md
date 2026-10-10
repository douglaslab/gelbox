# Native font reference

Pinned Gelbox source: `5f5109705279085fcf6bcac6c8be1c9806b6d3d6`,
`include/Layout.h` lines 107–130. Native headings use Avenir-Heavy at 24 pt,
subheadings Avenir-Heavy at 12 pt, and UI/buffer text Avenir-Medium at 12 pt.
Platform font files are not bundled.

## Reproduce the metrics

On macOS with the system Avenir fonts installed:

```sh
swift reference/native/fonts/text-metrics.swift
```

`text-metrics.txt` records CoreText typographic advance widths from macOS 27.0.1
(build 26A434), Apple Swift 6.4. These are current-platform measurements, not
captures from the original Gelbox binary or its historical toolchain.

## Browser verification

`ts/tests/visual/native-fonts.spec.ts` checks the rendered PostScript face through
Chromium CDP and text-node advance widths against CoreText at DPR 1 and 2 on both
renderers. The width tolerance is 0.05 logical pixels for browser layout rounding.
It samples Gel, Buffer, a concentration value and the timeline value. Font checks
are explicitly skipped outside macOS; another platform needs its own font policy.

CSS Avenir weight 900 selected Avenir-Black on the reference Mac. Native requires
Avenir-Heavy, selected by weight 700. Both heading weights now use 700. Widths
alone did not reliably distinguish these faces. UI weight 500 selects the expected
Avenir-Medium. Although the root stylesheet declares font-size-adjust, sampled
controls already compute to `none` because font shorthands reset it.

Four regression cases failed before the heading correction and passed afterward.
The full browser suite passed 329 cases with one intentional duplicate skipped;
the production build and TypeScript checks passed. Reviewed screenshot artifacts
are emitted by the test. No screenshot goldens were changed.

This verifies sampled face selection and advances. It does not certify glyph
rasterization, native texture padding/baselines, all text, cross-platform fonts,
or complete native application screenshots. Those remain parity requirements.
