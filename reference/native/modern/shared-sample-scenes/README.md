# Native sample-panel paint

`python3 capture.py` rebuilds the pinned native adapter, renders every scene twice,
checks byte identity, and verifies retained RGB pixels. `--update` explicitly
replaces references; `--output DIR` retains the build and raw readback.

The adapter extracts complete pinned `SampleView::draw` and `drawHeader`, the
contiguous icon/heading layout, Layout text/snap methods, and ButtonView's four
paint/state methods. The original new-species PNGs and tube PNG are pinned.
The button is placed at the panel's lower right plus the native 16-unit gutter.

Fourteen captures cover seven states at DPR1/2: idle, body hover, body down,
keyboard focus, child button hover/down, and a later translucent view. The panel
is rectangular (200×171) at a fractional origin, so the focus geometry is tested
beyond the square loupe case. The header, shadow, background, inset focus stroke,
one-physical-pixel frame and child button share RGBA8 MSAA4 composition.

The molecular adapter intentionally has no particles or dyes; it implements the
native empty background's three tints. Scissor has no visible effect with no
particles. Existing scientific/particle fixtures provide separate evidence.
These modern Cinder/macOS captures do not certify the original-release full GUI,
all composed molecular interactions, other controls or text, or release platforms.
