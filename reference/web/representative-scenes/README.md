# Representative compositing audit

The baseline at `8d577da` uses a single-sample transparent representative canvas.
The dedicated component audit controls a static native snapshot and draws the
real representative component over native gray/white CSS backgrounds. It checks
the acquired backend passively and compares every RGB channel with native CGL.

```sh
PATH=/opt/homebrew/opt/node@22/bin:$PATH npm --prefix ts run test:visual -- \
  -c playwright.representative-audit.config.ts --workers=2 \
  --output=/tmp/gel-representative-audit
```

**All four tests currently fail exact parity.** Each completes its 18 image
comparisons before asserting. Across both backends and scales, 16/18 scenes
mismatch, with maximum channel error 102. All 72 measurements are retained in
`before-*` reports.

An experimental premultiplied RGBA8 MSAA4 layer reduced maximum error to **1**,
but still mismatched 16/18 cases on each backend/scale. These are retained in
`msaa-*`. The experiment averaged all four color/alpha samples, then allowed the
browser to composite the resulting transparent layer. Quantization at that
boundary differs from native drawing directly onto the opaque underlay.

The residual also occurs inside fully covered triangles, not just at edges.
`interior-pixels.json` records examples: at fade .65 over gray, native
RGB (118,151,184) becomes (117,150,183) through the prototype layer.

The prototype was reverted. `transparent-msaa-prototype.patch` retains its exact
production diff against `8d577da` for reproduction in an isolated checkout; it is
not shipped code. It is intentionally a measurement prototype, including an
unused old transparent batch, not a proposed final implementation. The current
production source is unchanged by this audit.

## Implementation direction

Render the native well underlay and representative together on one native-style
MSAA surface. Resolve their RGB once. Keep untouched pixels transparent, but
emit already-composited affected pixels opaquely, avoiding a second RGBA8 alpha
blend in the browser. This requires a known native underlay, which the fragment
view supplies; it is not a general-purpose transparent-layer replacement.

Before integration, capture native rounded well fill, stroke, shadow and large
particles crossing their boundaries. Verify the coverage mask's edge pixels
and empty/near-zero-fade cases against those captures. Preserve native order
(well, representative, heading/child controls), including overflow behavior,
rather than painting an opaque rectangle over other controls. Full panel overlap
and original-release GUI certification remain separate open requirements.
