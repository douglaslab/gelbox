# JPEG color-model acceptance boundary

The current Cinder Quartz decoder rejects both baseline and progressive CMYK JPEG fixtures with `Core Graphics unexpected data type` (exit 1), and accepts the 32×24 grayscale JPEG. native-results.json retains results and fixture/output hashes; provenance.json identifies the decoder. The parent Cinder source comparison shows the relevant color-model handling unchanged from the original reference. This is source-backed codec evidence on this OS, not an original-release GUI replay.

Reproduce from the repository root:

```sh
python3 reference/native/image-decoding/color-models/generate.py
python3 reference/native/image-decoding/color-models/capture.py --decoder /path/to/gel-image-decoder
```

The web decoder now rejects four-component JPEG frames before browser decoding, with an actionable RGB-conversion message. Header parsing stops before scan data and bounds-checks segments. RGB/grayscale behavior and ICC bytes are preserved. The compiled regression drops baseline CMYK, progressive CMYK renamed .png, then a valid grayscale image; it checks both errors, continued batch processing, retention of an existing image and unchanged saved gel data.

The regression failed on both graphics backends before the fix. Thirteen new parser cases failed before implementation; all 41 decoder unit cases then passed. Independent read-only review found no critical, important or minor issues. Full validation: 2,999 unit tests, 46 compiled production checks and 16 Firefox/WebKit compatibility checks passed; logs are retained alongside this evidence. Wide-gamut rendering, arbitrary four-component encodings, decoder recovery from malformed JPEGs and grayscale pixel fidelity are not certified by these acceptance tests. W06 and D06 remain open.
