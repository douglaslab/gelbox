# Native memory categories during 200 compiled lifecycle cycles

Two sequential cases passed in 2.2 minutes: Chromium 153 / Playwright 1.64,
explicit Metal, network inspection disabled, current compiled app. Each cycle
opens a sample and two populated loupes, resizes twice, closes all views and
checks tracked resource counts. Route exit returns the resource count to zero;
remount resumes particles without page errors. No application code changed.

The diagnostic adds `vmmap -summary` for this test browser's renderer and GPU
processes at cycles 0, 100 and 200. Raw reports, heap/RSS checkpoints, exact test
and launch config, compiled file hashes and run log are retained. To reproduce,
copy diagnostic next to the isolated Playwright 1.64 node_modules and run its
metal.config.ts from the repository ts directory with GEL_LIFECYCLE_CYCLES=200,
GEL_LIFECYCLE_MEASURE_HEAP=1 and GEL_LIFECYCLE_MEASURE_RSS=1.

| Physical footprint (vmmap), MiB | Cycle 0 | Cycle 100 | Cycle 200 |
|---|---:|---:|---:|
| WebGPU renderer | 51.7 | 61.8 | 56.0 |
| WebGPU GPU process | 495.0 | 503.7 | 509.7 |
| WebGL2 renderer | 48.9 | 58.9 | 55.6 |
| WebGL2 GPU process | 515.6 | 518.3 | 517.6 |

Physical footprint is distinct from ps RSS and the resource ledger. In particular,
the GPU process footprint is substantially larger than its RSS. Do not compare
these numbers as interchangeable memory measures. Renderer summaries show
changes in app-specific memory tags; tags alone do not attribute ownership to
an app subsystem. Every vmmap report warns that Chromium's PartitionAlloc malloc
zone cannot be examined, so allocation-owner analysis is incomplete.

Both renderer footprints decline between the last two checkpoints. WebGL2's GPU
footprint is nearly unchanged; WebGPU grows 14.7 MiB from the first checkpoint.
This short run does not establish a long-term bound or resolve the prior
1,000-cycle RSS slope. It does add independent native region/footprint observations
without evidence of tracked-resource accumulation. W08 remains open for a
justified finite budget and deeper browser allocator/driver attribution.
