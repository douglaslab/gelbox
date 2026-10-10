# Shared gel composition

All16 RGB comparisons match the independent native gel/sample/fragment overlap
captures exactly: effects/direct gel, gel first/last, DPR1/2, WebGPU/WebGL2.
The tests use real GelCanvas, DirectBandCanvas, SampleSimCanvas and FragmentWell
components, with static particle input and the application's view-order registry.
The native reference is documented in `native/modern/shared-gel-overlap`.

DirectBandCanvas now contributes an opaque black background, additive band mesh,
and source-over wells to the shared surface. It acquires no graphics context.
An additional112 native direct-band comparisons cover all existing native band
fixtures, with/without wells, on both backends at both display scales.

The direct migration test failed before implementation because the component
still created a separate renderer. Changing the new additive operation to
source-over deliberately fails all four overlap tests; restoring it passes.
This checks band overlap and blend behavior in the composed scene.

Twelve effects/direct switches retain the same shared canvas and frozen sample
engine/image. Explicit resource counts remain stable per mode, decrease when
leaving effects mode, and reach zero on route exit. These checks pass on both
backends. They do not measure driver-resident pipeline memory.

Regression: 2,917 unit tests,575 browser cases(one intentional skip),four production
checks and TypeScript/Vite build pass. Captured images, comparison reports and
source/native hashes are retained here. Shared composition remains development-
only; Task3 still needs loupes/images and remaining transform/workflow coverage,
and Task4 still needs ordered UI paint before production enablement.
