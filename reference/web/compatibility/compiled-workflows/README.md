# Compiled cross-browser editing and loupe workflows

The compatibility suite now includes a real compiled-app sequence at `/gelbox/`:
create a species, select a palette color, change gel buffer to H2O (all four
concentrations must be zero), restore TBE, create a persistent loupe, move its
frame/anchor/wedge, switch Render off/on, resize and delete the loupe. Each drag
mode runs with left, right and middle buttons. No simulation freeze hook or
provider substitution is used. Render-off must change gel pixels; Render-on must
restore the earlier image exactly within that browser. Errors and requests outside
the deployment prefix fail the test.

Final verification: 10 cases pass on Firefox132/WebKit18.2; the identical specs
also pass all10 on Firefox157/WebKit27.2 via the isolated Playwright1.64 runner.
Chromium production passes22 cases across WebGPU/WebGL2, retaining all216 exact
native RGB comparisons. Build/type checks pass. No product code, native reference
or tolerance changed. Source and build hashes plus logs are retained.

Use `npm --prefix ts run test:compatibility` and `npm --prefix ts run test:production`.
For the newer engines, copy the production deployment/interaction specs and helper
into the isolated runner's `shared-production` directory; run the retained config
from the repository `ts` directory. Adjust the config's directory location only.

These are bounded workflow assertions. The mode screenshot equality is within
one browser, not cross-engine native raster certification. WebKit is not shipping
Safari; its direct UI/file observations are recorded separately. Wider histories,
shipping-browser lifecycle, physical-monitor behavior, resident-memory stress,
native workload comparison and the complete parity ledger remain open.
