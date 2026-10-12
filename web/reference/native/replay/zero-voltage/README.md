# Original-native zero-voltage band drag

Open input.json in the original release. It contains seven lanes, one 700 bp DNA
species in lane 1, Voltage 0 and Time 0.625. Click screenshot (472,344), then drag
(472,344) to (472,444). The band remains at the well, selection and species panel
remain, and the size slider displays 100 bp. Save Gel produces native-down.json:
the stored Bases value is actually 1. The slider display clamps to its lower
bound; it is not the authoritative document value.

The compiled replay uses client coordinates (236,144) to (236,194), matching the
2730×1592 native screenshot with a 1365×768 client and 28 logical title-bar pixels.
It compares the complete saved gel with no normalization and verifies unchanged
selected-band hit geometry. Chromium WebGPU/WebGL2 and Firefox/WebKit WebGL2 all
pass. Native screenshots were inspected via CUA, not retained as pixel goldens.
The first test draft compared an unselected hit rectangle against the selected
one; selection expands the rectangle. The final test measures both checkpoints
after selection. No runtime change was required.

This covers one unmodified downward zero-voltage inverse-solver path. Negative
voltage, overlap picking, picked aggregate offsets and modifier cases remain W04.
