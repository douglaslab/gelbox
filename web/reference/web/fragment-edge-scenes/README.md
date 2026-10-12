# Intersecting-edge audit

The [independent native reference](../../native/modern/fragment-edge-scenes/README.md)
draws opaque diagonal scene geometry and the fragment inspector on one RGBA8
MSAA4 surface. The production browser inspector instead overlays the exact
resolved native underlay image. It therefore exercises the loss of individual
sample correlation at the browser layer boundary, without reimplementing the
underlay's geometry in the browser.

All 12 comparisons fail exact matching. Both backends give the same maxima:

| Scene | DPR1 max RGB error | DPR2 max RGB error |
|---|---:|---:|
| Empty well | 24 | 24 |
| Large crossing molecule | 24 | 24 |
| Large round molecule | 9 | 8 |

Per-scene counts and absolute errors are retained beside this README. The solid
background audit's 2/255 bound cannot be generalized to overlapping view edges.
The transparent renderer remains an improvement over the white cutout, but
strict native composition still requires a shared sample surface or another
solution that preserves the same sample correlation. No acceptance threshold
was raised to hide these failures. This diagnostic audit remains outside the
normal regression suite and must be included in the completion ledger.

`source-hashes.json` identifies tested production sources. Native input hashes
and repeatability are in the linked manifest. These are controlled standalone
render probes, not certification of original native GUI behavior or all browsers.
