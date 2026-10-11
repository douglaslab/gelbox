# Browser-frozen heap sampling control

Separate30-cycle, zero-hold WebGL2 diagnostic with the existing26b4eb0 build,
Chromium153/Metal, and the retained resource-disposal workflow. Nothing in the
active two-hour test or its compiled files was changed.

The initial attempt called Page.setWebLifecycleState(frozen) while the runner's
forced focus remained enabled. A frame counter advanced208→214 over100ms, so
the test rejected the sample before collecting heap data. The failed source and
log are retained. A minimal independent browser control established the missing
runner-focus precondition; it did not load or modify Gelbox.

The corrected control temporarily clears the runner's forced-focus setting,
opens a blank cover page, freezes the app, and asserts its requestAnimationFrame
counter remains constant over100ms. It performs three forced-GC/heap queries,
then restores active state, closes the cover, restores forced focus and requires
frames to advance again. Protocol sampling commands have15-second deadlines.
This is an engine measurement control, not physical tab or OS lifecycle evidence.

The workflow passed in10.3seconds. All three frozen samples were byte-identical
at each checkpoint:6,606,112 used bytes at10 and7,052,876 at30 (+446,764 bytes).
Backing storage stayed706,187 bytes in every frozen sample. This demonstrates
sampling convergence for these two checkpoints; it does not prove all future
samples converge or validate a two-hour replacement acceptance run.

The unchanged long run's cycle50 WebGL2 checkpoint separately fell to502,976
bytes above its cycle10 baseline, after1,308,764 at40. Both historical over-budget
checkpoints still count as failures of the original declared criterion. The
convergent control and later decline support investigating inter-command frame
allocations; they do not establish an exclusive causal explanation or justify
silently discarding inconvenient samples.

Next measurement design should explicitly require stopped-frame convergence
before calling a GC measurement retained heap, and restore/verify active frames
afterward. Keep the1MiB limit unchanged unless a separately justified decision
is made. Finish and retain the original run before launching another long test.

Command from worktree ts:

```
GEL_SESSION_HOLD_MS=0 GEL_LIFECYCLE_CYCLES=30 GEL_LIFECYCLE_MEASURE_HEAP=1 node /private/tmp/gel-browser-compat-1.64/node_modules/@playwright/test/cli.js test -c /private/tmp/gel-browser-compat-1.64/heap-frozen-sampling/metal.config.ts --project=chromium-webgl2 --output=/tmp/gel-heap-frozen-sampling-verified
```
