# Native timeline responsiveness and object growth

This extends the [steady baseline](../performance/README.md) with Cinder object
tracking and a real native timeline gesture:60 mouse-drag events, one per native
update/draw, from time1 to0.1 and back to1. The probe checks the midpoint within
0.005 (native mouse coordinates are integers), exact restored endpoint within
0.0001, distinct retained views, populated molecular views, and stable live-object
counts at every snapshot. It waits180 updates after release before the final
snapshot. Timestep, renderer, RNG and normal event handlers remain unchanged.

Two final runs pass, each with1,205 steady and63 gesture interval samples.

| Metric | Run1 | Run2 |
|---|---:|---:|
| Steady interval p95 | 17.429 ms | 18.927 ms |
| Gesture interval p95 | 17.766 ms | 17.084 ms |
| Gesture interval p99 | 22.103 ms | 19.102 ms |
| Drag-handler elapsed p95 | 11.294 ms | 10.654 ms |

Every retained resource snapshot equals29 textures,4 buffers,7 programs,3 VAOs
and4 FBOs. Counts are Cinder wrapper objects, not raw-driver allocations or bytes.
Web tracking covers different objects; compare growth, not absolute cardinality.
Timing is wall-clock elapsed around callbacks, not GPU or input-to-photon latency.
Native intervals use draw completion; web uses rAF timestamps. Gesture dispatch is
probe-paced in native and controller-paced in web. These are bounded
responsiveness observations, not identical latency measurements.

Reproduce by using `../rebuild.py` with a fresh output directory, then
`python3 instrument.py --source <build>/source`, then `cmake --build <build>/build`.
Launch the resulting executable with `GEL_PERF_OUTPUT=<existing output directory>`
and `GEL_PERF_FIXTURE=<absolute five-ladders.gel.json path>`. The app exits after
capture. Both final launches were observed in the native UI; do not interact with
the benchmark window while it runs. Source, binary, fixture and capture hashes are
retained alongside the raw samples and screenshots.

A preliminary run failed the final missing-view guard. Its log is retained. A
diagnostic rerun with failure-image/index logging passed without changing event
or application behavior; two fresh final runs also passed. The original failure
has not been attributed to a cause, and is not claimed fixed. Final instrumentation
retains failure diagnostics and additionally asserts resource stability. This
limits confidence in unattended capture reliability; it does not erase the
successful measured runs or establish full native/web parity acceptance.

[Event/removal attribution controls](attribution/README.md) now verify the failure diagnostics with an intentional sample close and a full normal run. The original failure remains unattributed; the new normal capture has stable resources and no external mutating pointer/key events.
