# Resident memory under repeated view churn

2026-10-10 on the release Mac, Chromium131.0.6778.33. The compiled app completes300 measured sample/two-loupe open/close/resize cycles per backend, following one warm-up cycle. Live particles, one shared context, exact resource return to baseline every cycle, zero objects after route exit, remount readiness and no page errors are still asserted. Both300-cycle tests pass in4.8minutes total.

The browser-level CDP process inventory identifies only processes belonging to the test browser. macOS `/bin/ps` samples resident KiB every10cycles. Heap samples follow forcedGC. RSS includes shared pages and allocator/browser caches; summing processes double-counts shared memory, and GPU-process RSS is not isolated Metal/driver allocation accounting.

Early = median cycles50–100; late = median cycles250–300. The slope is least-squares over cycles150–300. These are observations, **not a passing memory budget**.

| Backend | Renderer early → late MiB | GPU process early → late MiB | Renderer late slope KiB/cycle | Closed live objects |
|---|---:|---:|---:|---:|
| chromium-webgl2 | 178.4 → 226.8 | 91.4 → 134.8 | 238.9 | 37 |
| chromium-webgpu | 197.8 → 245.3 | 113.1 → 119.8 | 230.7 | 66 |

Renderer RSS grows on both backends despite flat explicit resource counts. WebGPU GPU-process RSS nearly settles, while WebGL2 GPU-process RSS also grows. The JavaScript heap grows much less and largely settles after warm-up. This does not prove a leak, cache bound, or long-duration stability. W08 remains open; no memory acceptance threshold is justified by these runs alone.

A separate100-cycle diagnostic records constant closed-state DOM counts (one document,158nodes,221listeners) across the WebGPU checkpoints. Its protocol native-allocation profiler returned no samples, so it cannot attribute allocations. `Memory.prepareForLeakDetection` first failed on both backends; the same command failed independently on a blank page. A retry that tolerated that error and then issued critical memory pressure left the renderer PID absent before post-pressureGC could complete. The runner was deliberately interrupted after verifying that condition. This does not isolate which diagnostic command caused the renderer exit and is not claimed as an application defect or successful recovery. Partial checkpoints, both failure logs and the diagnostic source are retained.

The unsupported/destructive diagnostic commands were removed from the maintained test. The final sampler retains only heap/DOM/RSS observations, process-value validation, incremental checkpoints (so failures preserve data), and an additional route-exit sample. A fresh ten-cycle smoke run checks that final instrumentation on both backends. The300-cycle report used the retained initial sampler, so its provenance is explicit.

Next investigation: distinguish browser/automation response caches and allocator residency from retained app allocations using an isolated control, then measure an appropriate longer interval before setting a bounded regression criterion. The earlier native missing-view capture remains separately unattributed. No application code or website review build changed.

Reproduce with Node22:

```sh
GEL_LIFECYCLE_CYCLES=300 GEL_LIFECYCLE_MEASURE_HEAP=1 GEL_LIFECYCLE_MEASURE_RSS=1 npm --prefix ts run test:visual -- -c playwright.performance.config.ts view-churn.spec.ts
python3 reference/web/performance/resident-memory/analyze.py /path/to/webgpu/resource-lifecycle.json /path/to/webgl2/resource-lifecycle.json
```

The analysis requires at least200cycles so early/late windows are distinct; final route-exit/remount points are excluded from its cycle trend. RSS sampling is macOS-only and opt-in. These processes were launched by the tests; user browser processes were not sampled.

## Attribution follow-up

[Response-cache controls and Chromium153 comparison](attribution/README.md) retain the next investigation. Effective inspector response eviction does not eliminate the growth in Chromium131. The newer browser loses its WebGPU device and falls back to WebGL2; the backend assertion correctly rejects that as WebGPU validation. Attribution and the memory release criterion remain open.
