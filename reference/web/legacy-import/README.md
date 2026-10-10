# Legacy web import validation — 2026-10-10

Closes ledger R02's decoder/layout implementation gap. Legacy `gel-sample-v0` and `gel-state-v0` now validate nested scientific inputs before import dispatch, preserve sample metadata and hidden storage, and rebuild native 390×520 layout with 7–20 visible lanes. Obsolete selected-buffer context is replaced by the native import default; actual sample buffers are retained. Unknown runtime fields are discarded.

## Verification

- Unit regression before implementation: 19 failed; focused verification afterward: 31 passed.
- Compiled browser regression against previous build: both backends failed the expected seven-lane assertion (actual one).
- Full current units: 2,943 passed in 72 files.
- Build and full production suite: 24 passed across WebGPU/WebGL2, retaining the 216 native RGB comparisons.
- Relevant file/image browser regressions: 66 passed across both backends.
- Read-only independent review: no Critical/Important findings; independently reran 31 focused units.

Commands: `npm --prefix ts run test:unit`; `npm --prefix ts run test:production -- --output=/tmp/gel-legacy-production`; `GEL_BASE_URL=http://localhost:5175 npm --prefix ts run test:visual -- files.spec.ts reference-images.spec.ts --output=/tmp/gel-legacy-file-integration`. Node 22 was selected through PATH. Logs and source/build SHA-256 values are retained beside this file.

The compiled test imports equivalent native and legacy documents, compares visible lane count and band geometry, saves exact native JSON, then rejects malformed legacy gel/sample files and checks unchanged saved data and geometry. This closes the bounded legacy decoder gap; it does not complete W01's paired original-native edit/save/reopen workflow or certify every historical producer/platform.
