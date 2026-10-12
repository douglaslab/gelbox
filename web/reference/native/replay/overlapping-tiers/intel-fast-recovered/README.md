# Recovered and clean-rebuilt Intel fast-math source control

The former translated-process blockage has cleared. The existing x86_64
simulation-only fast-math executable runs509 corpus cases successfully. A clean
rebuild (`cmake --build /tmp/gel-fast-source-control/build --clean-first --target
gel-numerical -j4`) then reproduces its output byte-for-byte on two independent
captures. Source checking verifies all14 extracted files against Gelbox5f51097
and a clean Cinderf90f332 checkout. Retained flags identify x86_64, O3 and
-ffast-math on GelSim.cpp only; CMakeLists.txt, hashes and build output are retained.
The original release explicitly enabled GCC_FAST_MATH=YES, unlike the older
strict model reference. This source control uses newer Cinder and compiler;
it is not a replacement for native UI evidence by assertion.

Independent qualification:

- All nine original-GUI integer solver boundary saves match this model exactly.
- Three separately captured fractional-shape GUI drags save3001bp. The additional
  fractional-cases.json capture matches each one and repeats byte-for-byte.
- The unchanged nativeSolver, nativeNumerical, nativeLoupe and nativeMolecular
  test suites pass all1558 cases against output.json in an isolated diagnostic
  directory. No assertion, tolerance or product code was changed. These same four
  suites account for all52 remaining failures against the older strict capture.

The isolated test directory /tmp/gel-intel-fast-reference-check/ts contains copies
of those four test files and vitest.config.ts, links to the current product source
and dependencies, and a separate ../reference/native/numerical directory. Its
cases.json links to the canonical cases; outputs.json links to this capture.
The canonical files in the repository remain unchanged. comparison.log retains
the complete result. This diagnoses a reference-build discrepancy; it is not a
claim that the full main unit gate or final release acceptance already passes.

run.json records the original successful command. clean-capture.json records the
clean rebuilt executable, deterministic output and adapter/source provenance.
source-check.json records pinned source and Cinder verification. The retained
CMake build depends on the generated files from reference/native/numerical/build.py
at /private/tmp/gel-native-numerical and the repository's numerical driver.
A reusable release-profile capture path still needs to be integrated before
promoting these expectations into the canonical gate. Preserve the strict capture
as historical evidence. The uncommitted runtime candidate remains excluded from
the website pending reference reconciliation and final regression qualification.
