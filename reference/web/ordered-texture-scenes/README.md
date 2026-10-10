# Ordered texture presentation results

All 20 native RGB comparisons match exactly on WebGPU/WebGL2 at DPR1/2.
The test exercises the production presentation API's ordered scene input with
borrowed textures, packed quad vertices, straight/premultiplied alpha, tint,
UV reversal, clipping, mip/filter changes, repeat addressing and mixed draw order.

```sh
npm --prefix ts run test:visual -- ordered-texture.spec.ts ordered-texture-lifecycle.spec.ts --workers=2
```

Before implementation all four texture tests failed because ordered scene input
was unsupported. During validation the old factory's additive mesh default was
found unsuitable for new native-window scenes; four failing comparisons led to
explicit source-over defaults for ordered scenes. The legacy direct-scene
factory default remains unchanged. `wrong-default` retains those failed matrices;
`final` retains the exact results. No native reference or tolerance was changed.

Two lifecycle tests exercise real resource ownership: success, sampler-allocation
failure during drawing, then success with the same borrowed image. Owned buffers,
textures and GL draw objects retire to zero; caller images remain usable, and
repeated destroy is safe. GPU counts cover explicitly destroyable owned buffers
and textures, not driver-resident memory or garbage collection of shader objects.
The first fault-injection setup mistakenly hit the old base sampler in the
constructor; moving injection after construction tests the intended new path.

The [native reference](../../native/modern/ordered-texture-scenes/README.md) is
standalone CGL evidence. Diagnostic mip chains are explicit inputs. Texture
upload/decoding and mip generation belong to the caller and still need native
asset evidence. Production view migration, original GUI/text raster and platform
acceptance remain open; this passing API test does not replace the failing
production separate-canvas composition audits.

The first full regression run found that the effects-cancellation test also
counted the replacement direct renderer's presentation texture. Holding both
imports reproduced the false positive; the allocation stack named
`DirectBandCanvas`. The test now distinguishes effects resources from the
replacement presentation and exercises both import timings. Removing the
production cancellation guards deliberately made all four cases fail; restoring
them passed all twelve repeated focused cases. No production lifecycle change
was needed.
