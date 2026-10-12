# Occupied DNA band transfer and post-save deletion

Original native app: `/tmp/gel-native-reference/extracted/Gelbox/Gelbox.app`.
The starting `input.json` is the native checkpoint from the preceding Shift-band
transfer: lane 5 contains a 719-base fragment and lane 3 already contains an
identical fragment; lane 4 is an empty retained sample. Client viewport
1365×768, DPR 2, with a 28-logical-pixel native title bar.

Press ordinary `a` to clear cached modifier state, then drag screenshot
(918,840) to (694,840), moving the lane 5 band into occupied lane 3.
The original native app retains both DNA fragments separately in lane 3,
leaves lane 5 as an empty sample/tube, selects lane 3 and keeps its Sample and
Species panels open. Save as `native-after-transfer.json`.
Press Backspace without any additional selection, then save
`native-after-delete.json`: one fragment remains, Sample stays open in lane 3,
and Species closes. Because the two fragments have identical payloads, the
save alone cannot distinguish which identity was deleted.

Native Save output was initially written in the dialog's `option-clone`
directory, then moved here without changing bytes. Screenshots were inspected
through computer use; no native pixel golden is claimed.

The compiled case in `tube-movement.spec.ts` imports the native input, selects
its lane 5 band and replays the same drag at client (459,392)→(347,392), then
saves, presses Backspace and saves again. Chromium WebGPU/WebGL2, Firefox WebGL2
and WebKit WebGL2 pass. Both complete downloaded documents match native, with
only the explicit Fragments null→[] encoding conversion for the two retained
empty samples in lanes 4 and 5; both original encodings are asserted. No other
fields or lanes are normalized or omitted. The selected lane, panel visibility,
retained source tube and fragment counts also match the observed native states.

Backend directories contain both screenshots and downloads; production.log and
compatibility.log retain passing runs. All 223 compiled assets match runtime
812ff8a and the preceding qualified bundle. No runtime change was needed.
This covers this occupied DNA transfer and post-save deletion, without loupes;
it does not certify all transfer, selection or cancellation histories.

Run from `ts`:

```sh
npx playwright test -c playwright.production.config.ts tube-movement.spec.ts -g 'native occupied DNA'
npx playwright test -c playwright.compatibility.config.ts tube-movement.spec.ts -g 'native occupied DNA'
```
