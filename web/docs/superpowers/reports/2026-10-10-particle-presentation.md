# Opaque particle presentation review

Scope: shared native MSAA presentation gains source-over mesh blending and an
opaque background; SampleSimCanvas integrates it for sample/loupe views.
Transparent representatives retain the prior renderer pending independent
compositing evidence. Base revision: `becaf87`.

Independent reviewer: `/root/review_particle_presentation`, read-only review of
the working diff. No Critical or Important production findings. Resize recreation,
initialization/frame failure cleanup, default gel blending/background, and the
transparent representative branch were reviewed. Approval is limited to this
opaque presentation change, not complete native application parity.

Minor finding resolved: the component test initially queried `getContext()` to
identify the backend, which could acquire a context before production code and
change its options. It now passively observes production context acquisitions
and asserts the recorded backend before and after reference comparisons.

Evidence: the independent native reference is unchanged. All 512 low-level
native/generated-mesh comparisons have zero differing RGB channels. Four
component tests exercise selected, hovered, degraded multimer and narrow-remnant
snapshots at two display scales across both backends. These controlled snapshots
verify rendering integration, not application RNG/scheduling or composed GUI.
The prior integrated suite passed 501 cases, with only two obsolete degraded
snapshots failing. Those diffs were inspected and the two baselines regenerated
without changing tolerance. Final full-suite results are recorded in STATUS.
