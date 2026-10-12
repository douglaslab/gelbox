# Updated local native download — build20261011

The site's prior1.0.1 package used native5773502. The native repository is now
clean atf880841, including c550c21's stale gel-settings fix and display-scale/
font/Windows compatibility changes. The release source was therefore refreshed
without modifying that checkout or the pinned original reference app.

The isolated `/tmp/gel-native-release-20261011/source` is an exact git archive
of f88084187436d1e604daa2bd7905b1eb1b4df026. Configure/build logs and the exact
configure invocation are retained. Cinder remains clean atf90f332d1a4d453282c76435f3401271f25922f9,
with library hashb41dbbb9992d295c007824264960099be590e31f4eac8105711be25eaa3e8793.

Verified: clean Release build, arm64-only executable, version1.0.1/build20261011,
Mach-O minimum macOS11, only system framework/library dynamic dependencies,
all source assets embedded as actual files, valid ad-hoc bundle signature,
UDZO disk-image integrity, and all105 bundle-file hashes matching after a
read-only mount. The source archive exactly matches179 files from the manifest's
seven build/source/tool paths; design/research materials are not build inputs
and are not in the distribution archive. Bundled Source Sans licenses are included.

Website commit01d8b8b updates the local native DMG, source archive, checksums,
release notes and manifest. Both downloads were independently fetched over
HTTP at127.0.0.1:8766 and matched their new hashes. The web bundle remains source4ba0139.
Original Intel1.0 remains unchanged. Nothing was published.

The updated bundle was not launched or GUI-smoke-tested here because CUA cannot
currently access app windows. The manifest and release notes explicitly mark
that check pending; the old build's tested-macOS claim was removed. Ad-hoc
signing is unchanged and the build is not notarized. Do not describe this new
binary as an original-native parity reference or as GUI-validated. Once UI
access returns, smoke-test startup, Open/save and loading another gel with its
settings open on this exact build before considering the native handoff ready.

## Partial GUI follow-up

Once CUA access returned, launching the exact isolated bundle displayed its
startup seven-lane ladder and3:00 timeline. Command-O and the native file dialog
opened the retained mixed native input: the tube moved to lane2 and the visible
timeline became1:53, with its expected DNA/dye bands. These were direct visual
observations, not retained lossless PNG comparisons. The built bundle remains
byte-identical to the105-file manifest used to verify the mounted DMG.

Two automated clicks on the gel-settings button did not open its panel. After
Open, automated Command-S also produced no Save dialog, including a retry after
an ordinary keypress. These automation outcomes do not establish a physical
input defect; earlier modern-Cinder background-input discrepancies are documented
separately. Manual settings/Command-S confirmation was requested. Startup/Open
are now observed, but Save/edit/settings GUI smoke remains unverified. No native
source change, process replacement or exception waiver was made.

## Keyboard focus and successful Save Gel

Clicking the native window title bar at screenshot(760,32) restored keyboard
focus: Command-S then opened the native Save dialog. Saving `native-roundtrip.json`
produced a complete parsed JSON document exactly equal to the input at
`../../replay/file-workflow/native-input.json`, with no normalization. The
previous failed key attempts are therefore not a demonstrated Save defect.

A subsequent title-bar focus followed by another click on the visible settings
button still did not open its panel. The settings/mouse check remains pending;
startup, Open and exact Save Gel roundtrip are now verified on this exact binary.
The site's manifest and release notes record this narrower completed scope.
The originally requested manual Command-S step is no longer needed. No runtime
or packaged-file bytes changed during this verification.

## Current mouse-input recheck

On the later release-profile validation pass, the exact isolated bundle was
opened at its startup ladder. All105 bundle hashes still match the distribution
manifest. Clicking the title bar and then the visible gel-settings button at
screenshot(1164,1414) highlighted the button but did not open a panel. Raising
the window through its exposed accessibility action and repeating the click
had the same outcome. This confirms the automation limitation persists, without
establishing that physical clicks fail. A physical-click observation is pending.
No app bytes or document inputs were changed by this check.
