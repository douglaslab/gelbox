# Particle raster audit: current mismatch

The implementation at `b024d9a` renders particles on single-sample surfaces.
The native reference uses four samples. `summary.json` and the four `before-*`
reports retain the measured differences; two example web images are included.

For **each backend and each DPR**, 57/64 cases differ from native CGL output.
The maximum RGB channel difference is 157. Native and TypeScript-generated
meshes produce exactly identical browser pixels for all cases; WebGPU and
WebGL2 also produce exactly identical pixels to one another. Thus these cases
expose a renderer mismatch independent of mesh generation. This does not prove
that all possible particle geometry is equivalent.

Run the dedicated acceptance audit from the repository root:

```sh
PATH=/opt/homebrew/opt/node@22/bin:$PATH npm --prefix ts run test:visual -- \
  -c playwright.particle-audit.config.ts --workers=2 --output=/tmp/gel-particle-audit
```

**All four tests currently fail the final exact-pixel assertion.** Every case
finishes measurement first, writing native-mesh and web-mesh screenshots and
`comparison.json`. This dedicated configuration is outside the normal browser
suite so its known failure is explicit rather than disguised by a tolerance or
updated golden. The next implementation must make this acceptance audit pass
and verify the actual sample/loupe/representative integration before claiming
particle-rendering parity.

Next steps:

1. Implement native four-sample source-over particle rendering and native resolve
   arithmetic in both backends. Use captured native meshes to isolate this path.
2. Compare generated meshes through the same renderer, preserving the strict
   reference assertion and recording any residual errors.
3. Integrate it into the shared molecular canvas; verify opaque sample/loupe
   backgrounds and separately establish transparent representative compositing.
4. Verify actual component rendering, resource disposal, fallback/retry, and
   display-scale changes. Complete native composed GUI comparisons separately.

The reference is a modern native CGL capture, not an original-release GUI image.
See the native manifest and README for projection, blending and source scope.
