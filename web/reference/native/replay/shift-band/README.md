# Native Shift-band transfer

`native-before-shift.json` is unmodified original-native Save output from the
current four-tube document. It was saved through the dialog in `option-clone`
and moved here without changing its bytes. The additional lane 4 tube was
already present when this baseline was observed; its creation history is not
part of this trace. Lanes 2–4 contain 719-base fragments of mass 200; lane 1
contains the original 700-base fragment. Lanes 5–7 are empty.

Requested manual action: hold Shift (not Option), drag the band inside lane 4
diagonally right and downward into empty lane 5, release the mouse before Shift,
and make no further clicks. The computer-use tool cannot hold a modifier during
a drag. Native `GelView::mouseDragBand` restores `mMouseDownBand.mBases` while
Shift is held; lane transfer remains enabled. This should exercise size locking
despite vertical pointer movement. The user confirmed completing the requested gesture. The native checkpoint
`native-after-shift.json` was saved through the same dialog and moved here unchanged.

The band moves from lane 4 to lane 5 and retains exactly 719 bases, mass 200,
color and all other fragment fields. Lane 4 retains an empty sample/tube; lane 5
is selected with Sample and Species panels open. Other lanes are unchanged.

The compiled replay in `tube-movement.spec.ts` holds Shift while moving the
pointer one lane right and 70 logical pixels downward. Exact native pointer
coordinates were not captured; this tests the confirmed size-locking and lane
transfer behavior, not an exact pointer trajectory. Chromium WebGPU/WebGL2,
Firefox WebGL2 and WebKit WebGL2 all pass. The complete saved document matches
with only the explicit empty-source encoding conversion: native Fragments null
versus web []. Both original encodings are asserted before comparing all fields.

Backend directories retain screenshots and complete downloads; production.log
and compatibility.log retain the passing runs. All 223 compiled assets match
runtime 812ff8a and the preceding qualified bundle. No runtime changes were needed.
Native screenshots were observed through computer use, not retained pixel goldens.
