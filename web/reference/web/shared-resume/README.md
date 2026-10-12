# Compiled shared-app hidden/frozen recovery

`npm --prefix ts run test:suspension` builds and serves the production application.
Both WebGPU and WebGL2 pass two headed Chromium 131 hidden/frozen/resumed cycles.
Actual visibility events are hidden → visible → hidden → visible; actual lifecycle
events are freeze → resume → freeze → resume. Frame callbacks stop during a
200 ms frozen observation and advance by more than ten after each resume.
Sample and persistent-loupe view identities remain alive and unchanged. Particle
pixels are present inside each panel after recovery, and exported native JSON
matches its pre-suspension value. Sample particle screenshots also change after
more than ten resumed frames, ruling out a stale framebuffer; both captures are
retained. The selected graphics backend is asserted.

The earlier visibility failure was in test setup. Pinned Playwright 1.49 enables
focus emulation on its main-frame CDP session. Sending `enabled:false` through a
new session does not clear that setting. The fixture now disables it on the
runner's original session using a guarded private API, then switches real tabs.
The retained failing log shows the separate-session attempt. The fixture neither
overrides `document.visibilityState` nor synthesizes visibility/lifecycle events.
React18 provider inspection only reads the existing production store for frame
and identity observations; it does not replace application logic.

Raw cycle reports and source/build/test hashes are retained. The build log precedes
the final painting assertion; final-test.log records the final two passing tests
against that unchanged compiled product. Independent review found no Critical or
Important issues; its noted static-pixel limitation prompted the additional
resumed-paint assertion. No app behavior,
native reference or tolerance changed. This is bounded Chromium recovery evidence,
not OS sleep, long suspension, driver memory, monitor transition or Safari/Firefox
certification. The private runner API must be revisited when Playwright changes.
