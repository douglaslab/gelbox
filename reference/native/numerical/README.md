# Pinned native simulation reference

This runs **unmodified `GelSim.cpp` from Gelbox `5f51097`**, with its pinned headers and effective `assets/tuning/gel-sim.json`. It uses real Cinder types/math and the retained legacy `JsonTree` implementation. It is independent of the TypeScript simulation.

The executable is a model reference, not the distributed Gelbox binary. Cinder is the clean local checkout at `f90f332d1a4d453282c76435f3401271f25922f9`, rather than original Cinder 0.9.0. Its prebuilt library hash is recorded; correspondence between that library and its source revision is not independently established. Native molecular fragment setup and seeded particle lifecycle run in this harness; no GUI or GPU renderer runs.

## Reproduce on macOS

Requires the pinned Cinder-Boost checkout described below, CMake, Xcode C++ tools, the Gelbox Git repository containing `5f51097`, and the stated Cinder checkout with its Release library/CMake config already built. From the web repository root:

```sh
python3 reference/native/numerical/generate-cases.py
python3 reference/native/numerical/generate-particles.py
python3 reference/native/numerical/generate-mesh.py
python3 reference/native/numerical/build.py --gelbox /absolute/path/gelbox --cinder /absolute/path/Cinder --capture
cd ts
npm run test:unit -- tests/unit/nativeNumerical.test.ts tests/unit/nativeSolver.test.ts tests/unit/nativePicking.test.ts tests/unit/nativeLoupe.test.ts tests/unit/nativeMolecular.test.ts tests/unit/nativeParticles.test.ts tests/unit/nativeMesh.test.ts
```

`build.py` extracts pinned source via `git show` into `/tmp/gel-native-numerical` (override with `--build`). It does not read edited Gelbox source or modify either sibling repository. It refuses a different or dirty Cinder checkout. The only extra Sample implementation is `Sample::clearDyes`, extracted verbatim from the pinned source to satisfy the constructor. A forced prefix header supplies native-style fundamental Cinder types and its legacy JSON declarations; no simulation algorithm is rewritten. The inverse solver method `GelView::solveBasePairForY` is also extracted verbatim, with pinned `Config` defaults and a minimal adapter supplying the input well rectangle and the native inline band-top reference. Its optional cache is not exercised.

`--capture` runs the executable twice and requires byte-identical output. It writes `outputs.json` and `provenance.json`, including hashes for source, tuning, input cases, output, harness scripts, executable and Cinder library, plus compiler/platform/flags. Absolute build paths in the provenance are historical capture details. Case generation is deterministic and reads the recorded native startup document for its eleven startup species.

## Coverage and comparisons

509 cases cover combinations of TBE/TAE/H2O, voltage -300/0/70/300, time 0/.25/1 and degradation 0/.5/1/1.5/2, plus base/mass/aspect extremes, empty/zero/mixed/high aggregates, all four dyes, well damage, nonzero lane/fragment indices, differing sample buffer, all startup species, and fractional input regressions found during review. This includes an overloaded H2O band (combined smear/flames), tied aggregate tops and 244 inputs constructed near integer pixel boundaries. The 2,909 inverse solver requests compare exact base counts across target Y, chosen/missing aggregate tiers, and the same simulation matrix. This finite matrix is not exhaustive.

The Vitest test compares all fields common to native `Band` and web `Band`: rectangles, smears and brightness ramps, flames, smiles, blur, brightness, color, random seeds, well damage, mass and aggregate tier. Native UI rectangles are compared by `nativePicking.test.ts` against the shared web hit geometry. Additional native source metadata is recorded but not yet asserted against the web model. Web `degrade` is carried from input and has no direct native `Band` counterpart.

