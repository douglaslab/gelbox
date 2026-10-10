# Pinned native gel-band numerical reference

This runs **unmodified `GelSim.cpp` from Gelbox `5f51097`**, with its pinned headers and effective `assets/tuning/gel-sim.json`. It uses real Cinder types/math and the retained legacy `JsonTree` implementation. It is independent of the TypeScript simulation.

The executable is a model reference, not the distributed Gelbox binary. Cinder is the clean local checkout at `f90f332d1a4d453282c76435f3401271f25922f9`, rather than original Cinder 0.9.0. Its prebuilt library hash is recorded; correspondence between that library and its source revision is not independently established. No GUI, GPU render or particle simulator runs in this harness.

## Reproduce on macOS

Requires CMake, Xcode C++ tools, the Gelbox Git repository containing `5f51097`, and the stated Cinder checkout with its Release library/CMake config already built. From the web repository root:

```sh
python3 reference/native/numerical/generate-cases.py
python3 reference/native/numerical/build.py --gelbox /absolute/path/gelbox --cinder /absolute/path/Cinder --capture
cd ts
npm run test:unit -- tests/unit/nativeNumerical.test.ts tests/unit/nativeSolver.test.ts tests/unit/nativePicking.test.ts tests/unit/nativeLoupe.test.ts
```

`build.py` extracts pinned source via `git show` into `/tmp/gel-native-numerical` (override with `--build`). It does not read edited Gelbox source or modify either sibling repository. It refuses a different or dirty Cinder checkout. The only extra Sample implementation is `Sample::clearDyes`, extracted verbatim from the pinned source to satisfy the constructor. A forced prefix header supplies native-style fundamental Cinder types and its legacy JSON declarations; no simulation algorithm is rewritten. The inverse solver method `GelView::solveBasePairForY` is also extracted verbatim, with pinned `Config` defaults and a minimal adapter supplying the input well rectangle and the native inline band-top reference. Its optional cache is not exercised.

`--capture` runs the executable twice and requires byte-identical output. It writes `outputs.json` and `provenance.json`, including hashes for source, tuning, input cases, output, harness scripts, executable and Cinder library, plus compiler/platform/flags. Absolute build paths in the provenance are historical capture details. Case generation is deterministic and reads the recorded native startup document for its eleven startup species.

## Coverage and comparisons

508 cases cover combinations of TBE/TAE/H2O, voltage -300/0/70/300, time 0/.25/1 and degradation 0/.5/1/1.5/2, plus base/mass/aspect extremes, empty/zero/mixed/high aggregates, all four dyes, well damage, nonzero lane/fragment indices, differing sample buffer, all startup species, and fractional input regressions found during review. This includes an overloaded H2O band (combined smear/flames), tied aggregate tops and 244 inputs constructed near integer pixel boundaries. The 2,894 inverse solver requests compare exact base counts across target Y, chosen/missing aggregate tiers, and the same simulation matrix. This finite matrix is not exhaustive.

The Vitest test compares all fields common to native `Band` and web `Band`: rectangles, smears and brightness ramps, flames, smiles, blur, brightness, color, random seeds, well damage, mass and aggregate tier. Native UI rectangles are compared by `nativePicking.test.ts` against the shared web hit geometry. Additional native source metadata is recorded but not yet asserted against the web model. Web `degrade` is carried from input and has no direct native `Band` counterpart.

- Band count, blur and aggregate tier are exact. Random seeds compare exact 32-bit patterns (native signed `int`, web unsigned integer). Non-finite, missing or fractional integer outputs fail validation.
- Spatial values allow `max(0.0003, 12 × 2^-23 × max_abs_native_rect_coordinate)` gel-space pixels. Native float32 subtracts translated endpoints and multiplies the resulting height by up to 6 for H2O smearing; the coordinate-based bound accounts for that cancellation. This is a numerical tolerance, not a pixel-difference threshold.
- Other numeric values allow `max(0.000002, abs(native) × 0.000002)`.

The first comparison exposed real web errors: blur and degraded BP were rounded rather than truncated, and negative native smear was clamped away. Fractional review cases then exposed double-versus-float32 differences at integer boundaries; the corrected degradation, diffusion, mobility and band geometry paths now preserve native float32 evaluation before truncation. JavaScript `Math.pow` rounded to float32 is used for native `powf`; this finite comparison does not establish bitwise equivalence for every input or platform. Do not widen tolerances to conceal new integer or behavioral mismatches.

## Synthetic loupe reference

The harness also extracts `GelView::makeSampleFromGelPos` and `pickBands` verbatim, plus the `DegradeFilter` declaration. The adapter supplies a single source sample, its lane/fragment bands, well rectangle and simulation context. Each of26 scenarios samples native-derived body centers/edges, quarter smears, lateral halos and misses:206 points total. Synthetic fragments, default buffer and degradation-filter keys/values are recorded. `nativeLoupe.test.ts` compares discrete fields/filter entries exactly and mass/degradation/aspect/color with small numeric tolerances.

Coverage includes buffers, degradation, dyes, aggregates, overload, nonzero source index and the float32 degradation0.5 boundary. Native source-index filter keys (which can differ from output indices) and repeated-source overwrites are intentionally preserved. Original sample object identity is recorded only as source fragment metadata; web origin/identity integration remains open. The adapter does not establish cross-fragment/cross-lane overlap behavior. Source-buffer context is supplied correctly, but the existing disabled native chemistry experiment means these fixtures cannot distinguish all context-wiring mistakes. JavaScript halo distance/power retains double precision before final mass rounding; finite comparisons do not prove every numerical boundary or platform. No molecular particle simulation or native raster certification is implied.
