# Native gel / sample / fragment overlap

Eight repeated native CGL captures cover effects/direct gel drawing, gel first or
last, and DPR1/2 on one opaque RGBA8 MSAA4 surface. The gel origin `(90.25,70.75)`
exercises fractional placement and native scissor conversion. The sample clips
its ordinary particles; the fragment representative is allowed outside its well.

Inputs are independent of the web renderer:

- Particle meshes come from the pinned native MolecularSim extraction executable,
  checked against `numerical/provenance.json` and captured twice.
- Direct bands use the `overlap` native drawBands extraction, whose provenance
  and contract are checked by `numerical/test_direct_bands.py`.
- Effects use the native GelRender `raster-scenes/plain-1.png` scientific texture,
  checked against its capture manifest. The scientific texture is opaque and
  sampled linearly without mipmaps.
- Fragment well meshes use the legacy Cinder geometry oracle. The draw order,
  shadow, background, blend and clipping follow the pinned native view sources.

Run `python3 reference/native/modern/shared-gel-overlap/capture.py` to rebuild,
repeat and verify the retained captures on macOS. It requires the existing pinned
`/tmp/gel-native-numerical` mesh build (or `--mesh-build`). `--update` writes new
reference files explicitly. The manifest records all native input hashes and the
standalone raster executable hash.

This proves the specified native geometry/texture composition, not original
application GUI replay. Headings, focus frames, controls, text, tube assets,
loupes, images and rotated/scaled gel cases remain outside this fixture.
