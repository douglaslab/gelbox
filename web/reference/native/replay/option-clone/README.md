# Native band-clone observation and tube-clone comparison

The lane 2 to lane 3 tube clone followed by destination selection passes in all
four compiled configurations. The earlier band-clone observation is retained
with its pointer-history limits.

The original executable at
`/tmp/gel-native-reference/extracted/Gelbox/Gelbox.app` was observed through
computer use. `native-before-clone.json` was saved through its Save dialog before
requesting a physical Option-drag of the lane 1 tube to lane 2. The automation API
cannot hold a modifier during a mouse drag.

After the user reported completion, the native window showed two tubes, lane 2
selected, and Sample and Species panels open. The destination species was
magenta. `native-after-clone.json` is the unmodified native Save output captured
at that point. Its source lane is unchanged, but its destination is not a full
copy of that source:

- Source: 700 bases, purple `[0.5, 0.25, 0.75]`, custom sample buffer and metadata.
- Destination: 719 bases, magenta, TBE buffer, empty name/icon, id -1.
- Both saved fragments have mass 200; the visible mass control displayed 175 ng.
- Gel buffer, time, voltage and well damage are unchanged.

The native `GelView.cpp` distinguishes Option-dragging a tube (copy the complete
Sample) from Option-dragging a band (clone a fragment and assign a random palette
color). The user subsequently confirmed dragging the **band inside the gel**.
This establishes that this observation concerns fragment cloning, not complete
sample cloning. Exact pointer coordinates were not captured, so the changed
base count does not provide an exact coordinate replay oracle. Do not infer a
web defect or close the tube-clone acceptance item from this trace.

The next requested gesture was a tube clone into lane 3, keeping the band-clone
result in lane 2. `native-after-clone.json` is its saved starting document.

## Follow-up capture

After the user's next acknowledgement, the window showed three tubes, lane 3
selected, and the magenta species still selected in the Sample/Species panels.
`native-three-lanes.json` is the unmodified native Save output from this state.
Parsed comparison confirms lanes 1 and 2 are unchanged, and lane 3 exactly equals
the previous lane 2 sample (including all fragment, buffer and metadata fields).
It does not equal lane 1. The user confirmed the source was lane 2. This is a
lane 2 to lane 3 tube-copy trace, not a lane 1 tube-copy trace.

## Initial compiled replay: document match, selection history incomplete

The new case in `ts/tests/production/tube-movement.spec.ts` imports
`native-after-clone.json`, selects lane 2's band to reproduce the observed
starting selection, and Option-drags the lane 2 tube to lane 3.
Chromium WebGPU, Chromium WebGL2, Firefox WebGL2 and WebKit WebGL2 all produce a
full saved document exactly equal to `native-three-lanes.json`, without field
normalization. All three tubes/bands remain and the species panel remains open.

All four initial diagnostic tests **failed** the destination-selection assertion: the web
Sample panel returns to lane 2, while the native observed screenshot showed
lane 3 selected. The native source's `GelView::tick` follows the selected sample,
so an additional native click after the drag could explain the different final
selection. The user was asked whether such a click occurred. The diagnostic
assertion was soft only to collect the saved-document comparison and screenshots;
it still failed each test.

`production-diagnostic.log`, `compatibility-diagnostic.log` and their respective
diagnostic directories retain the failed runs and complete web downloads.
These are diagnostic evidence, not passing acceptance gates. Runtime is still
812ff8a588d6fbc238e5e5f75dc9f58ab6f387fe; no application change was made.

## Confirmed sequence and passing comparison

The user confirmed clicking the clone afterward to check its color. The final
test includes a click on the destination band after the Option tube drag.
All four configurations pass with hard assertions: three tubes/bands remain,
the Sample panel refers to lane 3, the Species panel is visible, and the complete
downloaded document exactly equals the native save. No fields are omitted or
normalized. Source and unrelated lanes remain unchanged; the destination copies
all source fragment, buffer and metadata fields. The initial failures reflect
incomplete replay history, not an application defect fixed by this change.

`production.log` and `compatibility.log` retain the passing runs. Each named
backend directory contains before/after screenshots and the complete download.
`compiled-assets.json` records all 223 assets, verified identical to the already
qualified runtime. Native screenshots were observed through computer use;
no native pixel golden or immediate post-drag selection claim is made. This
trace has no persistent loupe and does not close clone/loupe histories.

Run from `ts`:

```sh
npx playwright test -c playwright.production.config.ts tube-movement.spec.ts -g 'native Option tube clone'
npx playwright test -c playwright.compatibility.config.ts tube-movement.spec.ts -g 'native Option tube clone'
```
