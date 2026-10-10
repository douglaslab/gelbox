# Native well presentation workload

Captured 2026-10-10 at product commit `92fd0080e75463540b4951ff0609775807f80573`, before the subsequent terminal-failure cleanup fix. This is not a measurement of that final commit.

Command: `npm --prefix ts run test:performance`. Fifty-band fixture, three sparse loupes and moving molecular views, DPR2, 3s warmup, two 10s steady windows, then 60 timeline pointer moves. Both backend cases passed. Reports contain hardware/browser/fixture provenance.

Both backends maintained p95 frame intervals at or below 16.8ms in these windows; tracked resources stayed at 225 WebGPU / 35 WebGL2. Callback CPU p95 was 2.6–2.7ms WebGPU and 3.1–3.3ms WebGL2. These are rAF/callback measurements and live object counts, not presentation latency, GPU timestamps, resident memory, dense-interaction limits, or native performance parity. The added DPR monitor contributes a callback; callback distributions should not be compared without accounting for instrumentation changes.
