# Staged Release-profile responsiveness

The unchanged M5 Max/macOS27.0.1 budget passes both Chromium backends against
the exact223-asset bundle staged at website03d8cf9, runtime812ff8a. The report
records repository HEAD7e02ad3 (subsequent evidence-only commits); its tracked
TypeScript source is unchanged from812ff8a and every compiled asset matches
the staged release manifest.

Command from ts with Node22:
GEL_PERF_BUDGET=m5-max npx playwright test -c playwright.performance.config.ts application.spec.ts --output=/tmp/gel-release-profile-performance

Both tests pass the existing thresholds: steady/gesture p95≤26ms,p99≤34ms;
steady callback p95≤4ms; no tracked resource growth. The workload remains
50bands, a populated sample and three populated persistent loupes, two10-second
steady windows after3seconds warmup, followed by60 timeline pointer moves.
Raw reports, budget objects and workload screenshots are retained.

The separate two-hour memory run was active during this measurement; no result
was discarded or threshold changed. These frame/callback and owned-resource
results are not GPU timestamp, input-to-photon or long-term memory guarantees.
No product code changed. Native/platform acceptance remains open.
