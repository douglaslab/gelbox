# Native application menu reference

`capture.py` compiles pinned AppSettingsView setup/draw, ButtonView and CheckboxView
setup/draw, and Layout text rendering against modern Cinder. Native headers retain
their members/defaults, with private fields exposed for capture. A translation-only
View adapter supplies frame/bounds and explicit hover/press/hit flags. Gel and App
callbacks are stubbed; asset lookup and display scale are explicit adapters.

Six states cover the optional sample button, checked/unchecked values, hover,
press inside and press outside. Each renders at DPR 1/2 with translucent geometry
before/after the menu: 24 scenes and 10 text textures, repeated byte for byte.
The manifest records source/input/artifact hashes and renderer limits. Run
`python3 reference/native/modern/shared-menu-scenes/capture.py` to independently
rebuild and verify; `--update` explicitly replaces references.

ButtonView calls renderUI without a scale argument (a 1x texture), then divides
its integer texture size by the display scale. At 2x the button heights are 8,
not 8.5; widths are 25/33/69. CheckboxView rasterizes at the requested scale and
also uses integer size division: its 2x label heights are 16, positioned at y=2.
The text textures remain straight RGBA with native linear, single-level sampling.
The divider uses the pinned native image and mipmaps.

These captures establish drawing/layout evidence, not full original-executable
GUI, input history, or platform certification. Mouse ownership and real app
callbacks are exercised separately in browser tests.
