# Native sample/loupe background calculation

`capture.py` extracts **unchanged** `Sample::getDyes` and
`MolecularSim::drawBackground` from pinned Gelbox `5f51097`. The harness supplies
fragment fields, the effective #F1F1F2 background and 125 ng normalization
constant; actual pinned Cinder `Color<float>` operations calculate the result.
The source checks establish those constants, and original Dye.h supplies dye
colors. Geometry/draw calls are adapters: they capture the computed color rather
than starting the native GUI. A separate native CGL RGBA8 clear/readback records
its solid-interior RGB conversion. This does not certify particle edges,
complete native window composition or original-release toolchain equivalence.

36 cases cover idle/hover/down, each dye, multiple dyes, fractional masses,
imports above 125 ng, duplicate dyes and DNA excluded from dye sums. Both CPU
output and native RGB conversion repeat identically. `manifest.json` pins source,
extracted-method, Cinder, driver, fixture, executable and pixel-driver hashes.

Run `python3 reference/native/numerical/background/capture.py` from any directory
to rebuild and verify all retained outputs. `--update` explicitly recaptures.
Requires macOS/OpenGL, command-line tools and the pinned Cinder headers. Both
native source paths can be overridden by the documented GELBOX_REFERENCE_REPO
and CINDER_REFERENCE_REPO environment variables.

The prior web calculation silently clamped each dye's contribution to one and
used double arithmetic; SampleSimCanvas also replaced earlier duplicate dye
masses with the last entry. The corrected calculation uses native float32
operations, the full imported mass and the sum of duplicate fragments. Native
`getDye` (singular), used by the settings slider, intentionally reads the first
matching fragment and remains distinct from the plural background sum.

`nativeBackground.test.ts` requires exact numeric agreement. The browser test
imports excess/duplicate dye samples and compares actual sample-canvas pixels
with native RGB in all three highlight states, on both backends. Saving must
retain every original dye entry and mass. Those six cases and all 36 numeric
cases failed before the corrections and pass after; no raster tolerance is used.
SampleSimCanvas is shared by samples and loupes, but these browser scenarios
certify ordinary samples only; composed loupe scenes retain their separate gate.
