# Current full regression gate

Source base `1bd221c`, plus the test/config changes committed with this evidence. No product runtime or pixel baselines changed. Commands ran from `ts` with Node22.

| Check | Result |
|---|---|
| `npm run test:unit` | 3,051 tests in74 files passed |
| `npm run test:visual` after fixes | 955 passed, one intentional skip |
| `npm run test:production` (includes fresh build) | 52 passed |
| `npx playwright test -c playwright.compatibility.config.ts` | 22 passed (Firefox/WebKit) |
| Repeated image ordering cases, five repeats × two modes × two backends × two scenarios | 40 passed |
| Isolated native fixtures and presentation lifecycle subset | 40 passed |

The visual skip is the second invocation of `warp-orientation.spec.ts`, which compares both real GPU backends once in the WebGPU project. It is not an untested platform feature. Raw logs are gzip-compressed, with hashes in `manifest.json`.

## Failures and corrections

The first full run reused a long-running development Vite server. Its transformed imports included HMR `?t=` URLs, whereas fixture imports and held-module routes used bare URLs. This split module identity or bypassed the intended route interception. `module-imports.txt` retains before/after URL evidence. A fresh-server subset passed all40 affected checks. The default Playwright gate now owns a fresh strict-port server at127.0.0.1:5187; `GEL_BASE_URL` remains an explicit external-server diagnostic option.

The initial run reported199 failures,756 passes and one skip, but its aggregate is **not a clean regression baseline**: configuration was changed while that diagnostic was still running, and restarted workers read the new port after the targeted server stopped, producing connection-refused failures. The complete raw log is retained for transparency. Subsequent full runs held code/config fixed.

The first clean isolated full run produced953 passes, two failures and one skip. Both failures were image-test timing assumptions exposed by asynchronous PNG decoding:

- The ordering test read `decodeNames` before the held `createImageBitmap` stage had started (`[]` rather than `['slow.png']`). It now polls for that stage while still requiring the second queued file not to start early.
- The earlier-image test opened the inspector before the image finished loading, allowing that later completion to correctly place the image above the panel. It now waits for image focus and shared texture readiness before opening the later inspector. Hit ownership and exact red-pixel assertions remain unchanged.

The corrected cases passed40 repeated checks, followed by the complete955-pass visual suite and52/22 compiled/compatibility checks. No arbitrary delay, screenshot update, tolerance relaxation, test deletion or product ordering change was used.

## Scope

This restores a reproducible broad regression gate and confirms the current implementation against existing tests. It does not substitute for original-native composed workflow replay, shipping Safari/physical display and sleep checks, remaining memory acceptance, font distribution decisions, parity exceptions, or user acceptance. Those remain in the parity ledger. The local website/native review artifacts were not refreshed or published.
