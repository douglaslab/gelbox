# Particle raster reference and correction

The baseline implementation at `b024d9a` rendered particles on single-sample
surfaces. For each backend and DPR, 57/64 cases differed from native CGL output,
with maximum RGB channel difference 157. Native and TypeScript-generated meshes
produced identical browser pixels; both browser backends also agreed exactly.
The `before-*` reports and examples retain that failed audit.

Opaque sample and loupe views now use the shared native four-sample presentation
with source-over blending, native resolve arithmetic, and their actual molecular
background color. Direct gel bands retain additive blending and black background
by default. Transparent representative drawings retain their prior compositor
until a native transparent-composition reference is established.

The four `after-*` reports record **zero differing RGB channels** for all 512
case/source/backend/DPR combinations. The original 128 native images were not
changed. `summary.json` retains the baseline and correction source hashes.

Run the focused acceptance checks from the repository root:

```sh
PATH=/opt/homebrew/opt/node@22/bin:$PATH npm --prefix ts run test:visual -- \
  -c playwright.particle-audit.config.ts --workers=2 --output=/tmp/gel-particle-audit
```

These tests are now also in the normal browser suite. Four raster tests cover
captured-native and generated meshes against all native references. Four shared
component tests cover selected particles, rollover, degraded multimers and narrow
remnants at DPR1/2 on both backends. The component uses a controlled static native
snapshot and highlights with the real frame subscription, mesh builder, and
renderer. It passively checks the acquired backend. It does not certify engine
scheduling or full native UI composition.

Only the two old degraded-particle regression snapshots changed after native
exact-pixel verification and diff inspection. They recorded the old aliased
edges; their existing tolerance of 20 pixels was retained. All independent
native comparisons still require exact RGB equality.

Remaining acceptance work includes transparent representative compositing,
full native sample/loupe GUI scenes, physical-display scale transitions, and
combined-view performance. The reference is modern native CGL, not an
original-release GUI capture; see its manifest and README for source scope.
