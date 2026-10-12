# Repeated sample and loupe lifecycle measurements

Observed 2026-10-10 on macOS 27.0.1, Mac17,14 / Apple M5 Max, using the repository
Playwright 1.49 Chromium runner and development Vite build at base `bf244cf`.
Viewport 1365 × 768, default desktop DPR 1. Product code did not change.
The lifecycle test now accepts a bounded cycle count (default remains 10) and
optional Chromium post-GC heap observations.

Each cycle opens a selected sample with its Species preview, creates two
persistent loupes, verifies nonempty molecular views, closes both loupes and
closes the sample via gel settings. It asserts that explicit GPU resource counts
return to the post-warmup baseline every time. After all cycles, route unmount
must reach zero tracked resources, and route remount must draw molecules without
page errors or alerts. One warmup cycle precedes the requested cycle count.

Both renderers passed separate 100-cycle and 500-cycle runs. The extended run
passed in 4.1 minutes total, with no retries:

| Backend | 500-cycle elapsed | Closed-cycle resource baseline | Open-cycle peak |
| --- | ---: | ---: | ---: |
| WebGPU | 139.351 s | 59 | 66–67 |
| WebGL2 | 105.972 s | 19 | 27 |

The tracked counters include explicit buffers/textures and GL framebuffer,
program, shader and vertex-array objects. Each backend reached zero on route
unmount. Counts are object counts, not allocation sizes or driver memory.

## Post-GC JavaScript heap observations

Heap samples use Chromium `HeapProfiler.collectGarbage` followed by
`Runtime.getHeapUsage`, after warmup and every ten cycles. Bytes at selected
checkpoints from the extended run:

| Backend | Cycle 0 | Cycle 100 | Cycle 300 | Cycle 500 |
| --- | ---: | ---: | ---: | ---: |
| WebGPU | 6,738,800 | 8,395,864 | 8,581,140 | 8,571,884 |
| WebGL2 | 6,625,132 | 8,258,604 | 8,438,856 | 8,471,840 |

Growth was concentrated early; the last 200 cycles changed used heap by −9,256
bytes on WebGPU and +32,984 bytes on WebGL2. This supports near-level retained JS
heap over this finite workload, not a general proof of no leaks. The final JSON
entry at cycle 501 is **after route remount with a live sample**, a different
state; do not compare it to the closed-cycle baseline. Forced GC changes timing,
so these are lifecycle/retention observations, not responsiveness benchmarks.

Reproduce from the repository root, with Node 22 on PATH:

```
GEL_LIFECYCLE_CYCLES=500 GEL_LIFECYCLE_MEASURE_HEAP=1 npm --prefix ts run test:visual -- renderer-lifecycle.spec.ts --workers=1 --output=/tmp/gel-lifecycle-soak-500
```

Dense scenes, long wall-clock idle use, hidden-tab resume, actual driver/browser
resident memory, asynchronous acquisition interruptions, native performance
comparison and a release budget remain separate open gates. The default suite
continues to use ten cycles without heap profiling.
