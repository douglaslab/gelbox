# Fractional-shape candidate: unqualified

The original geometry instructions multiply the normalized aspect adjustment by
time before the tuning scale, then add it to one minus the normalized base
count. The previous candidate subtracted the adjustment before complementing.
24 probes using aspects 1.2/3.7/15.3, times .1/.37, voltages -70/83 and base counts
1234/3001 exposed eight rectangle differences. The local correction reduces these
to two; the nine earlier boundary probes and original overlap unit still pass.
All 505 existing corpus rectangles still match the geometry emulator.

The two remaining shape discrepancies are the 3001bp, aspect1.2, time.37 inputs
at both voltages. Both sides pass base .7859917879104614 and exponent
3.700000047683716 to the power function. Rounded JavaScript Math.pow returns
.41024816036224365; the arm64 powf hook returns .41024813055992126. The latter is
not certified as the original Intel library result. Do not hard-code a correction,
relax the exact assertion or silently replace reference data. Original-native
qualification remains necessary.

Build passes. Full units: 3,034 pass and 54 fail (the previous 52 plus these two
shape diagnostic cases). The 24-case diagnostic fails eight cases before the
change and two afterward. This is an unqualified intermediate candidate, retained
uncommitted in the main worktree. Website and stability-test bundles are unchanged.
The earlier candidate's full browser/visual passes do not certify this patch.

## Subsequent original-app qualification

The nine integer boundaries now match original native saves and36 compiled
replays (../boundaries/). Three additional fractional-shape drag controls now
produce3001bp in the original app, matching the candidate and contradicting the
arm64 powf hook's2937/2937/2999 predictions. All3 units and12 compiled cases pass;
see ../fractional-boundaries/. This supplies original-GUI evidence for the
disputed power input. The old host-hook geometry diagnostics remain historical
comparisons rather than certified native expectations. Broader source-reference
reconciliation and final candidate qualification remain outstanding.
