# Native settings button scenes

The pinned ButtonView `stateColor`, `draw`, `drawFill` and `drawFrame` methods
are extracted verbatim into a standalone Cinder/CGL host. Settings PNGs are copied
byte-for-byte from the pinned Gelbox commit, and match the web assets. The adapter
uses the native 0.9 hover and 0.7 press colors, a 32-point button, and empty fill
and frame colors. Layout::uiImageWithPath supplies mipmapped image textures and
selects the 2x asset at content scale 2; the host follows that contract.

Four states (idle, hover, pressed and covered by a later translucent triangle)
are captured at content scales 1 and 2, on a colored backdrop with fractional
placement. Every capture is repeated and compared byte-for-byte. The raw native
image mip chains are also retained in textures.json.

Reproduce with `python3 reference/native/modern/shared-button-scenes/capture.py`.
It requires the pinned clean modern Cinder checkout and its release library;
`--update` explicitly replaces references. Source pins, extraction/input hashes,
renderer and executable hashes are in manifest.json. The texture dump helper is
shared with ../shared-image-scenes/textures.cpp.

These fixtures cover the settings icon and these button states, not other control
geometry, fonts or original-release full GUI output. The surrounding CGL host and
layout adapter are explicit; these are not screenshots of the complete native app.
