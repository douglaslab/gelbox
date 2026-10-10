# Full-window overlap with Render disabled

Six complete scenes match native on each backend: twelve exact RGB comparisons,
without crop, mask or tolerance, at 1365×768/DPR2. The same browser regression also
rechecks effects mode; all four tests and twenty-four comparisons pass. Cmd-R
switches rendering through the real application shortcut. No runtime change was
needed for this increment.

The workflow drops/resizes images, opens the species inspector, creates and covers
a persistent loupe, then raises it with a background click. Native document and
particle replay equalize inputs; focus, stacking and source-panel closure are
exercised through the actual UI. `provenance.json` pins source/test/native/output.
See [native reconstruction and timing](../../native/modern/full-window-overlap-direct/README.md).

These are development shared-renderer checks. Production enablement, compiled
component edge/solid audits, reliability/performance and platform gates remain.
