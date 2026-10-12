# Completed Release-profile two-hour stability run

Runtime `812ff8a588d6fbc238e5e5f75dc9f58ab6f387fe`, tested from the immutable
`/tmp/gel-release-profile-session-20261011/ts/dist` copy. All223 assets match the
current build and locally staged website `03d8cf9`; assets.json records their hashes.

Session53835 exited0, with both Playwright cases passing. The unchanged
frozen-session acceptance verifier also passes the retained complete reports.
Each backend completed120 cycles with60-second holds, exceeding7,200 measured
seconds. No thresholds, test assertions or runtime files changed during this run.

| Measurement | Chromium WebGPU | Chromium WebGL2 |
|---|---:|---:|
| Measured seconds, cycle0→120 | 7245.770 | 7245.660 |
| Maximum retained heap growth after cycle10 | 660792 bytes | 667856 bytes |
| Maximum renderer physical footprint | 199.1 MiB | 160.4 MiB |
| Maximum GPU-process physical footprint | 580.8 MiB | 670.1 MiB |
| Closed renderer footprint growth, cycle10→120 | +1.4 MiB | −3.5 MiB |
| Closed GPU footprint growth, cycle10→120 | −22.1 MiB | +4.6 MiB |
| Closed owned-resource count, every cycle | 66 | 37 |
| Owned resources after route exit | 0 | 0 |

Both use Chromium153.0.8010.12 with Metal on this M5 Max/macOS27.0.1 host.
All16 required vmmap captures succeeded at cycles0/10/60/120, with stable PIDs
and no capture errors. DOM/listener counts remain unchanged after cycle10.
Backing-store values are constant across cycle10→120 (724764/706992 bytes).
Each of15 frozen checkpoints per backend has three identical heap/backing-store
samples plus stopped/resumed frame observations, including teardown/remount.

Recheck the retained result from the repository root:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 reference/web/performance/session-duration/frozen-session/verify.py reference/web/performance/session-duration/release-profile-session/completed
```

The complete reports and process captures are under completed/. run.log retains
the original runner output; runner/ retains the exact external runner sources.
verification.json records the verifier result. provenance.json and manifest.json
record runtime, acceptance-code and evidence hashes. run-state.json records the
terminal session result. The executed command used GEL_SESSION_HOLD_MS=60000,
GEL_LIFECYCLE_CYCLES=120, GEL_LIFECYCLE_MEASURE_HEAP=1 and
GEL_LIFECYCLE_MEASURE_RSS=1, Playwright1.64, metal.config.ts and --workers=2.

This closes the declared two-hour web memory gate for this runtime/host/workload.
It does not establish an all-day bound, shipping-browser or physical sleep/display
behavior, or attribution of the separate historical native missing-view failure.
Earlier failed runs remain retained as failed. Full parity acceptance remains open.
