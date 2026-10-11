# Short-cycle heap attribution control

The active two-hour WebGL2 run exceeded its declared heap-growth budget at
cycle30. This separate diagnostic uses the same fixed compiled build, Chromium
153/Metal runner, graphics-resource instrumentation and interactions. It changes
the populated-view hold to zero, runs30 cycles, and takes CDP heap snapshots at
cycles10/30. It does not touch the active two-hour run or rebuild its dist.

Command from the web worktree `ts` directory:

```
GEL_SESSION_HOLD_MS=0 GEL_LIFECYCLE_CYCLES=30 GEL_LIFECYCLE_MEASURE_HEAP=1 node /private/tmp/gel-browser-compat-1.64/node_modules/@playwright/test/cli.js test -c /private/tmp/gel-browser-compat-1.64/heap-attribution/metal.config.ts --project=chromium-webgl2 --output=/tmp/gel-heap-attribution
```

The explicit-resource/DOM workflow passed in10.8seconds. This test's exit status
does not enforce the release heap budget. Used heap after forced GC grew from
6,612,944 at cycle10 to7,936,520 at30 (+1,323,576 bytes). The short workload thus
also exceeds1MiB; minute-long holds are not necessary for the observed growth.
Route exit measured6,606,608 bytes, but does not independently identify what was
released. Snapshot collection adds instrumentation and can change GC timing;
this run cannot replace the untouched two-hour acceptance observations.

`shallow-delta.json.gz` groups snapshot node self_size and counts by node type/name.
The largest positive differences include InstructionStream (+268,672 bytes),
TrustedByteArray (+78,728), native WeakArrayList (+40,908), ProtectedFixedArray
(+32,940), DOMRectReadOnly (+31,920), LayoutShift (+14,440), and
LayoutShiftAttribution (+11,400). These are **shallow allocation differences**,
not retained-size/dominator attribution. Snapshot sizes need not equal the
separately sampled Runtime.getHeapUsage. They suggest compiled-code/browser
records deserve investigation, but do not prove bounded warm-up or rule out an
application leak. The declared budget remains unchanged and failed.

Next: inspect object retainers and browser performance-entry/code-cache bounds,
and compare later checkpoints of the existing long run. Do not rerun another
long soak until a concrete cause or measurement correction is established.