- Band count, blur and aggregate tier are exact. Random seeds compare exact 32-bit patterns (native signed `int`, web unsigned integer). Non-finite, missing or fractional integer outputs fail validation.
- Spatial values allow `max(0.0003, 12 × 2^-23 × max_abs_native_rect_coordinate)` gel-space pixels. Native float32 subtracts translated endpoints and multiplies the resulting height by up to 6 for H2O smearing; the coordinate-based bound accounts for that cancellation. This is a numerical tolerance, not a pixel-difference threshold.
- Other numeric values allow `max(0.000002, abs(native) × 0.000002)`.

The first comparison exposed real web errors: blur and degraded BP were rounded rather than truncated, and negative native smear was clamped away. Fractional review cases then exposed double-versus-float32 differences at integer boundaries; the corrected degradation, diffusion, mobility and band geometry paths now preserve native float32 evaluation before truncation. JavaScript `Math.pow` rounded to float32 is used for native `powf`; this finite comparison does not establish bitwise equivalence for every input or platform. Do not widen tolerances to conceal new integer or behavioral mismatches.

## Synthetic loupe reference

The harness also extracts `GelView::makeSampleFromGelPos` and `pickBands` verbatim, plus the `DegradeFilter` declaration. The adapter supplies a single source sample, its lane/fragment bands, well rectangle and simulation context. Each of26 scenarios samples native-derived body centers/edges, quarter smears, lateral halos and misses:206 points total. Synthetic fragments, default buffer and degradation-filter keys/values are recorded. `nativeLoupe.test.ts` compares discrete fields/filter entries exactly and mass/degradation/aspect/color with small numeric tolerances.

Coverage includes buffers, degradation, dyes, aggregates, overload, nonzero source index and the float32 degradation0.5 boundary. Native source-index filter keys (which can differ from output indices) and repeated-source overwrites are intentionally preserved. Native origin fragment metadata is now compared with the web ancestry array for every emitted synthetic fragment. Shared selection/rollover resolves through that array. Stable sample identity and off-document reference retention remain open. The adapter does not establish cross-fragment/cross-lane overlap behavior. Source-buffer context is supplied correctly, but the existing disabled native chemistry experiment means these fixtures cannot distinguish all context-wiring mistakes. JavaScript halo distance/power retains double precision before final mass rounding; finite comparisons do not prove every numerical boundary or platform. These loupe extraction comparisons alone do not certify molecular particles or native raster output.

## Molecular fragment setup

The harness extracts `MolecularSim::setSample`, `calcTargetPop`, `basesToRadius`, the tuning loader, tuning class and fragment declaration verbatim from the pinned source. A minimal adapter supplies their storage. Effective `assets/tuning/molecular-sim.json` overrides the header's population exponent with 1, matching the application loader.

`nativeMolecular.test.ts` checks target population, aspect-adjusted radii, both wholeness endpoints, aggregate weight sums and dye flags for all 509 cases, 155 explicit filtered requests and 206 synthetic loupe probes. Numeric tolerance is `max(0.00001, abs(native) × 0.000003)`; dye flags compare exactly. The degraded `[2,2,1]` case distinguishes first-maximum aggregate selection from the last equal maximum or last vector slot; deliberately changing the tie comparison makes this regression fail.

The differential comparison exposed the wrong population exponent, clamped radius extrapolation, collapsed degradation endpoints and approximate filter scaling. Native filtering performs integer demodulation by the first maximum-weight tier, maps the filtered radius into the endpoint interval without an extra clamp, then applies the radius floor. This validates fragment setup over the finite matrix. Seeded particle spawning and lifecycle are covered separately below. Picking, mesh generation and native raster equivalence remain separate requirements.


## Seeded particle lifecycle

The second executable, `gel-particles`, extracts native `Part`, `randomPart`, weighted aggregate selection, `tick`, `setBounds` and `preroll` verbatim. Its storage adapter explicitly initializes the dynamic RNG, population seed and global Cinder RNG. The original scenarios bypass the application constructor and `setRand`; the loupe-refresh scenarios below additionally exercise the extracted native `setRand` and gel-coordinate/time seed expression. Application constructor/global initialization, engine identity and interleaving between views remain unverified.

