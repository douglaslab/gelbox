# Native inspector headings and dividers

`python3 capture.py` rebuilds the pinned Cinder adapter, captures twice, checks
byte-identical output, and verifies retained pixels and metrics. `--update`
explicitly replaces references; `--output DIR` retains build and raw evidence.

The adapter extracts complete GelSettingsView/SampleSettingsView draw methods
with null brace textures, their heading layout blocks, FragmentView's heading
draw block, and Layout's text/snap methods. The pinned Layout header supplies
strings, fonts, colors and rule geometry. Fragment well/representative paint and
all child controls are excluded from this fixture.

There are twelve composed scenes: three inspector variants, a translucent view
before/after them, and DPR1/2. Eight canonical top-down straight-alpha PNGs retain
the native text textures. Sampling is asserted linear with a single texture
level. `metrics.json` records the exact native rectangles at each scale.

The scale distinction matters: the 2x Buffer + Dyes texture is 309 pixels wide,
but native integer division lays it out at 154 logical pixels. The 2x Dyes
texture is 33 pixels tall and is laid out at 16 logical pixels; 1x uses 17.
The Dyes lower-left is (139,320), and the sample divider is (67,269.5) to
(304,269.5), including its one-unit overflow beyond the panel's nominal width.

Production copies are in ts/public/assets/native-text and
`ts/src/lib/layout/nativeInspectorText.json`; browser tests require exact byte
identity with these native assets/metrics before comparing pixels.

These modern Cinder/macOS Avenir Heavy captures do not certify original-release
full GUI rendering, BufferView child labels, dynamic slider text, other controls,
or release platforms. Shared presentation remains a development migration.
