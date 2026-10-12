# Native reference image capture

`capture.py` builds and runs real Cinder image decoding, Texture2d mip generation,
and pinned Gelbox ImageView drawing in an offscreen CGL RGBA8 MSAA4 target.
`draw`, `drawFrame` and `calcResizeBox` are extracted verbatim from ImageView.cpp
at the Gelbox commit recorded in manifest.json. A small adapter supplies frame,
image and focus state; modern Cinder supplies the graphics implementation.

Run `python3 reference/native/modern/shared-image-scenes/capture.py` from the
repository root. The local Cinder release library and pinned clean checkout are
required. Each invocation captures twice, checks repeat equality, then checks the
retained ten PNGs and raw texture JSON. `--update` explicitly replaces references.

The two RGBA8 PNGs include transparent pixels with nonzero hidden RGB. Their
pattern is R=(17x+3y)%256, G=(5x+19y)%256, B=(11x+7y)%256 and
A=[0,64,128,255][(floor(x/7)+floor(y/5))%4], at 128x64 and 61x37.
`textures.json` retains unmodified native bottom-up RGBA data for all mip levels.

This is actual native decoding and source-extracted drawing on modern Cinder,
not an original-release GUI capture. It covers these 8-bit PNG assets only;
JPEG/GIF, embedded profiles, EXIF orientation and 16-bit decoding require separate
evidence. Source, executable, input and capture hashes are in manifest.json.
