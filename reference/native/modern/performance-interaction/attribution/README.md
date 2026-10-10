# Attribute missing native capture views

The historical preliminary failure has only `Missing workload view` in its log. It lacks the removed-view identity and triggering event; no retrospective cause is claimed here.

This isolated diagnostic copies the verified performance-interaction source, checks every recorded base/instrumented source hash, and adds:

- Pointer/key handler traces distinguishing ordinary external dispatch from probe calls.
- Stable pointer identities for the sample and three loupes.
- Parent-removal records with native backtraces, including child views.
- Explicit completion/failure records. Probe exceptions produce failure.json and quit cleanly; **exit zero alone is not success**. verify.py requires the correct report, retained views, timeline endpoint and resource assertions.

Two controls use the same binary:

1. **Negative:** GEL_PERF_INJECT_CLOSE deliberately calls the tracked sample's native close method at update211. Its exact identity and SampleView::close stack appear in the detach trace. The unchanged missing-view guard fails at update510, retaining the failure screenshot and interaction data. verify.py confirms the expected failure; no successful performance report exists.
2. **Normal:** no injection. The full timeline workload completes at update1658, including63 interaction records, the midpoint and restored endpoint, and populated sample/three loupes. None of their identities detach before completion. Six resource snapshots all contain29 textures,4 buffers,7 programs,3 VAOs and4 FBOs. No external mutating pointer/key events are recorded.

The application window was observed through accessibility during the normal run. The negative-control screenshot observation raced with application exit and was unavailable; the native failure screenshot is retained instead. These are instrumented modern-Cinder reference captures, not original-release GUI replays. Trace I/O affects callback timing; these runs are not new performance baselines. The diagnostic changes no renderer, RNG or timestep settings. The injected run intentionally changes view lifetime.

Reproduce from the repository root, first preparing a verified performance-interaction source as documented in the parent README:

```sh
python3 reference/native/modern/performance-interaction/attribution/instrument.py --source /path/to/performance/source --output /tmp/fresh-attribution
cmake -S /tmp/fresh-attribution/source/proj/cmake -B /tmp/fresh-attribution/build -DCMAKE_BUILD_TYPE=Release -DCINDER_PATH=/path/to/Cinder
cmake --build /tmp/fresh-attribution/build -j 4
```

Run the resulting executable with GEL_PERF_OUTPUT set to a fresh existing directory and GEL_PERF_FIXTURE set to the absolute five-ladders.gel.json fixture path. Add GEL_PERF_INJECT_CLOSE=1 only for the negative control. Do not interact with the benchmark window. Run `verify.py <run-directory>` for a normal capture, or add `--expect-injected-failure` for the negative control.

W08 remains open: this establishes that future missing-view failures can be investigated and that the current control passes. It does not prove what removed the view in the old run or close the web resident-memory budget requirement. No web runtime, native release package or website review snapshot changed.
