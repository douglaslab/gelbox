# Native platform accelerator for pointer loupes

Native GelView::mouseDown at gelbox5f51097 checks isAccelDown before its normal
mouse branches. Cinder75f4821 MouseEvent.h maps ACCEL_DOWN to Control for Windows
and Windows Runtime, Meta otherwise. The web's three pointer paths instead used
Meta OR Control regardless of platform. On macOS this created an unexpected
persistent loupe when Control-clicking a tube or band.

A real Chromium Control-click on the tube reproduced the discrepancy on both
renderers; `red.log.gz` retains the two failed no-loupe assertions. A shared
nativeAccelerator helper now selects the native modifier from navigator.platform
and is used by the tube, gel and hover pointer handlers. Other keyboard shortcuts
and hover-preview key policy are unchanged. This correction does not attribute
the earlier native extra-loupe observation to Control; its cause remains unknown.

Verification:72 tube/loupe/hover browser cases pass across both renderers,
including new macOS Control-click cases for tubes and bands; the existing3,051
unit tests pass, three new platform-mapping units pass, and TypeScript checks
pass. Windows/Linux mapping units establish the source contract, not physical
browser certification on those systems. No original-native Control-click GUI
replay was available because window access still returned cgWindowNotFound.

The concurrent two-hour memory run retains the unchanged223 compiled assets
from26b4eb0. This gesture correction has only been checked through the dev server
and units so far. Production build/compiled gates and local website refresh are
pending until the fixed-build session test finishes. Nothing was published.
