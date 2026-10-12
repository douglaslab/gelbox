# Fragment well composition review

Scope: FragmentWell now draws the native rounded shadow, fill, independent
one-physical-pixel stroke and representative on the same RGBA8 MSAA4 surface.
The shared presentation modules support ordered geometry underlays and an
alpha-only coverage pass. Covered RGB resolves once against the known opaque
panel background; untouched pixels remain transparent. Base revision: `d5b57e2`.

Native evidence: `reference/native/modern/fragment-well-scenes` retains 30
independent images from legacy Cinder rounded geometry and native particle
meshes, rendered with CGL. The capture verified twice independently after update.
The production component failed all 60 comparisons before implementation and
now matches every RGB channel on WebGPU/WebGL2 at DPR 1/2. Cases include no
representative, ordinary/degraded/multimer bodies, tiny fades and border crossing.

A contrasting-background regression checks both untouched transparency and
white coverage outside the well for a subquantum-fade particle. Forcing opaque
output left all native RGB comparisons green but made that regression fail in
all four tests. Restoring cutout passed. The native comparison is now in the
normal browser suite; obsolete assertions about CSS background properties were
removed from workflow tests. Actual color-edit rendering checks remain.

Independent reviewer `/root/review_fragment_composition` found no Critical or
Important issue in the active FragmentWell path. Static review covered underlay
order, tiny-fade coverage, cleanup/resize, and unchanged opaque defaults.

Deferred minor: combining `cutout:true` with the separate `wells` argument does
not mark those line strips in the alpha coverage pass. No current caller uses
that combination: the fragment preview supplies its stroke as an ordered mesh
layer and passes an empty `wells` array; gel callers retain opaque output. Any
future use of cutout with separate gel wells must extend coverage or constrain
the API first.

Limits: this does not certify the original GUI as a whole. Heading/brace/control
overlap, particles outside the panel canvas, native animation histories, other
platform rasterization, and release performance remain open. The old standalone
transparent representative audit is retained as historical evidence of why
separate RGBA8 composition was rejected; production FragmentWell no longer uses
that path. Final regression counts are recorded in STATUS after terminal results.
