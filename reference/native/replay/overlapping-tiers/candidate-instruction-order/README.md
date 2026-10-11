# Candidate with original geometry instruction ordering

This retains the uncommitted runtime patch after reciprocal normalization and
pre-translation well-height inflation were added to the earlier candidate.
The nine diagnostic rectangle tests failed before the changes and pass afterward;
the original-GUI overlapping-trimer unit also passes. Build passes.

All 20 paired overlap workflow cases pass across Chromium WebGPU/WebGL2 and
Firefox/WebKit WebGL2. Chromium uses the repository Playwright installation;
Firefox/WebKit use the isolated 1.64 runner. The initial mixed runner could not
launch its uninstalled Chromium revision; that setup failure is retained.

The full unit suite passes 3,012 and fails 52: 43 solver cases, seven numerical
cases, one loupe case and one molecular case against the existing source-model
corpus. These failures are unresolved, not waived. No canonical fixtures or visual
snapshots were changed. The previous candidate's full browser/visual results do
not qualify this changed candidate. Non-unit regressions beyond the overlap
workflow have not yet been rerun.

The earlier candidate directory is historical evidence for its own patch hash.
The website and independent two-hour stability build still use runtime 4ba0139.
Do not promote this patch or claim complete parity from these narrow checks.
Remaining work includes original-release arithmetic qualification (including
non-unit aspect ratios and dye paths), resolving all discrete reference failures,
then full candidate regression and the remaining parity ledger items.
