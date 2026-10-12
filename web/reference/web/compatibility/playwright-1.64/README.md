# Current-engine production compatibility probe

Observed 2026-10-10 on the existing macOS 27.0.1 / Apple M5 Max host,
source commit `bfbc32b`. Playwright 1.64.0 was installed in an isolated temporary
directory; repository dependencies and the established test runner remain unchanged.
The production build and TypeScript checks passed immediately before this probe.

`deployment.spec.ts` is a byte-identical copy of the repository production test.
Both configurations run from the repository `ts` directory, so they use its fresh
`dist` and original native file fixture. Viewport is 1365 × 768 with DPR 2,
WebGL2 explicitly selected, one worker, no retries or relaxed assertions.
Configuration paths reflect the original temporary run directory.

## Results

- Playwright WebKit 27.2, revision 2370: **2 passed**, root and `/gelbox/`.
  Checks include real WebGL2 initialization, loaded images, settings and species
  controls, native file loading, invalid JSON reporting, exact downloaded file
  equality, absence of page errors and assets outside the deployment prefix.
- Playwright Firefox 157.0, revision 1555: **2 launch failures**, before navigation.
  Both report `Could not find profile folder.` A separate persistent-context
  launch using an existing user cache directory fails with the same message.
  That probe attempted only a data-URL title check and never reached navigation.

The persistent probe used `firefox.launchPersistentContext` with
`/Users/shawn/Library/Caches/gel-firefox-profile-probe`, headless true and a
15-second launch timeout, after creating the directory. No browser security
settings were disabled. The failure also occurring outside the temporary profile
location rules out that location as the sole cause; root cause remains unresolved.

This extends earlier WebKit 18.2 evidence to the current isolated runner. It does
not certify shipping Safari, Firefox app compatibility, full interaction coverage,
native visual parity or browser lifecycle/performance gates. A dependency upgrade
alone is not an established fix for Firefox launch failure.

Logs and JSON reports are retained verbatim. `manifest.json` records hashes and
browser versions from the installed runner's `browsers.json`.

Reproduce with Node 22: install `@playwright/test@1.64.0` in a temporary directory,
install its Firefox and WebKit browsers, copy the production spec and these
configs there, build the app, and invoke that runner from the repository `ts`
directory. Adjust only the absolute report/output paths in the copied configs.
