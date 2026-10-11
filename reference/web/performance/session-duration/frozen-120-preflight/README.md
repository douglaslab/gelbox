# 120-cycle frozen-sampling preflight

The prior 30-cycle WebGL2 measurement control was extended to all twelve
10-cycle checkpoints, for both Chromium153/Metal renderers. The exact stopped-frame
preconditions remain: clear runner-forced focus, bring a blank cover forward,
freeze the app, assert the frame counter stops, repeat forced GC/heap reads three
times, and restore active state and verify animation resumes. The test now rejects
any checkpoint whose three used-heap readings are not byte-identical. It writes
each checkpoint before that assertion to retain failures.

Both 120-cycle runs pass (40.2 and 41.0 seconds). All 36 readings per renderer
converge within their respective checkpoint. Maximum growth from cycle10 is
792,992 bytes for WebGPU and 792,424 bytes for WebGL2, below the unchanged 1MiB
threshold. Final growth is 778,380 and 792,424 bytes. Tracked graphics resources
return to baselines66/37 after all120 disposal cycles and to zero on route exit.
The retained reports and assessment contain the actual data, not projected values.

This is accelerated diagnostic evidence with zero per-cycle hold. It is NOT a
two-hour session result, a process-footprint result, proof of the exclusive cause
of the original failure, or proof of no slow leak. Original long-run failures at
cycles30/40/80 remain failures. That run is still executing unchanged, and all223
26b4eb0 compiled asset hashes were checked unchanged during this control. Finish
and retain it before a separately identified long-duration frozen-sampling run.
No product behavior, budget, original measurement, or release artifact changed.

The source is retained under diagnostic; run from the web worktree ts directory,
using the pinned Playwright1.64 runner and Chromium1243 binary from its config:

```sh
GEL_SESSION_HOLD_MS=0 GEL_LIFECYCLE_CYCLES=120 GEL_LIFECYCLE_MEASURE_HEAP=1 node /private/tmp/gel-browser-compat-1.64/node_modules/@playwright/test/cli.js test -c /private/tmp/gel-browser-compat-1.64/frozen-120-preflight/metal.config.ts --workers=2 --output=/tmp/gel-frozen-120-preflight
```

The first preparation command used the wrong cwd and failed before starting any
browser; correcting the source path produced this single completed control run.
