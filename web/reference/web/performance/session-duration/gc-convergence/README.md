# Repeated-GC measurement control

Separate30-cycle WebGL2/Chromium153 Metal control using the same26b4eb0 compiled
build. Populated-view holds are zero. At cycles10/30, after the normal forced-GC
sample, repeat five times: wait50ms, collect garbage, read Runtime.getHeapUsage.
The app remains active between calls. This tests sample convergence, not the
release workload or a changed acceptance budget.

The workflow passed in10.1seconds. At cycle10 the initial sample was6,619,808
bytes; the next sample rose to7,505,952, then fell to6,610,984 on the following
collection and remained near that value. Backing storage simultaneously rose
from the usual706,171 bytes to788,921 then returned. At cycle30 the initial
sample was7,060,596 and the five repeats were7,129,716,7,054,060,7,054,144,
7,054,144,7,055,060. Thus the single-GC counter is not invariant even without a
user gesture. This short run itself did not reproduce the earlier1MiB rise.

Possible explanation: work runs between the separate GC and heap-query protocol
commands. This evidence alone does not identify which work, prove a leak absent,
or invalidate the completed checkpoints of the untouched long test. The next
bounded control pauses JavaScript while collecting/reading the heap. Its result
is separate; do not infer success from this plan.

Command (from worktree ts, retained diagnostic directory copied under runner):

```
GEL_SESSION_HOLD_MS=0 GEL_LIFECYCLE_CYCLES=30 GEL_LIFECYCLE_MEASURE_HEAP=1 node /private/tmp/gel-browser-compat-1.64/node_modules/@playwright/test/cli.js test -c /private/tmp/gel-browser-compat-1.64/heap-gc-convergence/metal.config.ts --project=chromium-webgl2 --output=/tmp/gel-heap-gc-convergence
```
