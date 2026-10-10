# Memory attribution controls

These 2026-10-10 diagnostics use the compiled app following source commit15e7aab.
No app runtime or website review artifact was changed. Test source and the newer
runner configuration are retained alongside raw data. The normal repository
runner remains Playwright1.49/Chromium131.

## Inspector response cache

The100-cycle/backend run with `GEL_LIFECYCLE_NETWORK_BUFFER_BYTES=1` passes both
functional and explicit-resource checks. It changes `Network.enable` on the
pinned runner's existing main-frame CDP connection, because an independent CDP
connection does not configure that connection's response retention. This private
runner API is opt-in diagnostic instrumentation, not app code.

The independent cache probe verifies efficacy: with either setting the browser
consumes all978 image bytes. With defaults `response.body()` also returns978;
with the1-byte cap it reports that content was evicted from the inspector cache.

| Backend | Renderer RSS at50 →100 cycles (MiB) | GPU RSS at50 →100 (MiB) |
|---|---:|---:|
| WebGPU |187.86 →199.47|108.30 →114.56|
| WebGL2 |168.00 →179.58|87.42 →97.19|

Growth persists with effective cache eviction. This rules out that response cache
as the complete explanation; it does not attribute remaining growth or establish
a safe bound. Compare windows within each run; allocator residency and browser
version can affect absolute starting RSS. These are100-cycle controls, not the
300-cycle release series and not a passing memory budget.

## Chromium153 comparison

**Follow-up correction:** [The Metal control](../metal-comparison/README.md)
shows that the newer runner selected a different graphics path. The same browser
and app pass both 100-cycle cases with explicit Metal. The default run below
must not be interpreted as a controlled browser-version-only comparison or an
unresolved product device-loss defect. Its observations remain retained.

The installed Chrome for Testing153.0.8010.12 was first invoked with the pinned
Playwright1.49 runner. Its WebGPU case timed out after five minutes without a
memory checkpoint. The second case was deliberately interrupted using SIGINT
on the verified owned runner PID13027; terminal status130 was observed. This
mixed-version invocation is not compatibility or memory evidence.

An isolated Playwright1.64 runner launches the same installed browser and loads
a data-URL successfully. Its compiled WebGPU test then fails the actual-backend
assertion because the app falls back to WebGL2. An independent app probe records
a successfully acquired device followed by loss with reason `unknown` and message
`A valid external Instance reference no longer exists.` No shader error was
reported by that probe. Blank HTML with no app survives120 animation frames;
a separate blank-page forced-GC probe retains adapter/device and survives30
frames both with and without retaining `navigator.gpu`. These controls do not
reproduce the app's loss and do not yet assign its cause to browser or app.

The run finished with **one WebGL2 pass and one WebGPU failure** (exit1). WebGL2
completes100 cycles with37 closed resources each cycle and zero on route exit.
Its renderer RSS is276.38MiB at50 cycles and273.41MiB at100; GPU-process RSS
is357.12→358.91MiB. Starting RSS is substantially higher than Chromium131.
The late renderer growth is absent over this short newer-browser interval,
which indicates browser-dependent behavior but does not prove bounded memory
or eliminate an app contribution. A longer comparable run and the WebGPU loss
investigation remain necessary. Background
standalone acquisition/cache probes ran during this exploratory comparison;
it is not a performance timing benchmark. The reproduction scripts use explicit
local paths and require those runners/previews, as recorded in their source.

The final maintained cache-cap instrumentation was rechecked with ten cycles
on each pinned backend: both pass (exit0). The normal performance configuration
was restored; newer-runner comparison remains isolated in the retained harness.
