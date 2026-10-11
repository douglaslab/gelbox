# Original native shortcuts and shipping Safari follow-up

2026-10-11. Original `/Applications/Gelbox.app` executable SHA256
`037514b74bd7fcb673b7a276749fd31bfeabc0773fd11b790457412e905a78a7`.
Web baseline runtime2a7eb31; Safari27.0.1 build22625.1.29.11.28 on macOS27.0.1.

## Native trace

Command-O opened `../file-workflow/native-input.json`. Command-S saved
`native-gel.json`, exactly equal to that input. Option-Command-S with no sample
selected produced no dialog. After selecting lane2, Option-Command-S saved
`native-sample.json`, exactly equal to the input's second sample with native
sample metadata. The JSON files were saved through the original app UI.

## Shipping Safari trace

At the local staged `/gelbox/app/`, Command-O opened Safari's own Open dialog;
selecting the JSON opened it as a new browser tab instead of importing it. That
tab was closed and the original Gelbox tab retained. Gelbox's application menu
Open successfully imported the same native input. Command-S downloaded
`safari-gel.json`, exactly equal to `native-gel.json`. After selecting lane2,
Option-Command-S produced no sample download.

A separate local `keyboard-diagnostic.html` records page keydown events and
calls preventDefault on every event. The actual Safari/CUA keypresses produced:

- Command-S: key `s`, code `KeyS`, meta true, alt false, cancelable true.
- Option-Command-S: key `ß`, code `KeyS`, meta true, alt true, cancelable true.
- Command-O: Safari Open dialog appeared; cancelling it left the page event log
  unchanged (no O event). Both prior Save events had defaultPrevented true.

This isolates the Save Sample handler's character-only matching bug. The fix
recognizes physical KeyS when Option is held; existing ordinary S handling
remains. The compiled regression dispatches the observed mapped event and
compares its complete sample download with the native save. This synthetic
regression does not replace a post-fix shipping Safari UI replay. That replay was temporarily pending after CUA returned cgWindowNotFound;
the completed follow-up is recorded below.

Command-O remains a shipping Safari limitation in this observed configuration;
it is not intercepted by the page listener. The working in-app Open menu is
available. Do not claim complete Safari shortcut parity or silently treat this
as an accepted deviation. No browser security settings were changed.

## Verification

`red.log.gz` retains the mapped-key failure (prevented=false) on WebGL2. Its
concurrent WebGPU case separately timed out at the initial filechooser before
reaching the new assertion; this is not evidence for the mapped-key bug.
After the fix, all10 compiled file workflow cases pass on Chromium WebGPU/WebGL2,
and all10 compatibility cases pass on Firefox/WebKit. `build.log.gz` records
the successful isolated production build. The long memory test's main dist
remains unchanged. The diagnostic HTML is test-only, not part of the app.

The same corrected isolated build additionally passed all3,054 unit tests and
all82 compiled production cases; retained unit/production-full logs record
those release checks. Compatibility coverage for this increment is the10 file
workflow cases, not a fresh full compatibility run.

## Shipping Safari post-fix verification

After UI access returned on2026-10-11, a fresh navigation from the diagnostic tab
to the staged `/gelbox/app/` loaded runtime4ba0139. The app menu Open imported
the same native input, lane2 was selected through the real Safari UI, and
Option-Command-S downloaded `safari-sample.json`. Its complete parsed document
exactly equals `native-sample.json`; no normalization was applied. The download
was1880bytes, modified at2026-10-11T12:18:37.455989 local time, SHA256
`2e6c84e79d524de365c2b7893a67e2115ab9b8d654f6a996a2cb341c4839848e`.
This closes the post-fix shipping Save Sample check. Safari Command-O's browser
interception remains separately unresolved; acceptance of menu Open as its
fallback has been requested but not assumed.
