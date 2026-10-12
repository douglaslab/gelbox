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
