# Shared-surface composition proof

The diagnostic prototype uses the existing production presentation APIs to draw
an earlier triangle, native well layers, and the representative together on one
opaque RGBA8 MSAA4 surface. It changes no production code or app wiring.

All **32 comparisons match native RGB exactly**: four reference scenes (including
underlay alone), DPR1/2, both backends, and native-captured/generated body meshes.
The same composed references differed by up to 24/255 through separate browser
layers. This establishes that the existing mesh renderers can preserve sample
correlation; it does not certify an integrated shared app compositor.

```sh
npm --prefix ts run test:visual -- -c playwright.shared-composition-audit.config.ts --workers=2
```

This retained test is a reproducible architectural probe, not shipped rendering
or normal-suite acceptance. No native image or tolerance was changed. Reports
and source hashes are retained here; the independent native manifest is
[fragment-edge-scenes](../../native/modern/fragment-edge-scenes/manifest.json).
The per-backend test asserts that the intended context was actually acquired.

Textures, mixed blend modes, transforms, per-draw clipping, native control/text
raster, actual shared view registration, animation and recovery remain outside
this proof. The production separate-layer audits still fail; this passing probe
does not replace them. See the shared-composition design and implementation plan.

Review found no Critical/Important issue blocking the ordered presentation API.
Its two minor findings were addressed: assert all four scene IDs and eight
results per backend/DPR; specify sampler/filter/mip/address/color-space ownership
in the design. The final proof rerun passed four tests / 32 exact comparisons
(`/tmp/gel-shared-composition-proof-final.log`). Production code and native
references are unchanged, so this increment does not claim a new full-app
regression run. The prior production verification remains recorded separately.
