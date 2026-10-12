# Fragment background compositing measurements

Baseline: `4115939` (white coverage cutout). Candidate: real premultiplied
transparent RGBA8 MSAA4 composition. Both use the same native well geometry and
native body meshes. The native reference is
[90 standalone CGL captures](../../native/modern/fragment-background-scenes/README.md).

| Renderer | Comparisons | Exact mismatches | Maximum RGB-channel error |
|---|---:|---:|---:|
| White cutout | 180 | 120 | 229/255 |
| Transparent prototype | 180 | 180 | 2/255 |
| Final implementation | 180 | 180 | 2/255 |

The white cutout was exact on white and visibly wrong on other underlays.
Transparent output preserves earlier content. Separate premultiplied RGBA8
composition introduces quantization absent from the shared native framebuffer.
Across the prototype matrix, 212,452,414 channels were exact, 253,138 differed
by one and 448 by two. Differences of two occur only in large-round/white
scenes, around well edges. This finite measurement is not a universal bound.

Example (DPR1 WebGPU, large round molecule over navy):

| Native | Before | After |
|---|---|---|
| ![Native](../../native/modern/fragment-background-scenes/large-round-1-navy.png) | ![White cutout](before-large-round-navy.png) | ![Transparent](final-large-round-navy.png) |

`before`, `transparent`, and `final` retain per-backend/DPR comparison reports.
`prototype.patch` records the diagnostic experiment, not a patch to apply over
current production. `final/source-hashes.json` identifies the tested sources.
`summary.json` pins the baseline and reference inputs.

Normal regressions bound error at 2/255, preserve real brace visibility at half
fade, and require a subquantum-fade particle to leave the background visible.
The dedicated exact audit still fails its zero-difference assertion. **Native
pixel parity and acceptance of the residual difference remain open.** This does
not certify other browsers, original-release GUI raster, images, fonts, animation,
or combined application performance. No native reference was changed to fit web
output; the white native references are byte-identical to the older capture.

The subsequent [intersecting-edge audit](../fragment-edge-scenes/README.md)
measures up to 24/255 error. The 2/255 result above applies only to the solid
background cases; it is not the maximum error of arbitrary overlapping views.
