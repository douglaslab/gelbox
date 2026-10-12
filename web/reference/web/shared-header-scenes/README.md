# Shared sample header

Eight exact native RGB comparisons cover integer and fractional panel placement
at DPR1/2 on WebGPU and WebGL2. The actual SampleHeader component contributes the
circle, tube icon and native Avenir Heavy text before the sample body. Native
capture source, texture metrics and limits are in
`reference/native/modern/shared-header-scenes`.

Text pixels are shipped unchanged from native straight-alpha texture readback.
The shared asset cache distinguishes single-level text textures from mipmapped
UI images. Tests check shipped bytes, GPU mip-level counts / GL mip generation,
and exact composed pixels. Existing image/cache ownership, loss and retry tests
pass. The initial CSS header failed all four native tests before implementation.

The real app test covers the complete header with an imported image, then deletes
it and checks exact pixel restoration. The accessible Sample heading remains in
the DOM, and the new-species action still works. This does not yet migrate that
button's paint, other text, menus, sliders or the remaining full UI composition.

Reproduce with `shared-header-native.spec.ts` and `shared-header.spec.ts`.
Final verification: 2,917 unit tests, 695 browser tests (one intentional skip),
four production tests and build pass. Native capture repeats and independently
reverifies all four scenes and two text textures. Shared rendering is still
behind its development flag; original-release GUI, platform and final acceptance
gates remain open.