33 scenarios cover direct spawning, multi-frame updates, normal/bullet time, time scale, density, bounds, degradation, multimers, dyes and mass changes. Each capture runs twice and must agree byte-for-byte. `particle-cases.json`, `particle-outputs.json`, executable and Cinder RNG source hashes are recorded in `provenance.json`. Each scenario also records 700 unsigned integers and 700 floats from independently reseeded Cinder streams, crossing the MT19937 twist boundary. The matrix uses four explicit dynamic seeds and per-scenario global seeds.

`nativeParticles.test.ts` compares particle counts/order, ownership and alive flags exactly; numeric particle fields allow `max(0.0001, abs(native) × 0.000002)` for accumulated float32/trigonometric differences. The 700-word integer and float streams compare exactly. This finite macOS/modern-Cinder capture does not establish RNG mapping on every standard library or original-release raster equivalence.

The initial comparison failed 28 of 31 lifecycle scenarios. Two additional translated fractional-bounds scenarios reproduced a review finding: native Rectf rounds endpoints before subtraction, which can change integer particle targets. Both constructor and setBounds now normalize endpoints before calculating density/spawn positions. Corrections restore Cinder's MT19937 stream, native draw order and separate global angular-velocity stream, integer initial ages, shared degradation key, multimer parent selection, unit-vector jitter, float32 motion/interpolation, integer aggregate targets and short-circuit culling. Cases deliberately avoid native undefined behavior from zero aggregate sums during ticking or shrinking live aggregate vectors below existing particle tiers. Null/deleted-sample transitions, cross-view seed lifecycle, particle picking/meshes and GUI replay remain required follow-up coverage.


## Particle picking

The particle executable also extracts native `pickPart`, `pickFragment`, `Part::getRootTransform` and `Part::getTransform` verbatim. Five controlled scenes probe 2,601 grid points each plus 720 boundary points per multimer slot, first with one particle and then with an overlapping dead, zero-fade particle: **40,410 exact pick results**. Scenes cover small monomers, rotated ellipses, rotated/unrotated multimers and minimum-radius multimers. The harness accepts explicit particle state to separate transform testing from random spawning; all five scenes retain the exact RNG-stream checks, for 38 lifecycle/picking scenarios before the sixteen loupe-refresh additions below.

The initial web comparison failed all three multimer scenes. Web picking now rotates multimer offsets with the root particle, inflates radii before calculating offsets, and uses native picking's `2 × minRadius` spacing without the rendering overlap factor. Reverse ordering and dead/faded hit eligibility are preserved. Native picking uses full ellipses even for degraded fragments; it is intentionally not clipped to the visible degraded mesh. Discrete pick indices/fragment indices compare exactly over this finite matrix; near-boundary floating-point equivalence on every input remains unproven. Drawing geometry remains a separate requirement.

Fresh picking review exposed boundary differences from replacing the native matrix inverse with an inverse-rotation/division shortcut. Added 14,400 boundary probes reproduced failures in four scenes. The web now preserves float32 matrix cofactors, determinant, translation and matrix-vector multiplication, including rounding of the Z diagonal in GLM rotation. All 40,410 discrete probes pass. No deferred minors were reported. Mesh/native raster certification remains open.


## Particle mesh reference

`gel-mesh` extracts native circle/rectangle construction, polygon-to-mesh conversion, degradation clipping, Part mesh construction and mesh concatenation verbatim. It combines these with original Cinder 0.9.0 `PolyLine.h/.cpp` from commit `75f4821216a0e105075f3c55be1fbe38784a18c6` and its Boost submodule `15a1f17b2b63c0e8d1570fd78ed55366540abe21`. Prepare that separate, clean dependency before `build.py` (or pass another directory with `--boost`):

