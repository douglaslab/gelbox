# Ordered mesh presentation comparisons

The production presentation APIs now support per-layer affine transforms,
source-over/additive blend selection, physical scissoring and line strips.
The legacy gel/particle entry points remain in use. New native fixtures verify
state transitions instead of only isolated operations.

The four original fixture scenes failed all four backend/DPR tests before the
change (three scenes differed; the empty scene already matched). Initial corrected
runs match all 16 comparisons exactly. A fifth fixture checks resetting clipping
before legacy well lines; the final 20 comparisons all match exact native RGB.

```sh
npm --prefix ts run test:visual -- ordered-mesh.spec.ts --workers=2
```

`before` and `initial-after` retain those original four-scene matrices. `final`
contains the five-scene matrix from the full regression run.
The [native reference](../../native/modern/ordered-mesh-scenes/README.md) was
independently captured twice and freshly verified. No tolerance is used.

This is the mesh portion of shared-composition Task 1. Ordered textures, app view
migration, original GUI certification and full roadmap gates remain unfinished.
The production independent-canvas edge audit still fails; this new API does not
yet change how views are combined in the app.
