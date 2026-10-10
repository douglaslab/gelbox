# Application menu geometry reference

Source: Gelbox `5f5109705279085fcf6bcac6c8be1c9806b6d3d6`,
`src/AppSettingsView.cpp`, `src/ButtonView.cpp`, `src/CheckboxView.cpp`,
and `src/Layout.cpp`. Text extent calculation was checked against Cinder
`f90f332d1a4d453282c76435f3401271f25922f9`, `src/cinder/Text.cpp`.

The app-settings button origin is `(16, clientHeight - 48)`. The divider
is the original 113 × 8 logical-pixel asset at relative `(-4, -18)`.
Widgets are positioned bottom-up: Render, Loupe on hover, optional Save
Selected Sample, Save Gel, Open. Their lower edges are 32 + 28 × index
pixels above the button origin. There is no filled menu panel.

Native text buttons use Avenir-Medium 12 and leading/trailing spaces.
`ButtonView::setup(string, pixelsPerPt)` renders a 1× texture and then
divides its dimensions by the content scale. Checkbox labels explicitly
render at the content scale. Thus the text buttons are half-size at 2×;
this observed original-release behavior is preserved, not normalized.

Run `xcrun swift reference/native/menu/text-metrics.swift` on macOS with
Avenir-Medium installed to reproduce `text-metrics.txt`. The probe uses
CoreText's typographic bounds, matching Cinder's extent calculation:
ceil(width) × ceil(ascent + descent + leading), with zero borders and
leading offset. The 1× button extents are Open 50 × 17, Save Gel 67 × 17,
and Save Selected Sample 139 × 17. The checkbox box is 16 × 16, with
label left 21 and label bottom 18 relative to its frame origin.

The original release was observed interactively with its menu open at
2×. This directory records source-backed geometry and a current-system
font probe, not a frozen native raster or proof of original binary/source
equivalence. Browser text antialiasing/baselines and cross-platform font
substitution still require native visual certification.

`ts/tests/visual/application-menu-layout.spec.ts` checks placement with
and without a selected sample, button dimensions, and decoded Help
assets at 1×/2× on both browser rendering backends. It also captures web
screenshots as test artifacts. These are not native visual goldens.
