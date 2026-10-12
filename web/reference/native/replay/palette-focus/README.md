# Original-release palette drag and keyboard deletion

Captured 2026-10-10 from the original release at
`/tmp/gel-native-reference/extracted/Gelbox/Gelbox.app`, binary SHA256
`037514b74bd7fcb673b7a276749fd31bfeabc0773fd11b790457412e905a78a7`.
Native window access recovered without restarting the app. Its retained state
matched `../composed-move/moved-native.json`: the multimer sample was in lane 4,
fragment zero selected, Species inspector open.

Native window capture is 2730 × 1592 with a 56-pixel title bar. Palette drag from
(2463,477) to (2563,526) selected cyan. The sample retained its blue keyboard-focus
frame. Save Gel produced `palette-native.json`. After selecting the band again
at (806,420) and repeating the drag, Delete removed the selected species and
closed the Species inspector while leaving the sample open and focused. Save Gel
produced `deleted-native.json`. The unsupported CUA spelling `Backspace` produced
no key event; the successful native action used `Delete`.

Independent file checks prove the first file differs from the previous moved
state only in the selected fragment's Color. The second differs from the first
only by native swap-with-last deletion of fragment zero. Both native files are
retained verbatim.

The browser replay runs the corresponding client coordinates at 1365 × 768,
DPR 2, on WebGPU and WebGL2. Both pass palette selection, retained sample focus,
keyboard deletion and exact complete-document equality to `deleted-native.json`.
The original app's intermediate Save dialogs are omitted from the web gesture;
they are not needed for the focus/deletion contract.

## Limits and newly identified discrepancies

Native screenshots are JPEG observations with live particles and cursor overlays,
not lossless pixel goldens. Web screenshots are PNGs taken at a different particle
time. These establish workflow states, not identical raster output. Visual
inspection suggests the web selected-band outline is thicker than the original;
source-based measurement and correction remain to be done.

Exact intermediate palette Color equality is **not established**. Native saved
cyan as `[0.011764707043766975, 0.7137255072593689, 0.6352941393852234]`; web palette
conversion currently uses double-precision byte/255. The native red component
also differs from simply rounding that quotient to float32, and matches float32
multiplication by a float32 reciprocal. One color is insufficient to certify a
palette-wide rule or infer the original build's arithmetic flags. Imported color
values remain preserved. Capture more palette values before changing conversion.
The exact post-deletion comparison does not cover this discrepancy because the
edited species has been removed.
