# Intersecting multisample edges

Eight standalone CGL captures: empty well, large crossing molecule, large round
molecule, and underlay alone, at DPR 1/2. The underlay is an opaque rose triangle
with vertices (0,0), (303,0), (303,303) over navy. The inspector uses the same
native body meshes and legacy Cinder well geometry as the solid-background
reference. All primitives share the native RGBA8 MSAA4 framebuffer.

```sh
python3 reference/native/modern/fragment-edge-scenes/capture.py
```

Capture is repeated twice and freshly verified against retained images. This is
a deliberately constructed render-boundary probe, not a captured user workflow
or original native GUI certification. Its purpose is to test whether resolving
an earlier scene separately loses sample correlation at intersecting edges.

The browser audit places the native resolved underlay PNG at exactly matching
physical pixels behind the production FragmentWell, representing an earlier
opaque canvas. The earlier scene is therefore supplied without browser geometry
or raster differences; only its already-resolved pixels cross the layer boundary.
The reference instead preserves the earlier scene's individual samples through
inspector drawing. This models the boundary between overlapping canvas views.

```sh
npm --prefix ts run test:visual -- -c playwright.fragment-edge-audit.config.ts --workers=2
```

The zero-difference audit currently fails: maximum RGB difference 24/255 on
empty/crossing scenes, 9/255 for round DPR1 and 8/255 for round DPR2. The two
backends agree. Even an empty well has 9/12 differing channels at DPR1/2.
See [web reports](../../../web/fragment-edge-scenes/README.md). This falsifies a
general claim that separate canvases only introduce imperceptible 1–2 level
rounding. Matching shared sample composition is an open architectural requirement.
