# Native Help, application icon and brace captures

Twenty native scenes capture Help/settings icon states and inspector brace paint
at content scales 1 and 2. PNGs are copied byte-for-byte from pinned Gelbox assets;
the script checks them against that commit on every run. ButtonView stateColor,
draw, drawFill and drawFrame are extracted verbatim into the Cinder/CGL host, with
native layout colors and empty fill/frame. The brace uses FragmentView::draw's
white texture rectangle contract; its source hash and source assertion are recorded.
The brace size is 44x465 and button size is 32x32, matching Layout.h.

All assets use Layout::uiImageWithPath's mipmapped texture policy, selecting the
2x image at content scale 2. The host combines them with a colored backdrop and
a translucent triangle before or after the asset. It renders RGBA8 MSAA4 and reads
native bytes directly. Texture levels are dumped with the shared actual Cinder
helper ../shared-image-scenes/textures.cpp. Every invocation captures twice and
checks repeat equality before comparing the retained PNG and texture bytes.

Run `python3 reference/native/modern/shared-chrome-scenes/capture.py`; the pinned
clean modern Cinder checkout and release library are required. `--update` replaces
references explicitly. Adding application-button cases preserved all original
12 Help/brace capture hashes. The complete 20-case set was then independently
reverified. This is a source-backed offscreen host, not the original full GUI;
text, additional control geometry and broader display/platform parity stay open.
