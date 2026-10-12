# Current compiled responsiveness budget

`npm run test:performance:budget -- --output=/tmp/gel-current-performance` rebuilt the app and passed both backends at source revision `7f37543` on the existing M5 Max/macOS27.0.1 profile. No product or threshold changes were made.

The workload is50 gel bands, a populated sample and three populated persistent loupes at1365×768, DPR2. After3 seconds of warmup, two10-second windows measure animation-frame intervals and callback CPU time;60 real timeline pointer moves exercise time0.1→1 while all views remain present. The pre-existing gate limits steady and gesture p95 to26ms, p99 to34ms, steady callback p95 to4ms, and tracked resource growth to zero.

Both backends measured steady and gesture p95/p99 around16.7–16.8ms. WebGPU retained236 tracked resources and WebGL2 retained51, unchanged in both windows and after the gesture. Raw per-backend reports include browser version, hardware, fixture hash, frame counts, populated particle counts, and exact percentiles. Workload screenshots and the applied budget are retained.

These are instrumented frame/callback timings and explicit resource counts, not GPU timestamp queries, input-to-photon latency, process RSS, or a claim of native-equivalent memory consumption. They do not resolve W08 resident-memory acceptance or the historical native missing-view failure, nor the physical platform/native GUI acceptance packages. The original reference process remained running, but CUA accessibility access still returned `cgWindowNotFound`; no native behavior was inferred from this.

No website review snapshot was refreshed and nothing was published.
