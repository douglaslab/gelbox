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
