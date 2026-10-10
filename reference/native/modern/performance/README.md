# Native combined workload: steady measurement

Two successful runs of the pinned modern compatibility build each recorded1,205
samples over20 seconds. Both loaded the same five-ladder native JSON used by the
web performance suite:50 bands, effects enabled, one ordinary sample view and
three distinct persistent loupes at lane0/fragments0,5,9. The client area is
1365×768 at DPR2. Workload guards and screenshots establish actual visible views.
Ordinary sample populations are about160; loupe populations are1,5,1. Native and
web both retain native paused-loupe behavior (web `gelStore.ts` timeScale0).

| Run | Draw-completion interval p50 / p95 / p99 | Update elapsed p95 | Draw elapsed p95 |
|---|---|---:|---:|
| 1 | 16.889 / 24.645 / 24.885 ms | 0.058 ms | 7.974 ms |
| 2 | 16.576 / 18.559 / 19.528 ms | 0.060 ms | 8.331 ms |

Raw samples, particle snapshots, loaded documents, screenshots, logs and hashes
are retained. The timing probe does not change simulation timestep, RNG, drawing
or view tick behavior. It measures wall-clock elapsed time around update/draw;
this is neither GPU execution time nor input-to-photon latency. Intervals run from
a sampled draw completion to the next and include previous probe bookkeeping.
Web rAF timestamp intervals use a different boundary. Native warmup is180 updates;
web warmup is three wall-clock seconds. Modern Cinder compatibility provenance is
in the parent manifest; these are not timings of the original release binary.

Reproduce by reconstructing a fresh reference with `../rebuild.py`, applying
`python3 instrument.py --source <build>/source`, and rebuilding with CMake.
Create an output directory and launch the built executable with `GEL_PERF_OUTPUT`
pointing to it and `GEL_PERF_FIXTURE` pointing to the repository's
`reference/web/performance/five-ladders.gel.json`. Dismiss stale macOS window
restoration with Don't Reopen if shown. The probe exits after recording.

The first diagnostic failed its empty-view guard: selecting a native species
reorders the internal band vector, so vector indices subsequently targeted lane1.
The final probe resolves lane0/fragment identity explicitly, checks distinct
view references and exact integer-coordinate anchors, and leaves the empty-view
guard intact. That guard now passes on both runs. The inherited asset loader
logs an absent microtube @2x variant before successfully falling back to the
bundled1x asset; source `Layout::uiImageWithPath` and visible tubes confirm this.

Independent review identified the missing distinct-view guard, now corrected.
This closes the steady native baseline, not the whole P5 budget requirement:
native interaction responsiveness, resource-growth comparison, and an enforced
hardware-specific release budget still require measurements and decisions.
