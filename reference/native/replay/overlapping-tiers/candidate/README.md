# Local correction candidate — not qualified for release

The candidate changes Rectf well construction and DNA band displacement scale
ordering to match the original source/binary operations. Strict minimum-height
picking is unchanged. The original failing unit selects tier2; the candidate
selects tier3 and solves922bp at all three overlap positions.

The eight-combination arithmetic control shows that source-float32 well endpoints
and scale-before-curve evaluation are both needed to reproduce tier3 here.
Changing inflation order is not required. The scale operation is independently
visible in the retained original executable disassembly.

Build passes. All20 compiled paired browser cases pass (five traces × four
configurations). Current targeted unit run has1514 passes and25 failures:
19 solver cases and6 integer seed cases against the old no-fast-math corpus.
That gate is still failing; these failures have not been waived or normalized.
The new simulation-only fast-math corpus matches2900/2909 solver requests;
solver-comparison.json retains all9 remaining differences. Modern fast-math
agreement alone is not sufficient to replace original-release authority.

The runtime changes and new unit test remain uncommitted in the worktree; a
copy of the patch and test is retained here. The main ts/dist was rebuilt for
this candidate. The memory run's separate /tmp/gel-modifier-compiled-bdc7fbd/ts/dist
and the locally staged website were not changed. Do not publish this candidate
or mark W04 complete until numerical/reference differences and the appropriate
regression gates are resolved.

A temporary additional mobility rewrite using the original disassembly's
reciprocal/aspect ordering increased disagreement with the modern fast-math
solver corpus to36 targets. It was removed from this candidate; that experiment
shows that global equivalence between the original and modern fast-math builds
is still unproven. It is not evidence to change an expected result or choose
an algorithm solely by its pass count. Further corrections must be justified
against original-release behavior at the affected boundaries.

## Broader candidate checks

The retained runtime patch still exactly matches the three modified runtime
files. Full unit run:3030 pass,25 fail (same19 old-reference solver cases and6
old-reference integer-seed cases; no additional unit failures). Full compiled
Chromium gate:96 pass. Full Firefox/WebKit compatibility gate:76 pass. These
results do not waive the numerical gate. Logs are retained here.

The full visual suite was started against a fresh Vite server from the candidate
worktree, four workers, exec session14194, output /tmp/gel-overlap-candidate-visual,
log /tmp/gel-overlap-candidate-visual.log. Result is pending at this checkpoint.
The two-hour fixed4ba0139 run remains active under session97497; latest logged
checkpoint is40/120 on both renderers. Neither build was restaged to the website.

The visual run completed successfully:969 passed,1 existing skipped case,
exit0. visual-full.log and qualification.json retain the final candidate counts.
No screenshots were updated. All223 assets in the separate live stability build
were rehashed and still exactly match its frozen manifest. This closes the
candidate's current browser regression run, not the outstanding numerical or
native/platform acceptance work. Runtime source remains uncommitted.
