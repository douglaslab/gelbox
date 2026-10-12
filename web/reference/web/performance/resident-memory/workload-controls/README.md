# Workload and inspector controls

These 2026-10-10 controls keep the compiled app, Chromium153.0.8010.12,
Playwright1.64, explicit Metal, viewport/DPR,300-cycle count, resource assertions,
forced-GC heap sampling and process-RSS measurement from the previous Metal run.
Each changes one part of that run. Neither changes application source or the
website review build. The normal test still performs resizing with inspection on.

## No resize

Only the two viewport changes and the intermediate2930px width assertion are
removed. The2730px initial/final width assertion remains. The actual sample and
two permanent loupes still open, animate and close every cycle. Both cases pass
in2.7 minutes (exit0), with exactly66/37 resources after every cycle and zero on
route exit, then successful remount. The full300-cycle reports are retained.

Renderer RSS median growth between cycles50–100 and250–300 is58.63MiB for
WebGPU and57.07MiB for WebGL2. This is similar to the previous resize workload's
59.19/51.62MiB. Resizing is therefore not required to reproduce this growth;
it does not establish that resize has no memory cost.

## Network inspection disabled

This control restores the complete original resize workload. After initial page
navigation, it sends `Network.disable` to the existing runner main-frame session.
The heap/RSS observer sessions remain enabled; no application fetch, decoder,
rendering, layout or interaction API is intercepted. This tests inspector
retention beyond the earlier response-body cap, which left inspection enabled.

A separate efficacy probe fetches the same image before and after disabling the
domain. Both browser fetches consume978 bytes, while observed runner request
events change from1 to0. The first probe used the old `_delegate` private field
and failed; local runner source shows it is now `delegate`, and the corrected
probe passes. This private API is limited to the pinned diagnostic runner, not
shipped application code. Its initial failure log is retained.

## Completed network-inspection result

Both300-cycle cases pass in3.3 minutes (exit0). The original resize workload,
actual backend, active particles, closed66/37 resource counts, zero route-exit
count and successful remount remain verified. The response-body cap is unset.

| Backend | Renderer early → late MiB | Renderer growth MiB | Renderer late slope KiB/cycle | GPU early → late MiB |
|---|---:|---:|---:|---:|
| WebGPU |176.43 →169.59|−6.84|−111.10|108.26 →98.55|
| WebGL2 |179.19 →187.85|8.66|52.12|82.39 →79.47|

With inspection enabled, the comparable Metal run grew59.19/51.62MiB in the
renderer; disabling inspection reduces that to−6.84/+8.66MiB. Peak renderer RSS
is193.28MiB for WebGPU and188.34MiB for WebGL2. This supports a substantial
instrumentation contribution to the earlier growth. It does not assign all
remaining residency to the inspector, prove an infinite memory bound, or justify
changing app cleanup. The prior response-body cap did not disable metadata
inspection and therefore did not test the same condition.

For example, the WebGPU CDP-reported embedder heap at cycle300 is1,536,320 bytes
with inspection disabled, versus8,049,792 bytes in the inspection-enabled Metal
run, while closed DOM counts remain constant in each. These fields are not a
complete native allocator profile. W08 still needs a longer repeat under the
corrected measurement conditions, a justified finite budget and attribution of
the separate preliminary native missing-view failure.

## Reproduction and limits

Each subdirectory retains its exact config, test, server helper and a diff against
the maintained lifecycle test. Copy a directory next to the isolated1.64 runner's
`node_modules`, adjust its explicit browser executable path if needed, then run
from the repository `ts` directory so `dist` resolves correctly:

```sh
GEL_LIFECYCLE_CYCLES=300 GEL_LIFECYCLE_MEASURE_HEAP=1 GEL_LIFECYCLE_MEASURE_RSS=1 node /private/tmp/gel-browser-compat-1.64/node_modules/@playwright/test/cli.js test -c /private/tmp/gel-browser-compat-1.64/no-resize/metal.config.ts
```

Use the `network-disabled` config for the other control. No network response-body
cap is set in either run. Baseline comparison uses the same median windows and
last-half slope calculation in `../analyze.py`; route exit/remount samples are
excluded from cycle trends. RSS remains process residency, including shared pages
and allocator caches, not isolated driver allocations or proof of a leak.
