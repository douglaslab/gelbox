# 1,000-cycle network-inspection-disabled repeat

Both backends passed in 11.6 minutes using Chromium 153.0.8010.12, Playwright 1.64.0 and explicit Metal. The diagnostic and launch configuration are the same as the adjacent `network-disabled` control. The compiled assets stayed unchanged throughout both backends; their hashes are recorded in manifest.json.

| Metric | WebGPU | WebGL2 |
|---|---:|---:|
| Closed tracked objects | 66 | 37 |
| Peak tracked objects | 80 | 51 |
| Objects after route exit | 0 | 0 |
| Peak renderer RSS, MiB | 204.88 | 184.83 |
| Early-to-late renderer median growth, MiB | 32.84 | 8.49 |
| Last-half renderer slope, KiB/cycle | 26.47 | 30.14 |
| Peak GPU-process RSS, MiB | 118.92 | 82.86 |

Early is cycles 50–100; late is the last 50 cycles. Raw samples and analysis are retained. Process RSS includes browser/driver allocations and is not an application allocation census. Network inspection contributes substantially to earlier measurements, but this longer run does not establish an indefinitely bounded plateau. No retrospective budget is declared passed. W08 remains open for a justified finite budget and the separate native missing-view failure. Codec probes and unit checks overlapped this exploratory RSS run; elapsed times are not performance comparisons.
