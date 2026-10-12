# Curvature ramp, 2026-10-10

User instruction: “The bands should not smile at all at time 0 before they enter the gel, it should progressively turn on the effect in the first 10 minutes of time slider progression”. This extends accepted D05 and supersedes the historical time-zero pixels in ../voltage-curvature/.

DNA curvature is linear from zero to full strength over 0–10 simulated minutes, then capped. Negative voltage reverses its sign; dyes remain flat. Timeline and simulation share the 180-minute duration. Native reference fixtures remain unchanged; numerical comparison explicitly applies this requested curvature difference alone.

Verification: five new unit cases failed before the fix. All 2,958 unit tests (72 files) then passed. Build and all 38 production tests passed, including both backends at /gelbox/app/ and 216 native composition comparisons. Actual timeline clicks produce flat → partial → full curvature; voltage endpoints reverse it and restore identical PNG bytes. Saved pixel centroids and images are in each backend directory. The browser case uses 14,000 bp DNA at ±300 V to remain visible during this interval. Exact normalized time fractions, plateau, aggregated/degraded bands and dyes are covered by units.

An initial production run had 36 passes and two failures: the restoration test imported 200 V but the high endpoint selects 300 V. Previously time zero masked that test mismatch. The final test starts at the actual 300 V endpoint; no product change was required.
