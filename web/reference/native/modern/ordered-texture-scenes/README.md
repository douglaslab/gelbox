# Ordered texture reference

Ten native RGB images cover five scenes at DPR1/2: scaled straight-alpha textures,
tint and flipped UVs, physical clipping/translation, linear/nearest filtering and
mip selection, premultiplied tint/opacity, repeat addressing, additive textures,
and later source-over texture/mesh operations. Each scene uses one native CGL
RGBA8 MSAA4 surface with explicit normalized UVs and display-domain RGBA8 inputs.

```sh
python3 reference/native/modern/ordered-texture-scenes/capture.py
```

Both capture runs must agree; a fresh invocation verifies retained RGB pixels.
The manifest pins cases, driver, texture bytes, executable and native source.
`--update` explicitly regenerates references; `--output PATH` retains raw runs.

`textures.json` contains straight and premultiplied 4×4 diagnostic images. The
straight texture includes deliberately distinctive 2×2 and 1×1 mip levels so the
reference detects which levels/filter are actually used. These are supplied mip
inputs, not a claim that browser mip generation matches native glGenerateMipmap.

Native asset policy is broader than the default sampler:

- Legacy Cinder TextureBase::Format defaults to linear min/mag, clamp-to-edge,
  and no mipmapping.
- Gelbox Layout::uiImageWithPath explicitly enables mipmaps, causing Cinder's
  default min filter to become linear-mipmap-linear. It selects the @2x asset
  only at native content scale exactly2, falling back to the ordinary asset.
- Layout::renderText uses TextLayout::render(true); the second premultiplied
  argument defaults false. Heading/UI text textures therefore carry straight
  alpha and do not opt into mipmaps.

The manifest records the relevant pinned Layout.cpp, Texture.cpp and Text.h
hashes. Actual image decoding, asset selection, generated mip levels, glyph
raster, arbitrary transforms/fractional DPR and original GUI replay remain
separate acceptance work. This is a constructed backend draw-state reference.
