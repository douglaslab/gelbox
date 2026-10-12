# Shared native composition design

## Goal and evidence

Preserve native behavior and visual output in the web app, including overlapping
views. The user selected native parity before improvements and web before any
Rust/native work. This changes rendering ownership, not those goals.

At `d676ac5`, independent transparent canvases fail the intersecting-edge native
reference by up to 24/255 RGB. The shared-surface probe matches all 32 comparisons
exactly using existing production presentation APIs and both native/generated
meshes. See [proof](../../../reference/web/shared-composition-scenes/README.md).
The exact production audits remain failing; a probe is not integration.

## Decision

Use one opaque window presentation surface for native scene drawing, with an
ordered list of mesh and texture operations. Resolve RGBA8 MSAA4 once after the
complete list. Retain existing scientific offscreen gel textures: native itself
renders those offscreen before sampling them into the window. Do not flatten
whole sample/loupe/inspector views into resolved textures; their geometry must
retain samples across later views.

Alternatives rejected: white cutouts erase earlier content; transparent per-view
layers lose edge correlation; copying DOM screenshots every frame is unreliable
and cannot recover lost samples. A renderer/language rewrite is unnecessary:
the existing GPU and GL pipelines already match the tested shared reference.

## Native draw inventory

Authority: gelbox `5f5109705279085fcf6bcac6c8be1c9806b6d3d6`.
`ViewCollection::draw` in `src/View.cpp` applies each visible view's root transform,
calls draw, restores transform, then drawFrame. Children are inserted separately
in collection order; raising a view also raises children. No blanket view clip.

| View | Ordered graphics and clipping | Web ownership to migrate |
|---|---|---|
| Gel | Tubes; black rectangle; clipped gel texture or additive direct bands, wells and focus; dragged tube outside clip | GelCanvas/DirectBandCanvas, MicrotubeRow, GelOverlay |
| Sample/loupe | Loupe rings if applicable; ordinary header; callout; shadow; opaque dye/hover background; clipped particle mesh; focus/frame | SampleView, Loupe, SampleSimCanvas |
| Fragment | Brace; rounded shadow/fill/line stroke; representative without panel clipping; heading; later child controls | Stage brace, FragmentWell, FragmentView, control children |
| Images | Image texture in local coordinates; resize handle and focused frame in root coordinates | ReferenceImageLayer |
| Settings/buttons/sliders | Brace, labels, icon/fill/frame geometry and native disabled/hover state; child order | Inspector views and control primitives |

A global canvas beneath still-visible DOM controls is not the final solution:
a later image or overflowing molecule must be able to cover earlier controls.
React DOM continues to provide semantic elements, layout and input ownership,
but migrated visual content is drawn in the ordered presentation. Text becomes
an explicit cached texture operation, with native font/metrics/raster capture
required before that migration is accepted. Do not use generic DOM rasterization.

## Presentation contract

Extend the existing presentation APIs with ordered operations, retaining old
entry points as adapters until callers migrate. Operation variants:

- Mesh: interleaved existing Mesh, triangle-list/line-list/line-strip topology,
  source-over or source-alpha additive blend, local-to-root affine transform.
- Texture: existing backend texture/view, destination rectangle/transform,
  UV orientation and tint/opacity. Declare straight versus premultiplied source;
  native texture upload and browser decode behavior must be measured.
  The asset/operation contract also declares min/mag filtering, mip availability
  and selection, U/V addressing, and color-space interpretation. Own a matching
  sampler in WebGPU and set matching texture/sampler state in GL; do not inherit
  whatever a previous operation left bound. Native display-domain UNORM values
  must not acquire an implicit sRGB decode/encode. Establish each asset class's
  actual native upload/filter settings with scaled translucent-edge fixtures.
- Each operation has an optional physical window scissor. Absence resets to the
  full window. Derive native clipping from View's scissor conversion; preserve
  its integer conversion order rather than using CSS clipping or arbitrary rounding.

Clear the window once to white. Per-view backgrounds are ordered opaque geometry,
not clears. DrawFrame operations use root coordinates. Keep existing normalized
float32 resolve order, reflected GL raster/flip convention, and resource disposal.
Backend resources stay local to one context/device; GL textures from the old
per-view contexts cannot be imported into the shared context.

## App boundary

A presentation registry supplies draw contributions keyed to the existing
GelStore view order, including ordered child contributions. It owns no document,
selection, simulation or RNG. It reads the existing engines after each tick.

The current GelProvider wraps store.tick in flushSync; subscribeFrame listeners
run *inside* that callback, before the outer React commit finishes. Shared drawing
must happen after that commit so newly opened/closed panels and measured transforms
agree with the snapshot. Add an explicit post-commit presentation phase to the
existing frame driver; do not add another simulation tick or readiness-owned loop.
Local hover/focus changes must invalidate their contribution as well.

DOM hit regions retain native ordering, focus and pointer capture even when their
visual paint migrates. Reusing a canvas does not authorize replacing gestures,
changing selection rules or moving view state into the GPU layer.

The surface is bounded by the visible viewport/DPR, including scrolling offsets;
large molecules do not expand backing allocation beyond the window. Visibility,
resize, mount/unmount, asset completion and context/device recovery rebuild
presentation resources without restarting engines or consuming random draws.

## Acceptance and migration limits

Keep migration behind an internal development switch until complete overlapping
view/control order works; do not expose renderer internals in product controls.
Normal production remains usable during migration. Remove the switch and retired
per-view drawing only after integrated acceptance.

Require exact existing shared-edge and solid references, source-backed textured
and clipped overlap references, actual sample/loupe/image/inspector interactions,
unchanged document/selection/RNG behavior, bounded recovery and resource checks,
and full unit/browser/build/root-subpath validation. GPU readiness must not tick
engines. No native reference is changed to fit web output.

This design does not close full original GUI/fonts/assets certification, remaining
interaction workflows, other browsers or combined-app performance. Those remain
in ROADMAP. Shared composition is a necessary rendering correction, not a claim
that replacing the canvas boundary finishes the whole app.
