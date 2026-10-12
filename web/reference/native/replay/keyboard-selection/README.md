# Backward keyboard selection and last-dye deletion

The original native executable is unchanged (SHA-256
`037514b74bd7fcb673b7a276749fd31bfeabc0773fd11b790457412e905a78a7`).
For reliable app targeting, a copy has a unique CFBundleIdentifier; only
Contents/Info.plist differs, and only that logical field was changed. See
provenance.json. This is not a rebuilt or instrumented executable.

Observed native sequence, client 1365×768 at DPR2:

1. Open input.json (identical to ../file-workflow/native-input.json), click
   occupied lane2 tube. Sample panel opens with no species selected.
2. Shift-Tab does not select anything or open an inspector.
3. Click the first DNA band at client (292,181). Species shows 2500bp.
4. Shift-Tab deselects it and closes Species; a second Shift-Tab wraps to the
   last fragment, Orange G, showing Buffer + Dyes and its selected band outline.
5. Backspace removes Orange G; its concentration becomes 0mM, while Sample and
   Buffer + Dyes remain. Save Sample records native-last-dye-deleted.json.

The saved sample equals the input sample with only its final fragment removed,
including unchanged fractional values, icon, name, identifier and buffer.
The compiled web replay passes Chromium WebGPU/WebGL2, Firefox and WebKit with
an exact parsed sample comparison. Its whole gel also equals the input with
only that sample replaced. Retained result files and logs accompany this trace.
Runtime is 4ba0139 in /tmp/gel-modifier-compiled-bdc7fbd/ts/dist; it was not rebuilt
or modified for these tests, because the two-hour stability run shares it.

The first test attempt kept the browser pointer on the band. Chromium/Firefox
kept Species open due to rollover priority, while WebKit passed. Native CUA
showed no rollover outline after deselection. Both source implementations give
rollover precedence over selection, so the final web test explicitly moves the
pointer away after selecting DNA, before keyboard traversal. This aligns the
observed no-rollover state; it does not establish physical hover parity, explain
CUA pointer delivery, or justify a product behavior change. No runtime fix was
made. This finite replay covers initial no-op, first-species deselection, backward
wrap to the last dye and deletion. It does not claim every backward step, mixed
hover/keyboard history, or modifier drag is certified.

Commands (from the isolated build's ts directory):

```
npx playwright test -c playwright.production.config.ts keyboard-selection --workers=2
npx playwright test -c playwright.compatibility.config.ts keyboard-selection --workers=2
```
