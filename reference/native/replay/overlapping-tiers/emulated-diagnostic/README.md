# Original instruction-order diagnostic (not an acceptance oracle)

This probe executes the original executable's `GelSim::calcBandGeometry` x86-64
instructions under Unicorn 2.1.4. It does not launch, attach to, or modify a running
native process. The executable hash is checked before its segments are loaded.

Run from the web repository root, with Python and `unicorn==2.1.4` installed:

```sh
python probe.py
```

Use the full path to this directory's `probe.py`, or set `GEL_REPO` to the repository
root. `GEL_ORIGINAL_EXE` optionally points to another copy of the same executable.
The retained result was repeated byte-for-byte on this Apple Silicon Mac.

## Inputs and boundaries

- The nine disputed solver requests come from the retained candidate comparison.
- All nine have zero degradation. The probe asserts this restriction and passes
  native `calcDegradeAsBP`'s minimum of 1 for both degradation counts.
- Geometry receives the existing corpus's float32 context and well rectangle.
- Active geometry tuning is initialized from the original bundled
  `assets/tuning/gel-sim.json` and header defaults: BaseCountHigh 14000,
  CurveExp 3.7, CurveBase .05, CurveBaseTAE .07, AspectRatioScale .06,
  VoltageDefault 70, AspectRatioMax 16, SmearUpWithH2O 6, DNA fatness 1.5.
- Mach-O indirect-symbol output confirms `0x1001b360a` is `_powf` and
  `0x1001b3130` is Cinder `RectT<float>::inflate(vec2 const&)`.
- Those calls are hooks: host **arm64** libSystem `powf`, and source-equivalent
  float32 rectangle inflation. The original Intel math-library result has not
  been independently established. The search loop is a source translation,
  not execution of the original `GelView` method.
- This probe does not construct complete bands or test drawing, picking,
  degradation, random seeds, input dispatch, or serialization.

## Corrected finding

The first diagnostic revision incorrectly passed zero for the two degradation
counts. Native `calcDegradeAsBP` floors both at one even when degradation is zero.
The current script and output correct that adapter error; the earlier seven/two
comparison is withdrawn. This is why the probe is not an acceptance oracle.

Seven of nine corrected results agree with the modern simulation-only fast-math
rebuild; two agree with the web candidate. The candidate returns 1001 for
`boundary-bp1001-y310` and `boundary-bp1001-y352`, as does the corrected probe.

The retained `web-comparison.ts/json` traces power inputs, matching-input power
results, and full band rectangles. Run from the repository root:

```sh
node ts/node_modules/vite-node/vite-node.mjs reference/native/replay/overlapping-tiers/emulated-diagnostic/web-comparison.ts
```

Two original instruction-order differences explain the probed rectangles:

1. `0x1000573ba/3c2` normalize by multiplying by the rounded reciprocal of 14000.
   The candidate divides directly. At 1000 effective bases, these produce
   different float32 values and different power inputs.
2. `0x1000574f8/523/527` calculate inflation using the original well height,
   multiplying by time then by half the fatness excess. The candidate calculates
   height after translation, where rounding can already have changed it.

For all nine recorded power inputs, rounded JavaScript `Math.pow` equals the
hook's arm64 `powf` result. A restricted JavaScript model with the two instruction
orders above matches all four emulated rectangle coordinates exactly in all nine
probes. That model only covers the retained TBE/aspect-one controls, not all
simulation inputs, and does not establish original Intel `powf` equivalence.

Canonical expectations and product code remain unchanged by this diagnostic.
Obtain the prepared original-app boundary saves, or establish all emulation
dependencies independently, before treating these as expected product behavior.
The original reference window returned `cgWindowNotFound` at the last check.

## Expanded existing-corpus check

`expanded-geometry.py` maps the existing 509 cases to 505 actual generated bands
using their recorded aggregate identities. It initializes native degradation
counts from the source rule, uses dye base counts/fatness for dye cases, and runs
the same original geometry function. `expanded-comparison.ts` compares candidate
rectangles and identical-input JavaScript power results against that output.

All 505 band rectangles match exactly. All 1,010 matching-input power calls agree
between rounded JavaScript Math.pow and host arm64 powf. This includes the
corpus's degraded samples, four dyes, six voltages and aspect ratios 1, 4 and 16;
507 of the 509 inputs use aspect ratio 1, so this is sparse shape coverage.
The same original-Intel-library and full-workflow limitations still apply.

Reproduce from the repository root with the probe's Python environment:

```sh
python reference/native/replay/overlapping-tiers/emulated-diagnostic/expanded-geometry.py > /tmp/gel-expanded-geometry.json
node ts/node_modules/vite-node/vite-node.mjs reference/native/replay/overlapping-tiers/emulated-diagnostic/expanded-comparison.ts
node ts/node_modules/vite-node/vite-node.mjs reference/native/replay/overlapping-tiers/emulated-diagnostic/loupe-boundary.ts
```

The loupe trace isolates six old-corpus probe points with substantial mass
changes. For example, at y=231.23171997070312 the source-model dimer begins exactly
at the probe, but the original-instruction/candidate dimer begins at
231.2317352294922. The probe consequently lies in the blur halo, whose source
formula differs from the body's brightness scaling. This explains how a tiny
rectangle change propagates into the failing loupe/molecular population test;
it does not justify relaxing its tolerance or changing expected data without
qualifying the original behavior. No runtime changes were made for this trace.
