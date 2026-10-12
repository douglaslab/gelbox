# Complete sample and species windows

Both backends match the entire native client framebuffer exactly: four comparisons
at 1365×768 logical pixels / DPR2, zero differing RGB channels, no crops or masks.
`provenance.json` pins native inputs, web source/test hashes and output hashes.

`shared-populated-window.spec.ts` imports the captured native gel through the real
file UI, opens its tube and replays exported particles into the frozen sample
engine. This controls model and particle inputs, including the modern Cinder
palette conversion difference, without changing original-release web defaults.

Native labels require a float32 normalize/map/quantize roundtrip. Native window
geometry requires projection/view composition before vertex transformation.
The matching scene includes gel selection, particles, sample chrome, species
controls and representative as well as the surrounding application controls.

See [native reconstruction and limits](../../native/modern/full-window-scenes/README.md).
These captures do not prove RNG histories, other scenes/sizes, original-release
GUI equivalence, production shared rendering or other browser/platform gates.
