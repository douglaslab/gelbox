# Native image decoding corpus

The original sixteen 32×24 canonical fixtures: opaque/alpha PNG, PNG gamma=1.0, sRGB-profile PNG/JPEG, JPEG EXIF orientation values 1–8, PNG EXIF orientation 6, untagged JPEG, and a two-frame GIF whose second frame is magenta. `generate.py` uses Pillow to encode test inputs, with a fixed ICC creation timestamp. No reference screenshot is synthesized or edited.

`driver.cpp` invokes the Cinder loader used by GelboxApp.cpp's image import, then writes row-major RGBA8. It explicitly registers Quartz as PlatformCocoa does; the initial standalone driver omitted registration and returned no decoder. The corrected driver guards that condition. No GL rendering or original-release GUI replay is claimed.

Reproduce with:

```sh
python3 generate.py
python3 capture.py --cinder /path/to/Cinder --build-dir /tmp/gel-image-decoder
```

Run from this directory. Cinder must already have a Release library. `provenance.json` records revision/macOS/architecture. `native.json` records dimensions, actual decoder type and input/output hashes. RGBA data is in `decoded/`.

Native returns stored 32×24 pixels for all orientation values and the first GIF frame. The relevant Cinder source comparison is retained: the Quartz loader differs only in an error-message typo/newline; ImageSourceCgImage constructor/load code has no changes between the original reference and current Cinder commits. Other platform initialization changes are visible in the diff. This supports the codec path comparison on this OS; it does not certify the original binary's complete image rendering, other OS codecs, wide-gamut/CMYK or arbitrary formats.

Five additional fixtures cover Display P3 and Adobe RGB tagged pixels, including Display P3 alpha. Run `python3 generate-wide-gamut.py` on macOS before capture.py to regenerate them; `wide-gamut-inputs.json` records profile/input hashes. The corpus now contains 21 accepted fixtures. [Cross-engine comparison](../../web/image-decoding/wide-gamut/README.md) retains measured results and limitations. CMYK rejection is captured separately in [color-models](color-models/README.md).
