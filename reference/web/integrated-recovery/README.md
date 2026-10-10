# Compiled integrated graphics recovery

2026-10-10, product revision c4115b5, Chromium on the release Mac. No application source edits or DEV modules; production files served under /gelbox/. Test-only instrumentation wraps browser GPU APIs to inject loss/allocation failure. Read-only React provider inspection records the existing store and molecular-view identities.

The ordered scenario creates a populated persistent loupe, switches the gel buffer through H2O and back to TBE, selects a different DNA band, opens the sample/species views, saves a document, resizes to 1465×868 at DPR1 and back to 1365×768 at DPR2, then destroys the GPU device or loses the GL context. A second variant forces buffer allocation failure through the terminal error screen and uses the actual Retry graphics button.

Four cases pass: both failure variants starting from each backend. Loss switches to the other backend; both paths replace the retired canvas. Existing sample/loupe engine objects, sample array, selected fragment reference and loupe geometry survive. Restoring the original viewport produces a byte-identical gel PNG. Molecular frame callbacks and changing sample paint demonstrate resumed rendering, and the entire downloaded document is unchanged. Screenshots/documents and source/build hashes are retained.

The first run failed only at its final save: the test toggled the application menu after Save had already closed it, reopening it. Waiting for the actual closed state corrects the test; application code is unchanged. Its diagnostic log is preserved.

Command: `npm --prefix ts run test:visual -- -c playwright.production.config.ts integrated-recovery.spec.ts` (Node 22).

This closes the compiled multi-step recovery portion of W05. It does not establish the matching original-native buffer/loupe action trace, physical monitor switching, OS sleep, or shipping-browser recovery. CDP changes emulate viewport/DPR only. The website review build remains unchanged.
