# Original native → compiled web edits → original native replay

2026-10-10, product revision `893e6fc`; this increment adds tests/evidence only. Both compiled Chromium backends use the existing production build and `/gelbox/` subpath. Original Gelbox 1.0 executable SHA-256: `037514b74bd7fcb673b7a276749fd31bfeabc0773fd11b790457412e905a78a7` at `/tmp/gel-native-reference/extracted/Gelbox/Gelbox.app/Contents/MacOS/Gelbox`.

## Ordered replay

1. Original release GUI: Cmd+O `../../files/interop/gel/short-native.json`; Cmd+S to `native-input.json`. Exact semantic equality with that canonical source fixture was checked. Seven lanes, mixed sample in lane 2, empty final lane. The fixture includes Unicode metadata, signed maximum ID, custom buffers, degraded multimer DNA and all four dyes.
2. Compiled web, WebGPU and WebGL2: open gel settings; Open the raw original-release save; settings stays open; Save Gel still equals input exactly.
3. Set gel buffer to .5x TBE. Close gel settings, select tube 2, open sample settings via molecular background, set sample buffer to 1x TAE. Click the first DNA aggregate band's center with the actual pointer, then click mass slider at 67% of track width. Save Gel to each `*-edited.json`. The exports are identical. Assert that the two buffer edits and one mass edit are the only changes anywhere in the document. Capture the compiled species view (`*-edited.png`).
4. Reopen the web export in web; prior sample/species views close and Save Gel equals the export exactly.
5. Original release GUI: Cmd+O `webgpu-edited.json`; Cmd+S to `native-reread-webgpu.json`. The WebGL2 export is byte-identical; only WebGPU's pathname was replayed in native. Native displays seven lanes with sample in lane 2. Close preexisting gel settings and click the upper DNA band; native species panel shows 2,500 bp, 118 ng, aggregate bars and degraded species. Native screenshots were observed in CUA; no retained native pixel golden or full-window pixel equality is claimed.
6. Both compiled web backends Open the raw native reread and Save Gel. Saved documents equal the reread exactly.

## Exact numeric comparison and reference authority

`python3 reference/native/replay/file-workflow/verify.py` checks all document fields without a loose tolerance. The only native reread change is mass `117.57998083587876` → `117.5799789428711`, exactly IEEE float32 conversion. No lanes, metadata, dyes, aggregates or other scientific inputs change.

This provides a concrete D02 distinction: the earlier modern-Cinder headless sample harness at `../../files/interop/README.md` parses the same web mass to `117.58000183105469` and writes `117.58` through six-digit string conversion. The original release GUI instead preserves the directly parsed float32 value in its JSON. Use this original-release result for this interchange scenario; do not substitute the modern harness's token rounding. This does not prove binary/source equivalence for unrelated scenarios.

## Compiled drop coverage

The second compiled test delays only an external `File.text()` read for a mixed batch (20-lane empty gel, then XML sample). A second sample drop arrives while it is pending. It checks that the original seven-lane layout remains until release; then the first sample occupies lane 6 under the new layout, and the second falls back to the first empty lane because lane 6 is occupied. A subsequent fully occupied seven-lane import rejects another sample with `No empty lane available`, preserving the entire saved document. The compiled queue, handlers, reducer and renderer are unmodified. This controlled async delay tests browser ordering; it is not a native timing claim.

Final focused compiled result: **4 passed**. The preliminary run tried clicking an SVG element covered by another hit rectangle; changed to an actual coordinate click so the application's picker handles the overlap. A subsequent test attempted Save before async import had dismissed its menu; explicit import-completion waits fixed the test race. Both logs are retained and are not claimed as product regressions. No product implementation changed in this increment. Broad unit/production gates were not rerun merely for test/evidence additions.

Command: `PATH=/opt/homebrew/opt/node@22/bin:$PATH npm --prefix ts run test:visual -- -c playwright.production.config.ts file-workflow.spec.ts --output=/tmp/gel-file-workflow-verified`.

## Remaining W01 work

Original-native composed occupied/all-full drop and ordered mixed-batch replay remains open (A09). D01 writer data-loss and D04 stale buffer binding acceptance remain pending. The empty final lane here does not replace or invalidate the separately retained twelve-lane writer-defect replay. These artifacts close the bounded original-native edit/save/reopen evidence gap, not all W01 acceptance.
