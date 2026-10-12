# PNG sample-format corpus

44 independent hand-encoded 7×3 PNG fixtures cover grayscale 1/2/4/8/16-bit, palette 1/2/4/8-bit with transparency, gray-alpha/RGB/RGBA 8/16-bit, grayscale/RGB transparency keys and both ordinary/Adam7 scan ordering. Python zlib only encodes scanline streams. Original RGB under zero alpha is deliberately nonzero. The native Cinder Quartz driver supplies RGBA references; native.json records acceptance and hashes.

Reproduce from the repository root:

```sh
python3 reference/native/image-decoding/png-formats/generate.py --decoder /path/to/gel-image-decoder
```

The decoder is built with the parent corpus capture.py. Its source and binary hashes are in the linked [fix evidence](../../../web/image-decoding/straight-alpha/manifest.json). These are source-backed native codec samples, not original-release GUI screenshots. 16-bit output is compared after native Surface8u conversion.
