# Compiled shared-production acceptance evidence

The built app always enables shared composition, including when local storage
contains the retired `gelSharedPresentation=0` preference. Sixteen Chromium tests
pass across WebGPU/WebGL2. They include root/subpath file roundtrips, one graphics
context per application, and 216 exact native RGB comparisons:

- 24 complete startup/settings/menu windows at 1365×768/DPR2, exercising real UI
  transitions at root and `/gelbox/`.
- 12 diagonal-edge and 180 solid-background fragment comparisons at 303×520,
  DPR1/2, using the compiled FragmentWell/SampleSimCanvas contribution and normal
  production presentation loop/backend.

The controlled fragment fixture discovers the pinned React18 providers, selects
the representative contribution, supplies native particle inputs, moves its DOM
canvas to the reference origin and isolates that contribution plus the specified
underlay. It generates the mesh using application code. It does not replace the
mesh with native output or modify rendering math. This isolation tests component
composition; complete-window tests separately exercise normal scene collection.

`provenance.json` records source, test, built asset, native manifest and captured
PNG hashes, with every RGB comparison result. Native references and tolerances
are unchanged. Historical split-canvas audit failures remain in their original
dossiers; release audit configs now select the compiled production fixture.

Reproduce with Node22:

```
npm --prefix ts run test:production
npm --prefix ts run test:fragment-edge
npm --prefix ts run test:fragment-background
```

Fresh units pass 2,924 tests; clean broad regression passes955 browser tests
with one intentional duplicate skipped. The retained compatibility run passes two WebKit
deployment cases; two Firefox cases fail at browser launch with profile/framebuffer
errors, before app evaluation. WebKit is not shipping Safari. Independent source
review found no Critical or Important cutover issues. Lifecycle,
workload and original-release/platform certification remain separate gates;
consult the current status document for their latest results.

The combined built-app workload also passes both backends with50 bands, one
sample and three loupes. Two10-second steady windows report p95 frame intervals
of16.7–16.8ms; the60-move timeline drag reports16.7ms p95. Tracked GPU resource
counts remain236/WebGPU and49/WebGL2 at baseline, both window ends and after
the drag. These are object counts and rAF intervals, not resident memory,
input-to-photon latency or a native performance comparison. Raw named-hardware
reports and test hashes are retained here. This bounded workload does not close
long-run churn, hidden-tab or physical-monitor/platform certification.