```sh
git clone --filter=blob:none --no-checkout https://github.com/cinder/Cinder-Boost.git /tmp/gel-native-boost
git -C /tmp/gel-native-boost checkout 15a1f17b2b63c0e8d1570fd78ed55366540abe21
```

The legacy polygon object compiles separately as C++17, with libc++ compatibility declarations for removed `auto_ptr`/unary/binary functions. An isolated include overlay gives two Boost numeric classification enums explicit `int` underlying types so modern Clang accepts their unused MPL next/prior constants. The original Boost checkout stays clean; both source/compiled header hashes and compile flags are recorded. Polygon/mesh algorithms are unmodified. The rest still uses modern Cinder math/TriMesh/library; this is not original-release binary certification.

64 cases cover whole/partial/zero/tiny-positive wholeness, selected/hovered/combined outlines, circle/elliptical radii, rotated multimers, and fade/color/pass ordering. `nativeMesh.test.ts` compares color/pass groups exactly, area/area-weighted centroid/bounds with `max(0.0002, abs(native) × 0.00001)`, and 361 coverage probes per case including overlapping triangles. Probes within `1e-6` barycentric distance of a triangle edge are excluded; bounds and area still constrain geometry. Equivalent triangulation and redundant zero-area triangles are allowed; raw triangle ordering/count is not certified. Numeric tolerance accounts for float32 transforms and polygon area calculations; it is not a screenshot threshold.

The initial comparison failed 40 of 48 cases. Review added 16 narrow-slice cases, 12 of which failed from NaNs or centroid differences before correction. The web now uses the native accumulated circle phase, integer-rescaled clipping ratios and left-edge touch, closed clipped rings, polygon centroids and sequential float32 transforms. Captured ARM64 centroid code fuses a float product/subtraction; that arithmetic matters for tiny slices and is reproduced. A translated double-precision fallback keeps a zero-area centroid finite without widening its contour. Compiler/platform differences at these thresholds remain a limitation of the capture.

A native quirk is preserved explicitly: the zero-width rectangle at zero wholeness returns the full fill ellipse through legacy Boost. This replaces the web's unrelated 0.05 minimum slice floor. Native’s ill-conditioned centroids can also extend the fan outside an extremely thin contour; captured behavior takes precedence over geometrical cleanup. Finite fixtures do not prove every tiny-slice threshold. Controlled original-release frame comparisons, complete scene selection identity and browser seed/timing integration remain required.


## Loupe refresh seeding

Sixteen additional scenarios bring the particle matrix to **54 scenarios**. The harness extracts `MolecularSim::setRand` verbatim and the `ci::Rand` argument expression from `GelView::updateGelDetailViewContent`. The adapter supplies only float coordinates, a float-time gel accessor and particle clear/sample/preroll calls. Each scenario covers initial preroll, normal advancement, repeated same-position refresh and changed anchor/time refresh. Another **1,280 seed probes** cover fractional coordinates (including negative X with positive final seed), fractional time and integer truncation boundaries; seeds compare exactly. Invalid/out-of-range float-to-unsigned conversions are excluded.

All eight initially failed against the old floored-anchor formula or missing reseed operation. Web seed derivation now includes native float arithmetic and truncated gel time. Engine reseeding copies the untouched dynamic stream and independently draws its population seed, preserving native by-value `setRand` semantics. Loupe refresh clears/reseeds the existing engine; it does not replace global angular RNG state. The native capture repeats byte-for-byte. These finite probes do not establish all compiler contraction/overflow behavior, app-wide constructor/random initialization, cross-view scheduling or original-release raster parity.

Fresh review found the initial eight cases never used population dithering because their integer target population was two. Eight additional low-mass cases exercise sub-one targets at two times. Deliberately reverting to the raw population seed makes seven cases fail; restoring the native first-draw seed makes all cases pass. This tests both outcomes (particle present/absent), separately from the dynamic stream checks.
