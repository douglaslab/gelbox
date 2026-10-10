# Controlled Metal comparison

On 2026-10-10, the observed Chromium153 device loss was isolated to the
newer test runner's default graphics configuration. No app runtime code changed.

## Reproduction and control

Playwright1.49's macOS headless launcher adds `--use-angle`; Playwright1.64
instead adds `--enable-unsafe-swiftshader` and omits that argument. The retained
launch log records the effective newer command. Both runs select WebGPU at the
app level, but that alone does not establish the same underlying graphics path.

A blank HTML canvas, with no Gelbox code, requests an adapter/device, configures
its WebGPU context, submits a clear-only render pass, waits for submitted work,
and observes another30 frames. Under the newer defaults, adapter vendor is
`google` and canvas rendering reports invalid texture/view/command-buffer errors.
With only `--use-angle=metal` added, the adapter vendor is `apple`, the clear
completes, and no errors or device loss occur. The pinned Chromium131/runner1.49
control also reports `apple` and completes without errors. This goes beyond the
previous acquisition-only blank-page controls, which did not render anything.

The compiled Gelbox probe likewise changes from device loss and WebGL2 fallback
to successful WebGPU sample rendering when Metal is selected. Its traced calls
show no app call to `GPUDevice.destroy()` before the default-path loss.

Both compiled100-cycle cases then pass with Metal (exit0): actual backend and
one shared context asserted, live sample/loupes verified, exact closed resource
counts after every cycle, zero on route exit, and successful remount. The default
runner failure is therefore not an unresolved app defect in the demonstrated
Metal path. This does not certify the failing Google-adapter path or establish
its internal browser/driver cause.

The earlier default-path memory comparison is confounded by the graphics-path
change and must not be read as a browser-version-only experiment. The raw failed
run remains in the sibling attribution directory. App production code, pinned
repository dependencies, and the website review build remain unchanged.

## Reproduction

Use the isolated Playwright1.64 installation and copied `performance` and
`production` test directories recorded in `../attribution/chromium153-runner`.
Copy `metal.config.ts` next to those directories, adjusting the explicit browser
path if necessary. Run from the repository `ts` directory, so `dist` resolves to
the same compiled app. The optional response-cache cap is unset in these runs.

```sh
GEL_LIFECYCLE_CYCLES=300 GEL_LIFECYCLE_MEASURE_HEAP=1 GEL_LIFECYCLE_MEASURE_RSS=1 node /private/tmp/gel-browser-compat-1.64/node_modules/@playwright/test/cli.js test -c /private/tmp/gel-browser-compat-1.64/memory/metal.config.ts --output=/tmp/gel-memory-chromium153-metal-300
```

The probe scripts are standalone; the app probes need the local5180 compiled
preview. Blank-page probes serve their document through test interception and
load no Gelbox code. All reports remain observations of process RSS, not isolated
driver allocations, a proven memory bound, or final parity acceptance.

## 300-cycle results

Both cases pass in3.2 minutes total (exit0), using the same compiled asset hashes
as the earlier controls. Each of300 cycles returns exactly to66 WebGPU or37
WebGL2 resources; route exit reaches zero and remount succeeds. No fallback is
accepted by either case. DOM checkpoints remain stable within each backend.

The same analysis as the pinned baseline uses medians of cycles50–100 and250–300;
route-exit/remount samples are excluded. Late slope uses cycles150–300.

| Backend | Renderer early → late MiB | GPU process early → late MiB | Renderer late slope KiB/cycle |
|---|---:|---:|---:|
| WebGPU |174.12 →233.31|90.81 →99.89|296.26|
| WebGL2 |194.14 →245.76|82.13 →80.22|268.65|

Renderer growth persists on both backends with explicit Metal. The GPU process
has much less late growth (WebGPU11.02KiB/cycle; WebGL2 1.47KiB/cycle). This
resolves the default-launch failure for the demonstrated Metal path, but it
does **not** resolve resident growth or justify a passing memory budget. W08
and the separately unexplained native capture failure remain open.

## Remaining attribution

The runner and browser both differ from the pinned baseline, even with Metal
controlled. No conclusion below isolates browser version from runner behavior.
Resident memory is sampled only from test-owned PIDs. RSS includes allocator
residency and shared pages; GPU-process RSS does not identify driver allocations.
The next useful control separates repeated resize from view creation/disposal
using the same browser/runner/Metal configuration. This tests a concrete workload
component rather than changing app cleanup based only on RSS growth.
