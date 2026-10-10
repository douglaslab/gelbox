# Compiled repeated view disposal and resize

The compiled `/gelbox/` app passed 100 measured cycles per backend in Chromium
131.0.6778.33, following one warm-up cycle. Each cycle opens a sample and two
persistent loupes, verifies live particles and one shared graphics canvas, resizes
out and back at DPR2, then closes all three views. Every closed-cycle resource
count returns exactly to baseline. Route exit releases all tracked resources;
returning to the gel successfully starts the sample again with no page errors.

| Backend | Closed baseline | Open peak | After route exit | Measured time |
|---|---:|---:|---:|---:|
| WebGPU | 66 | 80 | 0 | 48.4 seconds |
| WebGL2 | 37 | 51 | 0 | 48.9 seconds |

The ledger covers explicitly destroyed GPU buffers/textures and deleted GL
buffers, textures, framebuffers, renderbuffers, programs, shaders, vertex arrays
and samplers. It does not measure driver-resident memory. Forced-GC JS heap
samples rose from 4.87 to 6.51 MiB on WebGPU and 4.84 to 6.55 MiB on WebGL2;
growth slowed after warm-up. These observations are not a heap-size acceptance
budget or a claim of complete leak freedom. Instrumentation retains resource
wrappers until explicit destruction. The remount check verifies simulation
readiness, not a second native pixel comparison.

Reproduce with Node22:

```sh
GEL_LIFECYCLE_CYCLES=100 GEL_LIFECYCLE_MEASURE_HEAP=1 npm --prefix ts run test:performance -- view-churn.spec.ts
```

The retained final run used the same compiled build after adding GL sampler
tracking, invoking `test:visual -- -c playwright.performance.config.ts
view-churn.spec.ts` with those environment variables. Both cases passed. Source
and build hashes, complete reports and the final log are retained. Independent
source review found no Critical or Important issue. No product code changed.

Native workload comparison/release budgets, long wall-clock stress, physical
monitor transitions and driver-memory checks remain separate acceptance work.
