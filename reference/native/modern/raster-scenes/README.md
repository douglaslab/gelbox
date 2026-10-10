# Independent native gel-effect raster scenes

Sixteen explicit scenes exercise plain bodies, blur, smile, damage, smears,
flames, water and combined effects at pixels-per-unit 1 and 2. Inputs are in
`cases.json`; exported native RGB textures are the corresponding PNGs. The
96×128 logical gel and fractional rectangle intentionally expose edge rules.

`generate.py` generates the input JSON and a C++ helper that only assigns Band
fields, configures GelRender, calls the original rendering code and exports its
texture. It does not implement simulation, geometry, shaders or reference
pixels. The helper retains renderer objects because native FileWatch callbacks
capture them. The default application uses pixels-per-unit 1; the doubled
resolution cases additionally exercise the native renderer's HD path.

## Reproduction

Reconstruct the modern build as described in `../README.md`. Apply this folder's
`capture.patch` to GelboxApp.cpp and the offscreen probe's GelRender.cpp patch
(`../lossless-probe/offscreen/capture.patch`). Copy `RasterProbe.h` into `src`.
Use the lossless probe's distinct bundle identifier, create
`/tmp/gel-native-lossless-probe/raster-scenes`, build, and launch. Draw 30 writes
all sixteen PNGs to that directory. The manifest records the precise source,
executable and PNG hashes; the modern compatibility build's limitations apply.

To run the **complete diagnostic matrix**, copy `diagnostic.spec.ts` to
`ts/tests/visual/native-raster-diagnostic.spec.ts`, run it with
`npm --prefix ts run test:visual -- native-raster-diagnostic.spec.ts --workers=1`,
then remove the temporary copy. It writes detailed metrics to
`/tmp/gel-native-raster-{webgpu,webgl2}.json` and web PNGs beside the temporary
native captures. This diagnostic currently **fails** on outstanding parity gaps;
it is not a passing release gate. Retained before/after JSON files preserve all
results, including failures. Before product commit: `75b47c9`.

## Confirmed corrections

- Blur shader resolution must use output texture dimensions, not logical gel
  dimensions. At ppu 2, both backends previously differed at 3,781 pixels with
  maximum channel error 120. Both now match the native `blur-2` image exactly.
- Flame geometry used Mulberry32 instead of Cinder's MT19937 float stream. It
  now uses CinderRand and float32 arithmetic for native geometry operations.
- Band primitives must use source-over blending. Native draws smears, then
  body, then flames with alpha 1; flames overwrite the overlapping smear.
  Additive accumulation belongs to inter-band compositing. Previously the
  `flames-2` image differed at 619 pixels with max error 153. It now matches
  exactly, as does `flames-1`, on both backends.

`ts/tests/visual/native-raster-scenes.spec.ts` is the zero-tolerance regression
for those three corrected scenes on each backend. It does not claim the
complete diagnostic passes. No existing web goldens or tolerances are changed.

## Remaining failures

The retained after-results still show water/combined differences on both
backends, and WebGPU-only differences for plain/blur/smile/damage at ppu 1.
The latter start with a rectangle edge exactly on a half-pixel (y=49.5); the
same geometry matches at ppu 2. Source investigation of native versus WebGPU
edge inclusion remains necessary. Water and combined failures are not waived
as raster tolerance. Full native GUI and other scene/seed coverage remain open.

## Subsequent water correction

The [intermediate-texture investigation](water-debug/README.md) verified exact
pre-warp/control values and exposed Cinder's vertical Surface upload flip.
Corrected shader sampling now makes all sixteen WebGL2 scenes exact and eleven
WebGPU scenes exact. `after-water-*.json` contains the newer complete results;
the earlier `after-*.json` remains the historical blur/flame result. Only the
five WebGPU ppu-1 half-pixel edge cases remain red in this matrix. Normal
regressions now also include water-2 and combined-1/combined-2 on both backends.
