# Completed original two-hour session — failed acceptance

Both120-cycle workloads finished and the Playwright lifecycle assertions passed.
That is not the memory acceptance result: the unchanged verify.py rejects this
run with `Retained heap budget exceeded`. WebGL2 growth above cycle10 exceeded
1,048,576 bytes at cycle30 (+1,221,520),40 (+1,308,764),and80 (+1,454,164).
Later lower readings do not erase those failures. WebGPU maximum growth was
743,032 bytes. No thresholds or original observations were changed.

Both runs cover7244 seconds between checkpoints0 and120. DOM/listener counts stay
constant. Tracked resources return to66(WebGPU)/37(WebGL2) after every disposal and
zero at route exit. All original process-footprint limits pass with stable PIDs.
Renderer footprint10→120 changes54.5→54.2MiB(WebGPU),49.7→47.5MiB(WebGL2); GPU
footprint482.6→483.6MiB and511.2→511.4MiB. Maximum captured renderer peaks are
159.7/165.2MiB; GPU peaks556.2/636.9MiB, below their256/1024MiB ceilings.

The unmodified original verifier stops at the first failing assertion.
assessment.json additionally collects every assertion from the same verifier
without short-circuiting and explicitly reports passed:false. All three failures
are the heap violations above; no other check fails. Raw reports, all16 vmmap
captures and original run log are retained. Source/build remains26b4eb0.

The separate frozen-sampling controls support testing measurement consistency,
not retrospectively reclassifying this run. The prepared frozen-session runner
will use the staged4ba0139 build for a separately identified two-hour result.

Reproduce the failed acceptance from repository root:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 reference/web/performance/session-duration/verify.py reference/web/performance/session-duration/completed-original/reports
```
