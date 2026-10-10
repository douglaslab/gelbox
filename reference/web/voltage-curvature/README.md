# Voltage polarity reverses band curvature

Shawn explicitly requested on 2026-10-10: “when the voltage flips to the - direction the direction of lane "smiling" should also flip to "frowning"”. This supersedes the original native always-positive smile for negative voltage. Ledger D05 is accepted by this direct instruction; D01/D04 remain separate pending decisions.

The simulation now gives DNA bands a negative `smileHeight` below zero volts. The magnitude/exponent and nonnegative-voltage behavior remain unchanged. Dye bands retain zero curvature. Both existing GPU renderers consume the signed warp scale without shader changes.

## Verification

- Unit regression initially failed for -200/-70/-1 V; positive and zero cases passed. Seven added cases cover both aggregate tiers, degraded DNA, and dyes at -200/-70/-1/0/1/70/200 V.
- Compiled pixel regression initially failed on both backends: negative voltage still curled edges upward by 0.9603 gel pixels.
- Fresh build and full production suite: 32 passed, including positive → negative → positive through the actual voltage endpoint controls. The test imports a single-band time-zero gel so migration does not move the negative band out of view. It measures bright-band column centroids from screenshots of the actual compiled presentation.
- Both backends agree: edge minus center changes from -0.9602873 to +0.9610696 gel pixels. Restored positive screenshot is byte-identical to the initial positive screenshot.
- Full units: 2,950 passed across 72 files. Raw native numerical fixtures are unchanged. The native comparison explicitly reverses only expected negative-voltage smile signs under this user-approved change; all other native fields/tolerances remain unchanged.

Logs, backend screenshots, measured centroids and source/build hashes are retained. This is a bounded curvature regression, not evidence that all remaining parity workflows are complete.

Commands: `npm --prefix ts run test:unit`; `npm --prefix ts run test:production -- --output=/tmp/gel-voltage-curvature-production`, with Node 22 selected via PATH.
