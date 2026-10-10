# WebKit engine activity and retained-view resume

Run from `ts`: `npm run test:visibility`. The command rebuilds the production app and runs the dedicated WebKit lifecycle gate. Source baseline: 0d65094; test/config changes are committed with this report. Browser: Playwright WebKit 18.2, runner 1.49.0, WebGL2, macOS.

The compiled app opens a populated sample and persistent loupe, saves its gel, and retains both engine identities. Two `Emulation.setActiveAndFocused` false/true cycles each hold the page inactive for one second. The test requires actual `document.visibilityState` transitions and visibility events, unchanged application frame count while inactive, advancing frames afterward, both original live view identities, visible particles in both panels, changing sample pixels afterward, unchanged saved gel, and no page errors or alert. Saved frame PNGs and the observed frame counts are retained.

This is browser-engine activity emulation. It does not certify physical tab switching, shipping Safari, physical display-scale transitions, OS sleep, or long suspension. No DOM visibility properties or events are overwritten or synthesized. The private page-proxy access is explicitly pinned to the current runner and throws if unavailable.

## Why plain tab switching was insufficient

A diagnostic with a second page and `bringToFront()` failed for both Firefox and WebKit because the app remained `visible`. Inspection of the installed runner shows WebKit sets `Emulation.setActiveAndFocused(active:true)`; the packaged Firefox Juggler sets `docShell.overrideHasFocus` and `docShell.forceActiveState` true. Retained source excerpts are in `runner-evidence.txt`. Setting WebKit inactive allowed hidden state, but `bringToFront()` alone could not undo that override; explicitly restoring activity did.

Firefox physical background/resume remains unverified; a passing synthetic event would not close it. Original-native replay also remains pending because the existing reference process had no window accessible to CUA (`cgWindowNotFound`). No native state was reset or inferred from that failure. No website review artifacts or product runtime changed.
