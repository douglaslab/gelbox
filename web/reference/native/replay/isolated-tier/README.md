# Original-native isolated trimer: two grab offsets

The installed `/Applications/Gelbox.app` runs independently of the reference
window waiting for Shawn's Option-drag. Its executable SHA-256 is
`037514b74bd7fcb673b7a276749fd31bfeabc0773fd11b790457412e905a78a7`, identical
to the pinned original-release reference. All 99 resource-file hashes also match
the extracted reference bundle; the manifest retains them. The existing clone
fixture was not changed.

`input.json` contains one 3000bp species with Aggregate `[0,0,1]`, Mass200,
AspectRatio1 and Degrade0 in lane1, with Voltage70 and Time0.625. The unique
nonzero aggregate entry isolates the trimer band: native GelSim creates bands
only for positive weights, using aggregate `m+1`. The observed species preview
also contains three-part aggregates. This avoids inferring which tier was picked
from an ambiguous overlapping multi-tier image.

At the original 2730×1592 window capture (1365×768 client, DPR2, 28 logical
pixels of title bar), perform these independent sequences:

1. Open input.json, press ordinary `a` to clear any leftover modifier state, then
   drag screenshot (472,388) → (472,488), near the lower edge of the band.
   Save Gel as `native-lower-edge.json`.
2. Reopen input.json, press `a`, then drag (472,368) → (472,468), starting
   20 physical pixels higher within the band. Save as `native-upper-grab.json`.

Both native saves are identical and differ from the input only in **Bases1672**.
Both drags open Sample and Species, leave the selected band in lane1, and display
1700bp. The mass label displays the slider maximum175ng while the saved Mass200
is preserved. Native screenshots were inspected through CUA, not retained as
pixel goldens. Native GelView's dragDeltaY compensates for the initial grab point
before its inverse calculation; these two independent saves verify that behavior
for the isolated third tier.

The compiled test `ts/tests/production/isolated-tier.spec.ts` replays both
gestures with x/2, y/2−28 coordinates. It requires exactly one band, asserts both
grab points lie inside its bounds, checks the Species panel opens, and compares
the entire saved gel to each native checkpoint without normalization. Four
production cases and four compatibility cases pass: two offsets each on
Chromium WebGPU/WebGL2, Firefox WebGL2 and WebKit WebGL2. Logs, downloads,
screenshots and compiled asset hashes are retained. Runtime code is unchanged.

From `ts`, with the current production build:

```sh
npx playwright test -c playwright.production.config.ts isolated-tier.spec.ts
npx playwright test -c playwright.compatibility.config.ts isolated-tier.spec.ts
```

This supplies the isolated picked-tier/grab-offset evidence in W04. Modifier
gestures and overlapping multi-tier drag histories are separate remaining cases.
