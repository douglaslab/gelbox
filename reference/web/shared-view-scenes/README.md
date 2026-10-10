# First shared app view contributions

The development migration (`localStorage.gelSharedPresentation = '1'`, then
reload) uses the production GelProvider, presentation registry, FragmentWell
and SampleSimCanvas. Production builds ignore this flag, even if persisted.
The registry follows the store's view order and reads committed DOM positions
after the existing `flushSync` tick. It does not own engines, RNG or simulation.

The production FragmentWell now matches all 12 RGB comparisons against the
[independent native intersecting-edge reference](../../native/modern/fragment-edge-scenes/README.md):
three states × DPR1/2 × WebGPU/WebGL2. The earlier rose triangle and navy rectangle
are registered geometry; the well/representative comes through the actual React
component and live registry. This is stronger than the direct API prototype,
but is not a native replay of the full sample/fragment application scene.

Other browser checks cover:

- Actual sample and fragment components use the shared context, retaining their
  DOM input elements without acquiring per-view graphics contexts.
- Opening/removal during a store frame callback reaches presentation with the
  committed DOM and current view keys. Rendering leaves molecular parts, tick
  count, local RNG seed and next global random value unchanged.
- Integer movement and scroll preserve the frozen sample image; live DPR and
  window resize bound the shared backing surface to the current viewport.
- Initialization failure falls back on a new canvas; a presentation module
  completing after route removal creates no late shared resources.
- Built root/subpath workflows ignore the migration flag.

Moving presentation inside `flushSync`, before commit, makes both backend timing
checks fail with stale DOM (expected open marker `0`, received `null`). Restoring
the post-commit call passes. The pixel fixture initially tried to register a
store-managed inspector key manually; using the real SET_SELECTED command
corrected the fixture without changing the store or native references.

## Limits and next gates

Only the sample body/shadow/particles and fragment well/representative have moved.
Gel, loupe, image, control, text and frame paint remain on their old paths. Moving
the sample into the old gel canvas exposed a 10px incorrectly ordered strip;
that mixed-boundary overlap remains unaccepted. The movement check keeps clear
of the gel to isolate coordinate correctness; it does not waive this defect.

Still required for shared-composition Task2: an independent native scene with
real sample and fragment contributions together, full SampleView first-commit
measurement coverage, device/context-loss recovery and bounded shared allocation
checks. The current same-frame fixture uses MolecularSimCanvas with explicit
bounds. Original GUI/font/asset and cross-browser acceptance remain separate
roadmap gates. Do not enable this incomplete migration in production.

Verification: 2,916 unit tests, 549 browser tests (one intentional duplicate
skipped), four production root/subpath checks and the TypeScript/Vite build pass.
`provenance.json` records the source hashes and retained exact comparison reports.
