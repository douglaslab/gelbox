# Shared reference images

Twenty displayed RGB comparisons match the independent native ImageView captures
exactly: five scenes at DPR 1 and 2 on WebGPU and WebGL2. They cover transparent
pixels, focused resize/frame paint, another layer covering the image, magnification,
minification, fractional placement and an odd-sized source image.

The base texture and every mip level also match actual Cinder Texture2d RGBA bytes:
28 comparisons across both backends, including RGB hidden beneath zero alpha.
Native bottom-up readback is flipped for comparison with browser top-down pixels.
Changing decode to premultiplied alpha makes both mip tests fail.

The production ReferenceImageLayer retains DOM input and focus while shared mode
uploads each bitmap into the scene's borrowed backend context. Tests cover deletion
during module loading, decoding after route exit, repeated backend loss, upload
failure after allocation, retry with the retained bitmap and disposal to zero owned
textures. The existing image interaction suite runs in both rendering modes.

Reproduce from `ts`:

```sh
npm run test:visual -- shared-image-native.spec.ts shared-image-mips.spec.ts shared-image.spec.ts reference-images.spec.ts
```

Use a fresh Vite server: isolated fixtures dynamically import modules by canonical URLs, and
an existing HMR session can retain a second React context module with a timestamp.

These fixtures certify the two included 8-bit PNG assets and the tested native
ImageView methods. They do not establish general codec/profile/16-bit equivalence,
original-release full GUI parity or completion of the shared rendering migration.

Final regression: 2,917 unit tests, 629 browser tests (one intentional skip),
four production tests and the production build pass. Ten native scenes were
independently recaptured twice and reverified. The full fresh-server run reproduced
all retained image scene and mip comparisons without changing any threshold.
