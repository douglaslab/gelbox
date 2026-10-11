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
- All nine have zero degradation. The probe asserts this restriction.
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

## Finding

Seven of nine results agree with the web candidate; the other two disagree.
Only two of nine agree with the modern simulation-only fast-math rebuild.
For `boundary-bp1001-y310` and `boundary-bp1001-y352`, the probe returns 999
while the current web candidate returns 1001.

This supports investigating original instruction ordering and rules out using
the modern fast-math corpus as an unquestioned replacement oracle. It does not
qualify either corpus, justify changing the canonical expected values, or close
the numerical gate. Obtain the prepared original-app boundary saves, or establish
all emulation dependencies independently, before treating these as expected
product behavior. The original reference window still returned
`cgWindowNotFound` when checked during this diagnostic.
