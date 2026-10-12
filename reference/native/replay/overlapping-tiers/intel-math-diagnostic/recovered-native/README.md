# Recovered native Intel math-library control

After resuming, both previously stuck Intel processes were gone and a fresh
vmmap control completed in about0.5 seconds. The earlier failed two-hour run
remains unverified; recovery does not replace its missing checkpoints.

A new minimal x86_64 executable now runs successfully. It parses float inputs,
resolves powf dynamically with dlsym and calls through a volatile pointer, avoiding
compiler folding or a TypeScript implementation. The disputed input returns
0.41024816036224365, matching rounded JavaScript power and the three independent
original-GUI solver observations in ../../fractional-boundaries/.

The reported library is /usr/lib/system/libsystem_m.dylib, offset94432 (0x170e0),
which is the scalar entry identified by the offline cache inspection. This is
actual execution of a separate translated x86_64 process, not proof obtained by
attaching to the original GUI. It corroborates the case-specific native GUI
result and rejects the arm64 hook as authority for that input. shape-powers.json
also captures every distinct power input in the24-case fractional-shape grid.
The source and build/executable provenance are retained; no Apple library bytes
are copied. The former arm64 and rejected AVX emulator results remain historical
diagnostics and have not been overwritten.

## Reconciled geometry diagnostic

shape_geometry.py executes the same original geometry instructions but replaces
the arm64 hook with a lookup of the12 measured Intel power results. Missing
inputs fail; there is no fallback to host math or TypeScript. shape-geometry.json
changes exactly two rectangles relative to the retained arm64 shape-grid output,
as listed in shape-changes.json. The independent original-GUI discrimination
cases corroborate the disputed input. This remains an instruction diagnostic
with a source-equivalent rectangle-inflation hook, not a native screenshot or
complete application run.

The fractional-grid test now uses this separately retained Intel-backed output;
its exact rectangle assertions are unchanged. All46 focused geometry/overlap/GUI
boundary tests pass. A fresh full unit run reports3048 passing and52 failing;
the two host-hook failures are resolved, while the43 solver,7 numerical,1 loupe
and1 molecular source-reference cases remain. No canonical source corpus or
product runtime code was changed. The candidate is still unqualified overall.
