# Current Release-profile lifecycle verification

Runtime812ff8a, exact compiled bundle also staged at website03d8cf9.
Chromium WebGPU and WebGL2 pass the unchanged renderer-resume tests under
repository Playwright1.49. WebKit passes the unchanged engine-activity test
under that same pinned runner. Three completed reports and before/after paints
are retained. Tests cover retained sample/loupe identities, paused/resumed
frames and paint, document equality and absence of page errors.

The initial external Playwright1.64 WebKit attempt failed before activity
changes because page._toImpl is absent. Its log and error context are retained;
no assertions or product code were changed. This is an incompatible runner
attempt, not an observed application resume failure.

Commands (ts directory, Node22):
- npx playwright test -c playwright.lifecycle.config.ts
- npx playwright test -c playwright.visibility.config.ts

This closes current-runtime automation checks only. Shipping Safari/Firefox
physical backgrounding, physical display changes and OS sleep remain separate
requirements. The two-hour memory run remains live and is not certified here.
