# Water warp upload orientation

The native scene outputs remained byte-identical after adding intermediate
exports. Native runtime tuning is scale [5,10], amount 3.5, faintness .25;
blending is enabled, depth/scissor tests disabled. Manifest source and image
hashes identify this instrumented modern build.

The four water/combined scenes export the pre-warp composite (the previous
ping-pong target after the swap) and control texture. A web probe renders the
same bands with native faintness applied and the global warp disabled, then
builds the CPU control field separately. All four **pre-warp RGB images and
control fields match exactly**. `prewarp-probe.spec.ts` reproduces the web
exports when temporarily copied into `ts/tests/visual`; it writes temporary
artifacts under `/tmp/gel-native-lossless-probe` and is diagnostic only.

Cinder `Texture2d::setData(Surface)` calls `ip::flipVertical` before upload when
`mTopDown` is false (the default). `ImageSourceTexture` reverses rows back when
exporting. This explains why matching top-down exported control bytes did not
prove matching GPU texture orientation. The web CPU upload is top-down.

The corrected WebGL warp shader samples the control at (u,1-v), emulating the
native Surface upload. The WebGPU shader samples it at (u,v), because its source
render target already uses top-down coordinates; displacement Y still changes
sign relative to OpenGL. One-row controls are unaffected.

After correction all 16 native scenes match exactly on WebGL2. WebGPU matches
11; plain/blur/smile/damage/water at ppu 1 retain the independently identified
half-pixel primitive edge difference. Those failures remain explicit in
`../after-water-webgpu.json`, and are not absorbed by a tolerance. Water at ppu
2 and combined effects at both resolutions are now normal zero-tolerance
regressions on both backends. Full native UI parity remains unproven.

For native reproduction, use the parent scene probe but replace its GelRender
patch with `GelRender.cpp.patch`, apply `RasterProbe.h.patch`, create
`/tmp/gel-native-lossless-probe/water-debug`, rebuild and restart. This extra
instrumentation is absent from the original native checkout and the product.
