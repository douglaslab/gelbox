# Combined workload compared with native baseline

The compiled app passes both performance cases on Apple M5 Max / macOS27.0.1,
Chromium131.0.6778.33, after the two native runs on the same machine. Build passes.
Each uses the same native JSON (50 bands), viewport1365×768/DPR2, selected ordinary
sample and three persistent loupes at first-lane fragments0/5/9. New identity
assertions ensure the selected web bands match that workload. Screenshots were
inspected in both native and web captures. Ordinary particle population is about
160; loupes contain1,5,1. The representative's data-alive-count repeats the
ordinary engine count and must not be summed as a separate particle engine.

| Metric | WebGPU | WebGL2 | Native compatibility build |
|---|---:|---:|---:|
| Steady interval p95 | 16.7 ms | 16.7–16.8 ms | 18.6–24.6 ms across two runs |
| Steady callback elapsed p95 | 2.6–2.7 ms | 2.7–2.8 ms | update0.058–0.060 ms; draw8.0–8.3 ms |
| Tracked resource count | 236, stable | 51, stable | not measured by native probe |
| Timeline gesture interval p95 | 16.8 ms | 16.7 ms | not yet measured |

These are observations, not like-for-like CPU/GPU speed ratios: native intervals
use draw completion, web intervals use rAF timestamps; callback scopes and GPU
submission differ. The web callback median includes other zero-cost callbacks.
Resource tracking includes GL samplers in this run; earlier49-object GL reports
omitted those two objects. Both environments intentionally pause loupe movement
while ordinary molecular simulation continues. Native reference and limitations
are [recorded here](../../../native/modern/performance/README.md).

No release threshold is asserted yet. Native gesture responsiveness and resource
growth remain to be measured before completing the P5 performance budget gate.
This benchmark does not establish pixel equality: stochastic states, warm-up
cadence and fractional versus integer pointer locations differ.
