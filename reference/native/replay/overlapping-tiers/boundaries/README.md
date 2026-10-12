# Original-executable solver boundary checks

All nine original-app inputs are now replayed and captured. Original executable
SHA256:037514b74bd7fcb673b7a276749fd31bfeabc0773fd11b790457412e905a78a7.
The isolated reference bundle changes its bundle identifier only. The earlier
chooser blocker cleared before this capture. Each case is opened fresh by its
exact filename through the native chooser, right-clicked at physical
(472,304+2*targetY) in the1365×768 client/DPR2 window, then saved with native
Command-Option-S into its own *-native.json checkpoint.

The nine inputs preserve the time, voltage, well damage and TBE buffers from
requests.json. Native creates1001bp for all four bp1001 cases,2001bp for both
bp2001 cases and3001bp for all three bp3001 cases. native-results.json records
these observations. requests.json retains earlier model predictions as historical
inputs; its actual/fast/strict fields are not original-GUI observations.

Every save contains the unchanged original3001bp/125ng species plus the new
species, with aspect1, degradation0 and aggregate[1,0,0,0,0,0,0]. All original
sample metadata and buffers match the input. Randomly generated new-species
mass/color are retained in the original files but are not equality oracles.

Nine direct unit comparisons and36 compiled browser/backend replay cases pass
against the current fractional-shape candidate. Compiled actions use client
(236,124+targetY), the actual right-click path and Save Sample download. Every
field is compared exactly except the newly randomized species mass/color;
the original fragment is compared in full. All web downloads and run logs are
retained. This validates these nine integer solver boundaries, not exact native
pixels or all possible arithmetic inputs. No canonical numerical golden was
changed. The earlier source-corpus failures and two fractional-shape host-math
disagreements remain open. The runtime candidate remains uncommitted and excluded
from the staged website.

Commands (from ts; Node22):

- npx vitest run tests/unit/nativeOriginalBoundaries.test.ts
- npm run build
- npx playwright test -c playwright.production.config.ts overlapping-tiers.spec.ts -g 'original GUI solver boundary' --workers=2
- Firefox/WebKit use the existing Playwright1.64 compatibility runner, with the
  same production test copied into instruction-full/production and config.ts.

The exact candidate runtime diff is runtime.patch. Production and compatibility
logs each report18 passing cases; unit.log reports9. A first unit invocation
from repository root failed to locate cwd-relative fixtures before collecting
any tests; rerunning from the documented ts directory passed.
