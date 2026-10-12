# Physical footprint over 1,000 lifecycle cycles

Both compiled lifecycle cases passed in 11.7 minutes: Chromium 153.0.8010.12,
Playwright 1.64, explicit Metal, macOS 27.0.1. Each backend completed 1,000
sample/two-loupe open, resize and close cycles, then route unmount and remount.
The runner's network inspection was disabled; app network requests remained
enabled. No application code changed. All 223 compiled asset hashes match the
earlier 200-cycle probe and are retained in `manifest.json`.

| Metric | WebGPU | WebGL2 |
|---|---:|---:|
| Closed tracked resources, every cycle | 66 | 37 |
| Peak tracked resources | 80 | 51 |
| Tracked resources after route unmount | 0 | 0 |
| Renderer physical footprint, cycles 0 / 100 / 1000, MiB | 51.0 / 61.1 / 63.8 | 48.8 / 58.9 / 58.4 |
| GPU-process physical footprint, cycles 0 / 100 / 1000, MiB | 494.7 / 515.8 / 516.7 | 517.8 / 520.7 / 523.4 |
| Renderer lifetime peak footprint reported at cycle 1000, MiB | 148.7 | 126.6 |
| GPU-process lifetime peak footprint reported at cycle 1000, MiB | 582.2 | 640.3 |
| Peak sampled renderer RSS, MiB | 204.72 | 202.95 |
| Early-to-late renderer median RSS growth, MiB | 26.95 | 25.09 |
| Last-half renderer RSS slope, KiB/cycle | 28.86 | 31.54 |
| Forced-GC JS heap endpoint change, cycles 500–1000, bytes | −7,944 | −8,140 |
| Forced-GC JS heap fitted slope, cycles 500–1000, bytes/cycle | −89.84 | −17.98 |
| DOM nodes, all 51 last-half samples | 154 | 153 |
| Documents / listeners, all 51 last-half samples | 1 / 221 | 1 / 221 |

Physical footprint comes from `vmmap -summary`, with three checkpoints per
process. RSS comes from `ps`, sampled every ten cycles after forced GC. These
are different accounting measures; their values and peaks are not interchangeable.
RSS early/late windows are cycles 50–100 and 950–1000. The footprint's lifetime
peak includes transient allocations, unlike the three closed-view observations.

All twelve vmmap reports succeeded but warn that Chromium's PartitionAlloc
zone cannot be examined. They therefore cannot identify allocation owners
completely. The small change in closed-view footprint after cycle 100 and the
stable retained heap/DOM/resource counts narrow the RSS investigation. They
do not prove indefinite boundedness, an all-day session guarantee, or compliance
with a release memory budget. No retrospective threshold is declared passed.
W08 still needs a justified session/workload budget and disposition of the
separate historical native missing-view capture failure.

## Reproduction and retained evidence

`diagnostic/` retains the exact test, server helper and launch configuration.
Copy it beside the isolated Playwright 1.64 installation; run the command in
`manifest.json` from this repository's `ts` directory. The configuration pins
the local Chromium executable. `run.log` retains both successful test results.
Each backend directory contains all raw footprint reports, incremental
checkpoints and the final lifecycle report. The diagnostic catches vmmap errors,
so passing test status alone is insufficient; the analysis below requires six
successful footprint files per backend and rejects error files.

From the repository root:

```sh
python3 reference/web/performance/resident-memory/vmmap-1000/analyze.py
python3 reference/web/performance/resident-memory/analyze.py reference/web/performance/resident-memory/vmmap-1000/chromium-*/resource-lifecycle.json
```

These reproduce `footprint-heap-analysis.json` and `rss-analysis.json`.
The former excludes route unmount/remount from its heap window and retains
source hashes. Negative fitted heap slopes describe fluctuations, not negative
allocation. This is a roughly six-minute accelerated workload per backend;
cycle count is not an elapsed-session-duration test.
