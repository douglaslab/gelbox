# Application measurement after native primitive edge correction

`npm --prefix ts run test:performance` rebuilt the product and passed both
measurements on the same Apple M5 Max / macOS 27.0.1 setup as the prior baseline.
Reports retain the base commit and hashes of the uncommitted product source
that was measured. The fixture and methodology are unchanged: 50 bands, one
sample view and three sparse loupes; two 10-second steady windows and 60
pointer moves dragging the timeline.

| Metric | WebGPU | WebGL2 |
|---|---:|---:|
| Steady interval p95, both windows | 16.7 / 16.7 ms | 16.7 / 16.7 ms |
| Callback CPU p95 | 3.2 / 3.4 ms | 2.9 / 3.0 ms |
| Timeline drag interval p95 | 16.7 ms | 16.7 ms |
| Tracked live objects before/after | 223 / 223 | 27 / 27 |

The gel-only WebGPU edge correction adds one integer texel-flip pass per band
while reusing existing textures. No cadence regression was observed in this
workload relative to the prior retained measurements. This does **not** isolate
GPU execution time or prove zero cost; the steady gel is static and the
interaction measurement is short. Native performance comparison, denser
molecular workloads, resident-memory analysis and a release budget remain open.
