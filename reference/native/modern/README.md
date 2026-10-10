# Modern native compatibility reference

This is an isolated rebuild of the sibling Gelbox compatibility work, based on `5f51097`. The source snapshot contains modern Cinder adaptations already present in that checkout; this task did not modify the sibling. `manifest.json` hashes every build input, asset, the captured executable and Cinder library. `compatibility.patch` and `additions/` reconstruct that snapshot from Git objects, without depending on current sibling edits. Reconstruction and compilation were verified in a second fresh directory.

## Reproduce

Requires macOS, Xcode C++ tools, CMake, a Gelbox repository containing the recorded base commit, and **a clean Cinder checkout at the recorded revision with its Release library already built**. The existing `lib/macosx/Release/libcinder.a` must match the manifest hash; the script refuses another library. This recipe does not build Cinder from a clean checkout, and correspondence between that prebuilt library and its source revision is not independently established. Build output paths/compiler metadata may change executable bytes; only source/asset reconstruction is asserted byte-for-byte.

```sh
python3 reference/native/modern/rebuild.py \
  --gelbox /absolute/path/gelbox --cinder /absolute/path/Cinder \
  --build /tmp/a-new-gelbox-reference
```

Use a new output directory. The script never replaces existing data. The source includes replacement convex polygon clipping, convex hull and JSON compatibility code. Those changes can affect geometry/serialization; this build is not equivalent to the original binary by assertion.

## Capture and input limits

`captures/startup.png` is the uninstrumented isolated build, at 1365×768 logical client pixels and 2× display scale. Its macOS title bar is 64 physical pixels. It is an exploratory reference, not a pixel-certified golden.

The modern Cinder GLFW input backend queries `glfwGetCursorPos` during mouse-button callbacks. In a temporary diagnostic build, CUA clicks requested at screenshot locations `(472,265)` and `(473,780)` both reached the app at logical `(339,483)`. Keyboard commands worked. The logging instrumentation was removed, the recorded input hashes reverified, and the clean source rebuilt. Do not treat a background CUA click on this build as proof that the visible control was activated.

The [original-release replay](../replay/manifest.json) uses the older Cocoa backend and successfully exercises sample/band selection. It remains the interactive visual reference. Its binary-to-source equivalence and stochastic rendering limits remain explicit.
