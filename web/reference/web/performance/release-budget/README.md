# M5 Max performance regression budget

The optional `test:performance:budget` command builds the application and runs the
50-band/sample/three-loupe workload on both Chromium backends. It checks the
recorded Mac17,14 / Apple M5 Max / macOS27.0.1 profile,1365×768/DPR2, exact fixture
hash, two10-second windows after at least3 seconds warmup, at least500 intervals
per window and the60-move timeline gesture. Other hardware/OS profiles are rejected
rather than silently certified. Normal `test:performance` remains observational.

| Gate | Limit | Basis |
|---|---:|---|
| Steady and gesture interval p95 | 26 ms | Headroom above native steady24.645 ms and gesture17.766 ms; web baseline16.7–16.8 ms |
| Steady and gesture interval p99 | 34 ms | About two60 Hz refresh intervals, above observed native tails and web baseline |
| Steady callback elapsed p95 | 4 ms | Web measured2.6–2.8 ms plus about40% headroom; not compared with native draw duration |
| Live object growth | 0 | Both native and web retained stable object counts through the measured workload |
| Particle views | sample plus3 distinct populated loupes | Checked at baseline and all steady/gesture endpoints; no passing by omitting work |

These are explicit engineering regression limits derived from the retained
measurements, not an FPS promise, a universal hardware standard or a waiver of
native behavior/visual parity. [Native gesture/resource evidence](../../../native/modern/performance-interaction/README.md)
and [prior same-machine comparison](../native-comparison/README.md) explain the
different timing/resource boundaries. No driver-resident memory or input-to-photon
claim is made. The native preliminary missing-view observation remains documented.

Run with Node22:

```sh
npm --prefix ts run test:performance:budget
node --test ts/scripts/performance-budget.test.mjs
```

The validator's negative cases cover slow frames/tails/callbacks, resource growth,
missing measurements, wrong hardware/fixture, short observations and disappearing
or empty particle views. Review found the latter missing; all four new cases first
failed, then passed with the checkpoint workload guard. Logs retain that red/green
verification. No product runtime or native scientific/rendering algorithm changed.

Final verification: build and both compiled backend cases pass;18 validator tests
pass. Exact reports, budget output, screenshots and hashes are retained.
