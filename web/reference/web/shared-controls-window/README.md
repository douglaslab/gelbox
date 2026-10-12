# Complete settings and menu workflow

Five complete window states match native exactly on each backend: ten RGB
comparisons at 1365×768/DPR2, without crops, masks or tolerance. The web test uses
the real file import, settings button, application menu and Render checkbox.

The sequence opens gel settings, opens the menu alongside it, disables Render,
closes settings and reopens the menu, then enables Render again. Each stage is
compared to the corresponding native frame after the same mouse transitions.
All controls are ready before capture. No application code change was required.

`provenance.json` records the source commit, test/native manifest hashes and web
outputs. See [native reconstruction](../../native/modern/full-window-controls/README.md).

This covers one settings/menu history at one size/DPR. Overlapping images/loupes,
particle histories, original-release full GUI, production shared rendering and
browser/platform/performance certification remain open.
