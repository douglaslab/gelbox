# Shared-build compatibility with isolated Firefox app data

The repository command `npm --prefix ts run test:compatibility` now builds the
app and passes all four deployment cases: Firefox 132 and WebKit 18.2, root and
`/gelbox/`. An isolated Playwright 1.64 run also passes both cases on Firefox 157.
Assertions cover actual WebGL2 ownership, one GPU canvas, loaded images, settings
and species readiness, native import, malformed JSON feedback, exact exported
JSON and absence of page errors or assets outside the prefix.

Prior Firefox launches failed before navigation. An [upstream report](https://github.com/microsoft/playwright/issues/42768)
identifies the macOS app-data lookup independently of the temporary profile.
A fresh app-data directory allowed both installed Firefox versions to launch.
The compatibility config now gives only Firefox's child process an isolated,
ignored test-bookkeeping root through CFFIXED_USER_HOME on macOS. It does not
change HOME, access the user profile, disable a sandbox or request Full Disk
Access. Product code and browser binaries remain unchanged.

The compatibility config explicitly selects deployment.spec.ts. Chromium native
pixel certification remains in the production config; these bounded compatibility
checks do not claim native RGB equality in Firefox/WebKit. WebKit is not shipping
Safari. Broader interactions, shipping-browser lifecycle/performance, long-run
resource behavior and the original-release parity contract remain open.

Logs and source/build hashes are retained. The additional Firefox157 config
contains its original temporary testDir; reproduce by copying the current
production deployment spec and helper into that directory using an isolated
Playwright1.64 install, then run from the repository ts directory.
