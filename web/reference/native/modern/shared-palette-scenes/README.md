# Native palette drawing reference

`capture.py` compiles the pinned Gelbox palette layout, rectangle calculation and
draw methods with its actual FragmentView colors and Layout. A minimal adapter
supplies frame/bounds storage and a headless modern Cinder context. Each of the
12 selections is drawn at DPR 1 and 2 with translucent geometry before and after
it: 48 RGBA8 MSAA4 scenes, each rendered twice and checked byte for byte.

Run `python3 reference/native/modern/shared-palette-scenes/capture.py` to rebuild
and verify. `--update` explicitly replaces references. The manifest records source,
input and artifact hashes, renderer, and limitations. This is a modern Cinder
source-method reference, not a full original-release GUI certificate.

Readback uses a scoped texture binding. Leaving a readback texture bound across
FBO destruction exposed the pinned Cinder Context::textureDeleted cache issue
(the conditional clears bindings unequal to the deleted ID). Reusing that ID at
the second scale produced an incomplete framebuffer. Restoring the prior binding
avoids that harness lifetime problem without altering native drawing code.
