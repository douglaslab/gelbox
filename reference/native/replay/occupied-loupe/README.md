# Occupied tube drop with persistent source loupe

Original native executable SHA256:
`037514b74bd7fcb673b7a276749fd31bfeabc0773fd11b790457412e905a78a7`.
Isolated bundle org.douglaslab.Gelbox.Reference.Keyboard20261011; only its bundle
identifier differs from the original app. Runtime web812ff8a; all223 compiled
assets match the already staged and stability-tested bundle.

Open input.json: source3001bp in lane1, destination1000bp in lane2, TBE,
time.37, voltage45.85369110107422, aspect1.2000000476837158, mass125.
At1365×768 client/DPR2, Shawn manually Command-clicked the upper lane1 band.
The populated persistent loupe appeared at screenshot frame approximately
(652,278)–(992,618), with its probe at(480,448). After confirming populated
particles, press ordinary `a` to clear cached modifier state. Drag the lane1 tube
from screenshot(472,240) to occupied lane2 at(584,240).

Observed: lane1 tube/band disappears, lane2 tube/band remains, source controls
remain closed, and the same loupe stays at its original frame/probe location
but becomes empty. No second loupe appears. Command-S saves the full native
checkpoint native-after-occupied.json. The save dialog sanitized the supplied
absolute filename into colon-separated text in its previous directory; the raw
saved file was then moved into this evidence directory without content changes.
Native screenshots were inspected through CUA; no lossless native pixel golden
or internal native view-identity capture is claimed.

The new occupied-drop case in tests/production/overlap-picking.spec.ts converts
native screenshot coordinates using x/2,y/2−28 and replays the same sequence
against the compiled app. All four configurations pass. It verifies one retained
loupe, identical frame/canvas DOM elements, unchanged frame/probe coordinates,
positive→zero particle count, one remaining band and no source panel. Every
saved field is compared to the native checkpoint. Time is the sole explicit
comparison conversion: web preserves imported0.37, while native parses it as
float32; both values and that exact conversion are asserted. No other fields,
lanes or samples are omitted or normalized. The destination sample is unchanged.

production.log and compatibility.log retain the runs; each backend directory
contains before/after screenshots and the complete web download. No runtime,
asset, native-reference expectation or numerical tolerance change was needed.
This closes the occupied-destination/persistent-loupe branch of W02. Other
modifier/clone/dye/secondary-button histories and full parity acceptance remain
separate.

Run from ts:

```sh
npx playwright test -c playwright.production.config.ts overlap-picking.spec.ts -g 'native occupied tube'
npx playwright test -c playwright.compatibility.config.ts overlap-picking.spec.ts -g 'native occupied tube'
```
