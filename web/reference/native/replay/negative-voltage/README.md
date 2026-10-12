# Original-native negative-voltage upward drag

Open input.json in the original release: seven lanes, one 700 bp species in lane1,
Voltage−70, Time0.01. The short time leaves the reversed band visible inside the
gel. Click screenshot(472,332), then drag(472,332)→(472,312). The original native
slider and native-up.json both show Bases14000 after the drag. This is a retained
native inverse-solver behavior, not a proposed scientific correction.

The compiled replay converts positions to client(236,138)→(236,128), based on the
1365×768 client, DPR2 and28 logical title-bar pixels. It checks species-panel
selection and saves the complete gel. Chromium WebGPU/WebGL2 and Firefox/WebKit
WebGL2 pass. Native screenshots were inspected through CUA, not retained as pixel
goldens. The accepted voltage/time curvature change means native smile pixels
are not asserted identical for this sequence.

The initial exact-document comparison failed only on Time: web preserves the
imported decimal0.01; the original native parser saves its float32 value
0.009999999776482582. time-boundary.log retains this observation. The final test
asserts both exact values and their Math.fround relation, then compares every
other saved field exactly. This follows the explicit native parsing boundary
recorded in the file-workflow dossier; it is not unqualified JSON equality or a
new broad floating tolerance. No runtime changes were required.

This closes one unmodified negative-voltage upward drag checkpoint. Other drag
directions, overlaps, modifiers and aggregate offsets remain W04.
