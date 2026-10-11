# Clean-source provenance of the modern Cinder reference library

The recorded library `b41dbbb9992d295c007824264960099be590e31f4eac8105711be25eaa3e8793`
was compared with a clean rebuild of Cinder commit
`f90f332d1a4d453282c76435f3401271f25922f9` on2026-10-11. The source was extracted
with `git archive`; no working-tree files or prebuilt library were copied into
that source tree. Both x86_64 and arm64 slices were built with CMake Release,
Apple clang21 and the recorded SDK. The sibling Cinder checkout was unchanged.

The initial build had227/286 identical archive members in each slice. Inspection
of differing object strings showed the temporary source directory embedded in
place of `/Users/shawn/code/Cinder`. Reconfiguring the same isolated build with
`-ffile-prefix-map=/tmp/gel-cinder-provenance-20261011/source=/Users/shawn/code/Cinder`
for both C and C++ caused all286/286 member payloads in both slices to match,
including symbol tables and all285 object members. Duplicate object basenames
are compared by ordered index, not silently collapsed into a name dictionary.

The rebuilt universal library SHA-256 is
`26d000ff5b2d703f62576e272f725192e337ec380cded016ff087a5ca10a541b`.
Its4534 differing bytes are confined to1142 archive header timestamp/group-ID
fields. Every member payload is byte-identical; this is not a tolerance or a
semantic-code comparison. Retained reports include all member hashes and the
metadata differences. Raw library files are not committed.

## Reproduction

From the web repository root:

```sh
python3 reference/native/modern/cinder-provenance/rebuild.py \
  --repository /Users/shawn/code/Cinder \
  --output /tmp/gel-cinder-provenance-fresh \
  --map-source-path
python3 reference/native/modern/cinder-provenance/compare.py \
  /Users/shawn/code/Cinder/lib/macosx/Release/libcinder.a \
  /tmp/gel-cinder-provenance-fresh/source/lib/macosx/Release/libcinder.a \
  --output /tmp/gel-cinder-provenance-fresh/comparison.json
```

Use a nonexistent output directory. The recipe was distilled from the retained
successful configure/build commands; both Python scripts compile, and the
comparison script ran against both actual builds. The build wrapper itself was
not invoked for a third redundant build. Compiler/SDK changes can change output;
use `environment.json` to identify the observed toolchain.

## Scope

This closes the prebuilt modern Cinder library/source correspondence qualification
for the recorded toolchain and reference library. The original Cocoa Gelbox
release binary is a separate authority. This result does not prove its source
correspondence, remove modern compatibility adapters, or establish original/
modern geometry and raster equivalence. Existing original-release GUI evidence
and scenario-specific authority choices still apply. The older modern-app
rebuild script still requires the original raw library hash; it is unchanged.
