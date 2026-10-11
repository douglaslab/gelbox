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

## Heap and DOM attribution

A separate analysis of the retained forced-GC checkpoints, `heap-analysis.json`,
uses the 51 samples from cycles 500 through 1000 inclusive. It excludes route
unmount/remount checkpoints because those intentionally change the visible UI.
Source report SHA-256 hashes are included; this is not a fresh runtime test.

| Metric, cycles 500–1000 | WebGPU | WebGL2 |
|---|---:|---:|
| JS used-heap endpoint change, bytes | +25,976 | −4,576 |
| JS used-heap least-squares slope, bytes/cycle | −114.16 | −194.26 |
| Document count range | 1–1 | 1–1 |
| DOM node count range | 154–154 | 153–153 |
| JS event listener count range | 221–221 | 221–221 |

The negative slopes describe fluctuations, not negative allocation. Each slope
is sum((cycle−meanCycle)*(bytes−meanBytes))/sum((cycle−meanCycle)^2).
The report also retains extrema, endpoint changes and slopes for the embedder
heap and backing storage. These measurements provide no evidence of increasing
retained JS views, DOM nodes or listeners during that window. They do not prove
all native browser/driver allocations are bounded, identify the owner of the
remaining RSS growth, or establish a release memory budget. Next attribution
should examine native allocator/driver retention rather than infer a React-view
leak from RSS alone.
