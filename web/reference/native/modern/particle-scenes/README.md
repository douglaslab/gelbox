# Native particle raster reference

128 images cover the 64 independently captured native particle meshes at DPR1
and DPR2. Cases include degradation slices, narrow/tiny remnants, elongated
multimers, rotation, selection, rollover and combined highlighting. The meshes
come from the pinned Cinder/native extraction under `../../numerical`.

`capture.py` checks the retained mesh and executable hashes, reruns the mesh
executable twice, and requires exact output agreement. It compiles `driver.cpp`
and captures each image twice with native macOS CGL, requiring identical raw
pixels. A second verification invocation checks the retained PNGs. This does not
use TypeScript output to construct the native reference.

The native application requests MSAA4. Cinder's default blend is straight-alpha
source-over. The driver uses those settings with RGBA8 and the native opaque
#F1F1F2 molecular background, cropped to native coordinates [68,132] on each
axis. Positive-Y projection and readback row order follow the independently
window-validated well reference. The manifest pins application/Cinder revisions,
source/mesh/driver/executable hashes, renderer and image hashes.

Run from the repository root:

```sh
python3 reference/native/modern/particle-scenes/capture.py
```

The default mesh build is `/tmp/gel-native-numerical`; use `--mesh-build` for a
build created elsewhere by `reference/native/numerical/build.py`. `--update` is
for deliberate native recapture only. It does not authorize replacing browser
expectations with web output.

This is a standalone native raster reference, not a full original-release GUI
capture. It verifies opaque RGB output for a fixed particle snapshot. Scheduling,
transparent representative compositing, loupe framing and composed UI remain
separate acceptance requirements.
