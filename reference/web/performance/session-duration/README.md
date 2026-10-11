# Two-hour session memory acceptance candidate

Duration is a working assumption while Shawn's two-hour versus all-day preference
is pending. This is a finite candidate for the initial macOS release, not a claim
of all-day stability or support on untested hardware. The limits are stated before
the long run. They must not be enlarged retrospectively to turn a failure green.

Run120 cycles per backend, keeping a populated sample and two persistent loupes
animating for60 seconds per cycle, then close them and reopen for the next cycle.
Each cycle also resizes the shared surface out and back. This tests elapsed-time
retention during normal animation, unlike the earlier six-minute accelerated
churn. Both backends run in separate browser processes concurrently; these are
memory measurements, not isolated performance/latency benchmarks. The source is
`26b4eb0` as packaged in the current dist. The diagnostic uses the previously
recorded Chromium153/Playwright1.64/Metal setup with network inspection disabled.

Candidate limits in budget.json: lifetime physical footprint peak≤256MiB for
the renderer and≤1GiB for its GPU process; closed-view physical-footprint growth
from cycle10 through cycles60/120≤64MiB per process; retained forced-GC JS heap
growth≤1MiB, no DOM/document/listener growth and no explicit GPU resource growth.
Route exit must release every tracked GPU object. All measurements must exist;
missing reports are failures, not zero. The1MiB heap allowance accounts for
measurement/report bookkeeping and jitter; DOM/resources get no growth allowance.

The physical peak ceilings provide roughly1.6× headroom over the prior measured
148.7MiB renderer and640.3MiB GPU lifetime peaks. The64MiB retained-footprint
allowance exceeds prior short-run cache movement while limiting unexplained
retention over the finite session. These are practical initial-release budgets,
not proof of leak freedom. PartitionAlloc inspection remains incomplete; RSS,
footprint and explicit resource counts are reported separately.

A ten-cycle100ms-hold smoke test passes on both backends. It validates the new
pacing and sampler operation; it does not satisfy the two-hour budget. Long-run
status and results will be added after the actual run completes. No user-visible
runtime change or website refresh is part of this diagnostic.
