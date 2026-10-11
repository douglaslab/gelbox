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
from26b4eb0. The gesture correction was then built independently under
`/tmp/gel-modifier-compiled-bdc7fbd` using `git archive bdc7fbd ts`, installed
dependencies, and linked read-only reference fixtures. The existing76 production
cases pass, as do the two added compiled Control/Command cases. The full58-case
Firefox/WebKit suite and all3,054 units pass. The new compiled interaction test
was copied into this source snapshot after the initial76-case run; runtime source
remained identical tobdc7fbd. The223 resulting asset hashes are retained separately.
The long memory run’s223 original asset hashes were rechecked and remain unchanged.

The local website was then staged directly from this verified isolated build.
All626 tracked TypeScript workspace files were compared against sourcef017f10
and matched. Website commit5440489 records that source and the verification
commands. All223 disk/HTTP asset hashes match, and both Gelbox routes return200.
The memory run’s separate223 assets were rechecked unchanged. This avoids waiting
for the long run or mutating its build; no publication occurred.
