# Prepared convergent two-hour measurement

Status: runner and verifier preflight complete; long-duration run NOT STARTED.
The original two-hour active-frame measurement continues separately. Preserve its
failures and full report before beginning this experiment.

The runner extends the validated frozen control to every checkpoint, including
startup, route exit, and remount. It retains active-frame readings separately as
activeMemory, reports only converged frozen samples as memory, checks three
identical heap and backing-storage reads, records stopped/resumed frame counters,
and captures process RSS/physical footprints with the existing workload. There
is no product change. Runtime is the staged isolated 4ba0139 build, with all
compiled asset hashes retained here.

verify.py first validates measurement mode, complete checkpoints, stopped and
resumed animation, three matching finite samples, and correspondence between
reported and converged data. It then delegates to the original verifier and
unchanged budget.json:120 cycles,60-second holds,at least7200 seconds,1MiB heap
growth ceiling, unchanged DOM/resources and process-footprint limits. Sampling
consistency does not relax any acceptance limit or make a short run pass.

Preflight used10 cycles and zero hold against that isolated runtime. Both
renderers passed, including actual RSS/vmmap collection, route resource release,
and resumed animation. Both reports pass sampling validation. Seven deliberately
invalid report variants (method, missing checkpoint, bad stopped frame, absent
resume, missing repeat, inconsistent repeated heap, mismatched reported heap)
were rejected. The full verifier rejected these short reports for wrong duration/
workload configuration, as required. These controls validate the measurement
machinery, not two-hour app stability.

Run from `/tmp/gel-modifier-compiled-bdc7fbd/ts` after the original finishes:

```sh
GEL_SESSION_HOLD_MS=60000 GEL_LIFECYCLE_CYCLES=120 GEL_LIFECYCLE_MEASURE_HEAP=1 GEL_LIFECYCLE_MEASURE_RSS=1 node /private/tmp/gel-browser-compat-1.64/node_modules/@playwright/test/cli.js test -c /private/tmp/gel-browser-compat-1.64/frozen-session/metal.config.ts --workers=2 --output=/tmp/gel-frozen-session-2h
```

The external runner directory contains the retained runner tree. Use Node22 PATH.
Then run this directory's verify.py with that output path and
PYTHONDONTWRITEBYTECODE=1. A failed or incomplete run must remain failed/incomplete.
No new budget, duration waiver, or claim about native behavior is introduced.
